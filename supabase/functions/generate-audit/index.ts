// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-audit-internal",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PRIMARY_MODEL = "google/gemini-3.1-pro-preview";
const FALLBACK_MODEL = "openai/gpt-5-mini";

const PRIMARY_CALL_TIMEOUT_MS = 85_000;
const FALLBACK_CALL_TIMEOUT_MS = 45_000;
const FALLBACK_BACKOFF_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 5_000;
const MAX_LOG_ENTRIES = 200;

// ===== Coverage checklist (mirror of src/data/audit-coverage.ts) =====
type StatusHint = "active" | "partial" | "doc_only" | "sandbox" | "planned";
interface CoverageItem { id: string; pillar: string; title_pt: string; expected: StatusHint; evidence: string; }
const COVERAGE: CoverageItem[] = [
  { id: "auth-rls", pillar: "Plataforma & Infraestrutura", title_pt: "Autenticação, papéis e RLS", expected: "active", evidence: "user_roles, profiles, is_admin/has_role" },
  { id: "edge-functions", pillar: "Plataforma & Infraestrutura", title_pt: "Edge Functions (catálogo, papéis, JWT)", expected: "active", evidence: "67+ funções em supabase/functions/*" },
  { id: "storage-buckets", pillar: "Plataforma & Infraestrutura", title_pt: "Buckets de Storage", expected: "active", evidence: "study_pdfs, pet_exams_pdfs, audit-reports" },
  { id: "design-system", pillar: "Plataforma & Infraestrutura", title_pt: "Design System & tokens semânticos", expected: "active", evidence: "index.css + tailwind.config.ts" },
  { id: "curation-7-stages", pillar: "Pipeline de Curadoria", title_pt: "Pipeline de 7 estágios (PDF → triplets → KG → recomendação)", expected: "active", evidence: "parse-study, vectorize-study, extract-study-entities, process-study, sync-study-to-neo4j" },
  { id: "vectorization-pre-curation", pillar: "Pipeline de Curadoria", title_pt: "Vetorização como pré-requisito da curadoria", expected: "active", evidence: "study_embeddings + extract-study-entities" },
  { id: "evidence-conflicts", pillar: "Pipeline de Curadoria", title_pt: "Conflitos de evidência e resolução canônica", expected: "active", evidence: "tab evidence-conflicts, enrich-triplet" },
  { id: "study-duplicates", pillar: "Pipeline de Curadoria", title_pt: "Detecção de duplicatas (SHA-256 + Levenshtein)", expected: "active", evidence: "fileHashUtils nos uploads" },
  { id: "kg-5-layers", pillar: "Knowledge Graph", title_pt: "Modelo de 5 camadas (Compostos · Mecanismos · Pathways · Condições · Outcomes)", expected: "active", evidence: "medical_knowledge_graph + hierarchical_edges" },
  { id: "kg-taxonomy", pillar: "Knowledge Graph", title_pt: "Taxonomia SNOMED-CT VetSCT + UMLS", expected: "active", evidence: "biomedical-taxonomy.ts + ontology hub" },
  { id: "kg-gap-fill", pillar: "Knowledge Graph", title_pt: "Pipeline gap-fill PubMed + Gemini", expected: "active", evidence: "kg-missing-triplets, backfill-triplet-enrichment" },
  { id: "kg-curation-gatekeeper", pillar: "Knowledge Graph", title_pt: "Gatekeeper (auto-approve ≥50%, HITL caso contrário)", expected: "active", evidence: "triplet_extractions.curation_status" },
  { id: "ai-scientist-roadmap", pillar: "AI Scientist", title_pt: "Kanban de Priorizações + histórico de movimentações", expected: "active", evidence: "prioritization_history, prioritization_overrides" },
  { id: "ai-scientist-synthetic-cohorts", pillar: "AI Scientist", title_pt: "Cohorts sintéticos + suggest-cohort-ideas com originalidade", expected: "active", evidence: "synthetic_cohorts, cohort_suggestions, check-cohort-originality" },
  { id: "ai-scientist-population-insights", pillar: "AI Scientist", title_pt: "Population Insights v0 + validação vet-curador", expected: "active", evidence: "cohort_insights.vet_review_status" },
  { id: "ai-scientist-predictive-models", pillar: "AI Scientist", title_pt: "Catálogo de 6 modelos preditivos ancorados em cohorts", expected: "active", evidence: "predictiveModelsData.ts" },
  { id: "core-rules", pillar: "Fundamentos Arquiteturais (Meta-KG)", title_pt: "Regras-Core (RC-NNN) com runtime_effect e justificativa", expected: "active", evidence: "core_rules, core_rule_evidence, core_rule_modulators" },
  { id: "meta-studies", pillar: "Fundamentos Arquiteturais (Meta-KG)", title_pt: "Meta-estudos arquiteturais + modulators translacionais", expected: "active", evidence: "meta_studies + evaluate-meta-study-reliability" },
  { id: "meta-kg-sandbox", pillar: "Fundamentos Arquiteturais (Meta-KG)", title_pt: "Sandbox / Kanban do Meta-KG", expected: "partial", evidence: "MetaStudyKanban + IngestaoMetaEstudo" },
  { id: "patient-analysis", pillar: "Análise do Paciente & Recomendação Híbrida", title_pt: "Análise do paciente (6 estágios)", expected: "active", evidence: "tab pet-management + condition-insights" },
  { id: "hybrid-recommendation", pillar: "Análise do Paciente & Recomendação Híbrida", title_pt: "Motor de recomendação híbrida (limite de 8 compostos)", expected: "active", evidence: "calculate-recommendation-confidence" },
  { id: "breed-predispositions", pillar: "Análise do Paciente & Recomendação Híbrida", title_pt: "Predisposições por raça (81 raças)", expected: "active", evidence: "breeds + breed_predispositions" },
  { id: "lab-references", pillar: "Análise do Paciente & Recomendação Híbrida", title_pt: "Referências laboratoriais caninas", expected: "active", evidence: "lab_ranges + lab-flag-canonicalizer" },
  { id: "pet-food-coverage", pillar: "Análise do Paciente & Recomendação Híbrida", title_pt: "Catálogo de rações + cobertura nutricional", expected: "active", evidence: "tabs pet-food-* + bulk-enrich-pet-food" },
  { id: "digital-twin", pillar: "Digital Twin & Projeções", title_pt: "Digital Twin & projeções de longevidade (Gompertz por raça)", expected: "active", evidence: "condition-progression-engine.ts + proposal-roi.ts" },
  { id: "treatment-proposal", pillar: "Digital Twin & Projeções", title_pt: "Sistema de propostas terapêuticas (cronograma + ROI)", expected: "active", evidence: "ProposalAIChat + tab custo-beneficio" },
  { id: "compliance-fda", pillar: "Conformidade Regulatória", title_pt: "Conformidade FDA", expected: "partial", evidence: "tab compliance" },
  { id: "compliance-ema", pillar: "Conformidade Regulatória", title_pt: "Conformidade EMA", expected: "partial", evidence: "tab compliance" },
  { id: "compliance-avma", pillar: "Conformidade Regulatória", title_pt: "Conformidade AVMA", expected: "partial", evidence: "tab compliance" },
  { id: "compliance-gmlp", pillar: "Conformidade Regulatória", title_pt: "Good Machine Learning Practice (GMLP)", expected: "partial", evidence: "tab compliance" },
  { id: "bilingual-parity", pillar: "Bilíngue PT/EN", title_pt: "Paridade PT/EN (chaves i18n, dados estáticos e DB)", expected: "active", evidence: "translate-text, run-translation-audit, name_en" },
  { id: "i18n-versioning", pillar: "Bilíngue PT/EN", title_pt: "I18N_VERSION + cache-busting", expected: "active", evidence: "src/i18n.ts I18N_VERSION incremental" },
  { id: "ai-prompts-governance", pillar: "Operações & Governança", title_pt: "AI Prompts (versionamento + ativo por tarefa/modelo)", expected: "active", evidence: "ai_prompt_versions + activate_ai_prompt_version" },
  { id: "analytics", pillar: "Operações & Governança", title_pt: "Analytics e métricas operacionais", expected: "active", evidence: "tab analytics + api-usage-stats" },
  { id: "demo-data-governance", pillar: "Operações & Governança", title_pt: "Governança de dados de demo (is_demo + bulk-delete protegido)", expected: "active", evidence: "flag is_demo em pets" },
  { id: "no-mock-policy", pillar: "Operações & Governança", title_pt: "Política No-Mock", expected: "active", evidence: "regra core do projeto" },
  { id: "clinical-monitoring", pillar: "Sandbox & Planejado", title_pt: "Monitoramento clínico longitudinal (RWPM)", expected: "partial", evidence: "tab clinical-monitoring" },
  { id: "invoxia-integration", pillar: "Sandbox & Planejado", title_pt: "Integração Invoxia", expected: "sandbox", evidence: "invoxia-api edge function" },
];

type LogLevel = "info" | "warn" | "error";
type LogPhase = "outline" | "block" | "cierre" | "validate" | "save" | "watchdog" | "system";
interface LogEntry {
  ts: string;
  level: LogLevel;
  phase: LogPhase;
  message: string;
  block_id?: string;
  duration_ms?: number;
  attempt?: number;
}

interface StoredBlock {
  block_id: string;
  pillar_title: string;
  html: string;
}

interface OutlineState {
  title: string;
  blocks: Array<any>;
  rendered_blocks?: StoredBlock[];
  block_warnings?: string[];
  skipped_blocks?: string[];
  close?: {
    exec_summary_html: string;
    summary: Record<string, any>;
  };
  finalized?: boolean;
}

function groupCoverage() {
  const map = new Map<string, CoverageItem[]>();
  for (const i of COVERAGE) {
    if (!map.has(i.pillar)) map.set(i.pillar, []);
    map.get(i.pillar)!.push(i);
  }
  return Array.from(map.entries()).map(([pillar, items]) => ({ pillar, items }));
}

function checklistForPrompt() {
  return groupCoverage()
    .map((g) => `## ${g.pillar}\n${g.items.map((i) => `- [${i.id}] ${i.title_pt} — evidência: ${i.evidence} (hint: ${i.expected})`).join("\n")}`)
    .join("\n\n");
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assessCoverage(html: string) {
  const lower = html.toLowerCase();
  const missing: CoverageItem[] = [];
  for (const item of COVERAGE) {
    const idHit = lower.includes(`id="${item.id}"`) || lower.includes(`id='${item.id}'`);
    const titleHit = lower.includes(item.title_pt.toLowerCase().slice(0, 22));
    if (!idHit && !titleHit) missing.push(item);
  }
  return {
    missing,
    words: stripHtml(html).split(" ").filter(Boolean).length,
    h2: (html.match(/<h2\b/gi) ?? []).length,
    tables: (html.match(/<table\b/gi) ?? []).length,
  };
}

function asObject<T extends Record<string, any>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? value as T : fallback;
}

function normalizeOutline(raw: unknown): OutlineState | null {
  const value = asObject(raw as Record<string, any> | null, {} as Record<string, any>);
  if (!Array.isArray(value.blocks)) return null;
  return {
    title: typeof value.title === "string" ? value.title : "Auditoria técnica",
    blocks: value.blocks,
    rendered_blocks: Array.isArray(value.rendered_blocks) ? value.rendered_blocks as StoredBlock[] : [],
    block_warnings: Array.isArray(value.block_warnings) ? value.block_warnings.filter((x: unknown) => typeof x === "string") : [],
    skipped_blocks: Array.isArray(value.skipped_blocks) ? value.skipped_blocks.filter((x: unknown) => typeof x === "string") : [],
    close: value.close && typeof value.close === "object" ? value.close as OutlineState["close"] : undefined,
    finalized: Boolean(value.finalized),
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function readAuditContext(service: ReturnType<typeof createClient>) {
  const snapshot: Record<string, any> = {};
  const tableNames = [
    "studies", "study_embeddings", "triplet_extractions", "medical_knowledge_graph", "medical_knowledge_graph_edges",
    "hierarchical_edges", "pets", "pet_conditions", "pet_exams", "pet_consultations", "pet_medications", "breeds",
    "breed_predispositions", "lab_ranges", "core_rules", "meta_studies", "core_rule_evidence", "core_rule_modulators",
    "synthetic_cohorts", "cohort_suggestions", "cohort_insights", "prioritization_history", "prioritization_overrides",
    "user_roles", "profiles", "access_requests", "ai_prompt_versions", "technical_audits", "health_conditions",
    "nutraceuticals", "nutraceutical_conditions",
  ];
  const counts: Record<string, number | null> = {};
  await Promise.all(tableNames.map(async (table) => {
    try {
      const { count } = await service.from(table).select("*", { count: "exact", head: true });
      counts[table] = count ?? 0;
    } catch {
      counts[table] = null;
    }
  }));
  snapshot.counts = counts;

  let prevAuditsCtx = "";
  try {
    const { data: prevAudits } = await service
      .from("technical_audits")
      .select("version, audit_date, system_version, summary")
      .order("audit_date", { ascending: false })
      .limit(6);
    prevAuditsCtx = JSON.stringify((prevAudits ?? []).map((audit: any) => ({
      version: audit.version,
      date: audit.audit_date,
      i18n: audit.system_version,
      sections: audit.summary?.sections,
      pages: audit.summary?.pages,
      strengths: audit.summary?.strengths,
      gaps: audit.summary?.gaps,
      risks: audit.summary?.risks,
    })));
  } catch {
    prevAuditsCtx = "[]";
  }

  return { snapshot, prevAuditsCtx };
}

function buildBaseSystem(auditContext: { snapshot: Record<string, any>; prevAuditsCtx: string }) {
  return `Você é o auditor técnico interno da plataforma Senex AI (PetMoreTime).
NUNCA mencione "Lovable", "Lovable AI" ou ferramentas de desenvolvimento. Use "Senex AI" como marca e "PetMoreTime" como motor.
Escreva em PORTUGUÊS, denso, analítico, em HTML semântico.

POLÍTICA OBRIGATÓRIA:
- Toda auditoria é standalone e cumulativa. Nunca produza "teste rápido", "smoke" ou "delta-only".
- Profundidade-alvo equivalente ou superior à V3 (30+ páginas, 25+ seções h2, 8+ tabelas).
- Cada item do checklist canônico precisa aparecer como subseção com id estável.
- Áreas existentes mas incompletas → classifique como "parcial", "doc-only", "sandbox" ou "planejado" e descreva o gap. NUNCA omita.

VISUALIZAÇÕES OBRIGATÓRIAS (gráficos, diagramas, infográficos):
- O relatório DEVE conter elementos visuais ricos além de tabelas. NÃO use bibliotecas externas — emita SVG inline puro (sem <script>, sem <foreignObject>) e divs com classes utilitárias já existentes no CSS do relatório.
- Mínimo por relatório completo: 6 gráficos SVG + 3 diagramas SVG + 4 infográficos (cards/KPIs/heatmaps em HTML+SVG).
- Distribua: cada bloco principal deve ter pelo menos 1 visual (gráfico OU diagrama OU infográfico) coerente com o tema da seção.
- Tipos aceitos (escolha o mais adequado ao dado):
  * Gráfico de barras horizontais/verticais (SVG <rect>) — para coberturas, contagens, comparações.
  * Gráfico de rosca/donut (SVG <circle stroke-dasharray>) — para proporções (ex.: parity PT/EN, FDA covered/partial/missing).
  * Heatmap / matriz (grid de <rect>) — para maturidade por pilar, risco × impacto.
  * Diagrama de fluxo / pipeline (SVG com <rect>, <path>, <text>) — para arquitetura, fluxo de curadoria, ciclo de vida.
  * Diagrama de camadas (ontologia 5-layer, stack de runtime) — caixas empilhadas com legendas.
  * Infográfico de KPIs — grid <div class="kpi-grid"> com cards <div class="kpi"><span class="kpi-value">N</span><span class="kpi-label">…</span></div>.
  * Timeline horizontal — SVG com linha + marcos para versões/auditorias.
- Cores SEMPRE via paleta do relatório: #1d4ed8 (accent), #16a34a (ok), #b45309 (warn), #dc2626 (gap), #4b5563 (muted), #e5e7eb (soft). Não inventar cores.
- TODO visual precisa de <figcaption> ou <p class="caption"> explicando o que representa e a fonte (snapshot, checklist, auditorias anteriores).
- Os números nos visuais devem refletir o SNAPSHOT FACTUAL (não invente). Se o dado não estiver disponível, marque "n/d" no eixo/label e descreva no caption.
- NUNCA use emoji em vez de visual. NUNCA use ASCII art. NUNCA referencie imagens externas (sem <img src=...>).

CHECKLIST CANÔNICO (todos os ids devem aparecer no relatório):
${checklistForPrompt()}

SNAPSHOT FACTUAL DO BANCO (use números reais):
${JSON.stringify(auditContext.snapshot, null, 2)}

AUDITORIAS ANTERIORES (contexto):
${auditContext.prevAuditsCtx}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String((body as any)?.action ?? "start");
    const authHeader = req.headers.get("Authorization") ?? "";
    const apiKeyHeader = req.headers.get("apikey") ?? "";
    const internalHeader = req.headers.get("x-audit-internal") ?? "";
    const isInternal = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` || apiKeyHeader === SUPABASE_SERVICE_ROLE_KEY || internalHeader === SUPABASE_SERVICE_ROLE_KEY;

    if (!isInternal) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await userClient.rpc("is_admin");
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "progress") {
      const id = String((body as any).audit_id ?? "").toLowerCase();
      if (!id) {
        return new Response(JSON.stringify({ error: "audit_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: row } = await service
        .from("technical_audits")
        .select("id, html_path, summary, updated_at, progress_log, last_heartbeat, resume_count")
        .eq("id", id)
        .maybeSingle();
      const summary = asObject(row?.summary, {} as Record<string, any>);
      const log = Array.isArray((row as any)?.progress_log) ? (row as any).progress_log : [];
      return new Response(JSON.stringify({
        audit_id: id,
        status: summary.status ?? (row ? "unknown" : "missing"),
        stage: summary.stage ?? null,
        stage_label: summary.stage_label ?? null,
        progress: typeof summary.progress === "number" ? summary.progress : null,
        blocks_done: typeof summary.blocks_done === "number" ? summary.blocks_done : null,
        blocks_total: typeof summary.blocks_total === "number" ? summary.blocks_total : null,
        warnings: Array.isArray(summary.warnings) ? summary.warnings : null,
        coverage_missing: Array.isArray(summary.coverage_missing) ? summary.coverage_missing : null,
        log: log.slice(-30),
        last_heartbeat: (row as any)?.last_heartbeat ?? null,
        resume_count: (row as any)?.resume_count ?? 0,
        error: summary.error ?? null,
        html_path: row?.html_path ?? null,
        updated_at: row?.updated_at ?? null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fix_mime") {
      const { data: rows } = await service.from("technical_audits").select("id, html_path").not("html_path", "is", null);
      const results: any[] = [];
      for (const row of (rows ?? []) as Array<{ id: string; html_path: string }>) {
        const match = row.html_path.match(/audit-reports\/(.+)$/);
        if (!match) {
          results.push({ id: row.id, skipped: true });
          continue;
        }
        const download = await fetch(row.html_path);
        if (!download.ok) {
          results.push({ id: row.id, error: `download ${download.status}` });
          continue;
        }
        const html = await download.text();
        const { error } = await service.storage
          .from("audit-reports")
          .upload(match[1], new TextEncoder().encode(html), { upsert: true, contentType: "text/html; charset=utf-8" });
        results.push({ id: row.id, ok: !error, error: error?.message });
      }
      return new Response(JSON.stringify({ fixed: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const version = String((body as any)?.version ?? "").trim();
    const scope = String((body as any)?.scope ?? "").trim();
    const systemVersion = String((body as any)?.system_version ?? "").trim();
    const systemChangelogDate = (body as any)?.system_changelog_date ?? null;
    if (!version) {
      return new Response(JSON.stringify({ error: "version required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "start" && !scope) {
      return new Response(JSON.stringify({ error: "scope required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auditId = version.toLowerCase().startsWith("v") ? version.toLowerCase() : `v${version.toLowerCase()}`;
    const numericVersion = auditId.replace(/^v/, "");
    const isResume = action === "resume";
    const isContinue = action === "continue";

    let auditRow: any;
    if (isResume || isContinue) {
      const { data: existing } = await service.from("technical_audits").select("*").eq("id", auditId).maybeSingle();
      if (!existing) {
        return new Response(JSON.stringify({ error: "audit not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      auditRow = existing;
      const summary = asObject(existing.summary, {} as Record<string, any>);
      await service.from("technical_audits").update({
        summary: {
          ...summary,
          status: "processing",
          stage: isResume ? "resuming" : (summary.stage ?? "processing"),
          stage_label: isResume ? "Retomando…" : (summary.stage_label ?? "Continuando…"),
          error: null,
        },
        resume_count: isResume ? Number(existing.resume_count ?? 0) + 1 : Number(existing.resume_count ?? 0),
        last_heartbeat: new Date().toISOString(),
      }).eq("id", auditId);
    } else {
      const initialSummary = {
        status: "processing",
        generator: "senex-ai",
        model: PRIMARY_MODEL,
        stage: "queued",
        stage_label: "Na fila",
        progress: 2,
        blocks_done: 0,
        blocks_total: 0,
        warnings: [] as string[],
      };
      const { data, error } = await service.from("technical_audits").upsert({
        id: auditId,
        version: numericVersion,
        audit_date: new Date().toISOString().slice(0, 10),
        system_version: systemVersion,
        system_changelog_date: systemChangelogDate,
        scope,
        scope_history: [],
        html_path: null,
        pdf_path: null,
        docx_path: null,
        summary: initialSummary,
        superseded_by: null,
        outline: null,
        progress_log: [],
        last_heartbeat: new Date().toISOString(),
        resume_count: 0,
      }).select("*").single();
      if (error) throw error;
      auditRow = data;
    }

    async function refreshAuditRow() {
      const { data } = await service.from("technical_audits").select("*").eq("id", auditId).maybeSingle();
      return data;
    }

    async function updateSummary(patch: Record<string, any>) {
      const { data: current } = await service.from("technical_audits").select("summary").eq("id", auditId).maybeSingle();
      const merged = { ...asObject(current?.summary, {} as Record<string, any>), ...patch };
      await service.from("technical_audits").update({ summary: merged, last_heartbeat: new Date().toISOString() }).eq("id", auditId);
      return merged;
    }

    async function saveOutline(nextOutline: OutlineState) {
      await service.from("technical_audits").update({ outline: nextOutline, last_heartbeat: new Date().toISOString() }).eq("id", auditId);
    }

    async function pushLog(entry: Omit<LogEntry, "ts">) {
      const full: LogEntry = { ts: new Date().toISOString(), ...entry };
      try {
        const { data: row } = await service.from("technical_audits").select("progress_log").eq("id", auditId).maybeSingle();
        const prev = Array.isArray(row?.progress_log) ? row.progress_log as LogEntry[] : [];
        const next = [...prev, full].slice(-MAX_LOG_ENTRIES);
        await service.from("technical_audits").update({ progress_log: next, last_heartbeat: full.ts }).eq("id", auditId);
      } catch (error) {
        console.warn("pushLog failed", error);
      }
      console.log(`[audit ${auditId}] ${full.level.toUpperCase()} ${full.phase}: ${full.message}`);
    }

    async function heartbeat() {
      try {
        await service.from("technical_audits").update({ last_heartbeat: new Date().toISOString() }).eq("id", auditId);
      } catch {
        // noop
      }
    }

    async function setStage(stage: string, label: string, progress: number, extra: Record<string, any> = {}) {
      await updateSummary({ ...extra, status: "processing", stage, stage_label: label, progress });
    }

    async function triggerContinuation(nextAction: "continue" | "resume" = "continue") {
      const latest = await refreshAuditRow();
      if (!latest) return;
      const nextPayload = {
        action: nextAction,
        version: latest.version ? `v${latest.version}` : auditId,
        scope: latest.scope ?? scope,
        system_version: latest.system_version ?? systemVersion,
        system_changelog_date: latest.system_changelog_date ?? systemChangelogDate,
      };
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-audit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          "x-audit-internal": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify(nextPayload),
      });
      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`continuation ${response.status}: ${bodyText.slice(0, 300)}`);
      }
    }

    async function callToolWithTimeout(messages: any[], tool: any, model: string, timeoutMs: number) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            tools: [tool],
            tool_choice: { type: "function", function: { name: tool.function.name } },
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`${model} → ${response.status}: ${text.slice(0, 300)}`);
        }
        const data = await response.json();
        const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!args) throw new Error(`${model} returned no tool_call`);
        return JSON.parse(args);
      } finally {
        clearTimeout(timer);
      }
    }

    async function resilientCall(messages: any[], tool: any, opts: { phase: LogPhase; label: string; block_id?: string }) {
      const attempts = [
        { model: PRIMARY_MODEL, timeoutMs: PRIMARY_CALL_TIMEOUT_MS, backoffMs: 0 },
        { model: FALLBACK_MODEL, timeoutMs: FALLBACK_CALL_TIMEOUT_MS, backoffMs: FALLBACK_BACKOFF_MS },
      ];
      let lastError: any;
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        if (attempt.backoffMs > 0) await new Promise((resolve) => setTimeout(resolve, attempt.backoffMs));
        const hb = setInterval(() => { heartbeat().catch(() => {}); }, HEARTBEAT_INTERVAL_MS);
        const startedAt = Date.now();
        try {
          await pushLog({
            level: "info",
            phase: opts.phase,
            block_id: opts.block_id,
            attempt: i + 1,
            message: `${opts.label} — tentativa ${i + 1}/${attempts.length} (${attempt.model})`,
          });
          const output = await callToolWithTimeout(messages, tool, attempt.model, attempt.timeoutMs);
          await pushLog({
            level: "info",
            phase: opts.phase,
            block_id: opts.block_id,
            attempt: i + 1,
            duration_ms: Date.now() - startedAt,
            message: `${opts.label} — ok (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
          });
          return output;
        } catch (error: any) {
          lastError = error;
          const reason = error?.name === "AbortError" ? `timeout >${Math.round(attempt.timeoutMs / 1000)}s` : (error?.message ?? String(error));
          await pushLog({
            level: "warn",
            phase: opts.phase,
            block_id: opts.block_id,
            attempt: i + 1,
            duration_ms: Date.now() - startedAt,
            message: `${opts.label} — falha (${reason})`,
          });
        } finally {
          clearInterval(hb);
        }
      }
      throw lastError ?? new Error("all LLM attempts failed");
    }

    const backgroundJob = (async () => {
      try {
        const latest = await refreshAuditRow();
        if (!latest) throw new Error("audit row missing before background job");
        const currentSummary = asObject(latest.summary, {} as Record<string, any>);
        if (["ready", "ready_with_warnings", "failed"].includes(String(currentSummary.status ?? ""))) {
          return;
        }

        if (isResume) {
          await pushLog({ level: "warn", phase: "watchdog", message: `Retomada acionada (resume_count=${Number(latest.resume_count ?? 0)})` });
        } else if (!isContinue) {
          await pushLog({ level: "info", phase: "system", message: "Iniciando geração" });
        }

        const refreshedSummary = asObject((await refreshAuditRow())?.summary, {} as Record<string, any>);
        const auditContext = asObject(refreshedSummary.audit_context, {} as Record<string, any>);
        let snapshot = auditContext.snapshot as Record<string, any> | undefined;
        let prevAuditsCtx = typeof auditContext.prevAuditsCtx === "string" ? auditContext.prevAuditsCtx : undefined;
        if (!snapshot || !prevAuditsCtx) {
          const computed = await readAuditContext(service);
          snapshot = computed.snapshot;
          prevAuditsCtx = computed.prevAuditsCtx;
          await updateSummary({ audit_context: computed });
        }

        const baseSystem = buildBaseSystem({ snapshot: snapshot!, prevAuditsCtx: prevAuditsCtx! });
        const currentRow = await refreshAuditRow();
        if (!currentRow) throw new Error("audit row missing");
        const effectiveScope = String(currentRow.scope ?? scope ?? "");
        const effectiveSystemVersion = String(currentRow.system_version ?? systemVersion ?? "");
        const effectiveChangelogDate = currentRow.system_changelog_date ?? systemChangelogDate ?? null;
        let outline = normalizeOutline(currentRow.outline);

        if (!outline) {
          await setStage("outlining", "Montando estrutura do relatório", 8, { blocks_done: 0, blocks_total: 0 });
          const outlineTool = {
            type: "function",
            function: {
              name: "emit_outline",
              description: "Índice completo do relatório por pilar.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        block_id: { type: "string" },
                        pillar_title: { type: "string" },
                        sections: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              section_id: { type: "string" },
                              title: { type: "string" },
                              bullets: { type: "array", items: { type: "string" } },
                            },
                            required: ["section_id", "title", "bullets"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["block_id", "pillar_title", "sections"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "blocks"],
                additionalProperties: false,
              },
            },
          };
          const generatedOutline = await resilientCall([
            { role: "system", content: baseSystem },
            {
              role: "user",
              content: `Auditoria ${auditId} (i18n ${effectiveSystemVersion || "n/a"}).
ESCOPO DO USUÁRIO (ênfases adicionais — não substitui o checklist):
${effectiveScope}

Monte o ÍNDICE: um bloco por pilar do checklist + blocos extras (sumário executivo já será gerado separado, então NÃO o inclua; inclua: mudanças desde versão anterior, comparação histórica, forças, gaps e riscos consolidados, roadmap, apêndices, bibliografia). Cada seção tem 3-6 bullets. TODOS os section_id do checklist canônico devem aparecer pelo menos uma vez.`,
            },
          ], outlineTool, { phase: "outline", label: "Outline" });
          outline = {
            title: String(generatedOutline.title ?? `Auditoria técnica ${auditId.toUpperCase()}`),
            blocks: Array.isArray(generatedOutline.blocks) ? generatedOutline.blocks : [],
            rendered_blocks: [],
            block_warnings: [],
            skipped_blocks: [],
          };
          await saveOutline(outline);
          await setStage("blocks", `Gerando ${outline.blocks.length + 1} blocos`, 15, {
            blocks_done: 0,
            blocks_total: outline.blocks.length + 1,
          });
          await pushLog({ level: "info", phase: "outline", message: "Checkpoint salvo após outline" });
          await triggerContinuation("continue");
          return;
        }

        const totalBlocks = outline.blocks.length + 1;
        const renderedBlocks = Array.isArray(outline.rendered_blocks) ? outline.rendered_blocks : [];
        const renderedBlockIds = new Set(renderedBlocks.map((item) => item.block_id));
        const skippedBlockIds = new Set(Array.isArray(outline.skipped_blocks) ? outline.skipped_blocks : []);
        const nextBlockIndex = outline.blocks.findIndex((block: any) => !renderedBlockIds.has(block.block_id) && !skippedBlockIds.has(block.block_id));

        if (nextBlockIndex >= 0) {
          const block = outline.blocks[nextBlockIndex];
          const pct = 15 + Math.round(((nextBlockIndex + 0.5) / totalBlocks) * 70);
          await setStage("blocks", `Bloco ${nextBlockIndex + 1}/${totalBlocks}: ${block.pillar_title}`, pct, {
            blocks_done: renderedBlocks.length,
            blocks_total: totalBlocks,
          });

          const blockTool = {
            type: "function",
            function: {
              name: "emit_block",
              description: "HTML denso de um bloco.",
              parameters: {
                type: "object",
                properties: {
                  html: { type: "string" },
                  warnings: { type: "array", items: { type: "string" } },
                },
                required: ["html"],
                additionalProperties: false,
              },
            },
          };

          const messages = [
            { role: "system", content: baseSystem },
            {
              role: "user",
              content: `Renderize o bloco "${block.pillar_title}" (block_id=${block.block_id}). Use exatamente os section_id propostos.

SEÇÕES:
${(block.sections ?? []).map((section: any) => `- ${section.section_id} · ${section.title}\n  bullets:\n  ${(section.bullets ?? []).map((bullet: string) => `· ${bullet}`).join("\n  ")}`).join("\n\n")}

REGRAS:
- Envolva em <section id="${block.block_id}"> com <h2>${block.pillar_title}</h2>.
- Para cada seção: <section id="SECTION_ID"><h3>...</h3>...</section>.
- Texto denso (≥ 180 palavras por seção), analítico, em PT.
- Inclua ao menos 1 <table> elegante por bloco.
- Inclua ao menos 1 visual (gráfico SVG, diagrama SVG ou infográfico em <div class="kpi-grid">) por bloco, posicionado logo após a primeira tabela, com <p class="caption">… (fonte: snapshot|checklist|auditoria anterior)</p>.
- Use SVG inline puro (viewBox, <rect>, <circle>, <path>, <text>) — sem <script>, sem <img>, sem <foreignObject>, sem bibliotecas externas. Paleta restrita: #1d4ed8 #16a34a #b45309 #dc2626 #4b5563 #e5e7eb.
- Os números no visual devem espelhar o snapshot factual ou o checklist canônico. Se faltar dado, marque "n/d" e explique no caption.
- Se algo não estiver implementado, marque "Status: parcial/doc-only/sandbox/planejado" e descreva o gap.
- NÃO emita <html>, <head>, <body> ou <style>. Apenas fragment HTML.`,
            },
          ];

          try {
            const attempt = await resilientCall(messages, blockTool, {
              phase: "block",
              block_id: block.block_id,
              label: `Bloco ${nextBlockIndex + 1}/${totalBlocks} (${block.pillar_title})`,
            });
            const mergedBlocks = [
              ...renderedBlocks.filter((item) => item.block_id !== block.block_id),
              { block_id: block.block_id, pillar_title: block.pillar_title, html: String(attempt.html ?? "") },
            ];
            outline = {
              ...outline,
              rendered_blocks: mergedBlocks,
              block_warnings: uniqueStrings([...(outline.block_warnings ?? []), ...((Array.isArray(attempt.warnings) ? attempt.warnings : []) as string[])]),
            };
            await saveOutline(outline);
            await pushLog({ level: "info", phase: "block", block_id: block.block_id, message: `Checkpoint salvo após bloco ${block.block_id}` });
          } catch (error: any) {
            const reason = error?.message ?? String(error);
            outline = {
              ...outline,
              rendered_blocks: [
                ...renderedBlocks.filter((item) => item.block_id !== block.block_id),
                {
                  block_id: block.block_id,
                  pillar_title: block.pillar_title,
                  html: `<section id="${block.block_id}" class="block-gap"><h2>${block.pillar_title} — Lacuna de geração</h2><p>Bloco não pôde ser gerado após 2 tentativas. Motivo: ${reason}. Re-execute para preencher.</p></section>`,
                },
              ],
              skipped_blocks: uniqueStrings([...(outline.skipped_blocks ?? []), block.block_id]),
              block_warnings: uniqueStrings([...(outline.block_warnings ?? []), `bloco ${block.block_id}: PULADO após 2 tentativas (${reason})`]),
            };
            await saveOutline(outline);
            await pushLog({ level: "error", phase: "block", block_id: block.block_id, message: `Bloco PULADO após 2 tentativas — ${reason}.` });
          }

          const blocksDone = outline.rendered_blocks?.length ?? 0;
          const nextProgress = 15 + Math.round((blocksDone / totalBlocks) * 70);
          await setStage("blocks", `Gerando ${totalBlocks} blocos`, nextProgress, {
            blocks_done: blocksDone,
            blocks_total: totalBlocks,
          });
          await triggerContinuation("continue");
          return;
        }

        if (!outline.close) {
          await setStage("closing", "Gerando sumário executivo", 88, {
            blocks_done: outline.rendered_blocks?.length ?? outline.blocks.length,
            blocks_total: totalBlocks,
          });
          const closeTool = {
            type: "function",
            function: {
              name: "emit_close",
              description: "Sumário executivo + summary estruturado.",
              parameters: {
                type: "object",
                properties: {
                  exec_summary_html: { type: "string" },
                  summary: {
                    type: "object",
                    properties: {
                      strengths: { type: "number" },
                      gaps: { type: "number" },
                      risks: { type: "number" },
                      pages: { type: "number" },
                      generator: { type: "string" },
                      parity: { type: "string" },
                      highlights: { type: "array", items: { type: "string" } },
                      compliance: {
                        type: "object",
                        properties: {
                          fda: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered", "partial", "missing", "points"], additionalProperties: false },
                          ema: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered", "partial", "missing", "points"], additionalProperties: false },
                          avma: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered", "partial", "missing", "points"], additionalProperties: false },
                          gmlp: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, principles: { type: "number" } }, required: ["covered", "partial", "missing", "principles"], additionalProperties: false },
                        },
                        required: ["fda", "ema", "avma", "gmlp"],
                        additionalProperties: false,
                      },
                    },
                    required: ["strengths", "gaps", "risks", "pages", "generator", "parity", "highlights", "compliance"],
                    additionalProperties: false,
                  },
                },
                required: ["exec_summary_html", "summary"],
                additionalProperties: false,
              },
            },
          };

          let closePayload: OutlineState["close"];
          try {
            closePayload = await resilientCall([
              { role: "system", content: baseSystem },
              {
                role: "user",
                content: `Gere o SUMÁRIO EXECUTIVO da auditoria ${auditId} com base nas seções já renderizadas, e o resumo estruturado JSON.

Inclua no exec_summary_html (<section id="executive-summary">):
- Tabela "Pontos-chave" (Área · Status · Observação)
- 2-3 parágrafos sobre o estado geral da plataforma
- Quadro de comparação com a versão anterior se disponível

SEÇÕES JÁ RENDERIZADAS (resumo):
${(outline.rendered_blocks ?? []).map((item) => item.html).join("\n").slice(0, 14000)}`,
              },
            ], closeTool, { phase: "cierre", label: "Sumário executivo" });
          } catch (error: any) {
            await pushLog({ level: "warn", phase: "cierre", message: `Sumário executivo falhou — usando placeholder (${error?.message ?? error})` });
            closePayload = {
              exec_summary_html: `<section id="executive-summary"><h2>Sumário executivo</h2><p>Não foi possível gerar o sumário executivo após 2 tentativas. O relatório foi preservado com os blocos renderizados.</p></section>`,
              summary: {
                strengths: 0,
                gaps: 0,
                risks: 0,
                pages: 0,
                generator: "senex-ai",
                parity: "n/a",
                highlights: [],
                compliance: {
                  fda: { covered: 0, partial: 0, missing: 0, points: 0 },
                  ema: { covered: 0, partial: 0, missing: 0, points: 0 },
                  avma: { covered: 0, partial: 0, missing: 0, points: 0 },
                  gmlp: { covered: 0, partial: 0, missing: 0, principles: 0 },
                },
              },
            };
            outline.block_warnings = uniqueStrings([...(outline.block_warnings ?? []), `cierre: placeholder (${error?.message ?? error})`]);
          }

          outline = { ...outline, close: closePayload };
          await saveOutline(outline);
          await pushLog({ level: "info", phase: "cierre", message: "Checkpoint salvo após sumário executivo" });
          await triggerContinuation("continue");
          return;
        }

        if (outline.finalized) {
          return;
        }

        await pushLog({ level: "info", phase: "validate", message: "Validando cobertura do checklist canônico" });
        const renderedHtml = (outline.rendered_blocks ?? []).map((item) => item.html);
        const style = `<style>:root{--ink:#111827;--muted:#4b5563;--soft:#e5e7eb;--bg:#f9fafb;--accent:#1d4ed8;--ok:#16a34a;--warn:#b45309;--gap:#dc2626}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);line-height:1.6;max-width:980px;margin:0 auto;padding:48px 32px;background:#fff}h1{font-size:2rem;font-weight:700;margin:0 0 8px}h2{font-size:1.4rem;font-weight:700;margin:48px 0 16px;padding-bottom:8px;border-bottom:2px solid var(--soft)}h3{font-size:1.1rem;font-weight:600;margin:24px 0 8px}p{margin:0 0 12px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92rem}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--soft);vertical-align:top}th{background:var(--bg);font-weight:600}.meta,p.caption,figcaption{color:var(--muted);font-size:0.82rem;margin:4px 0 16px}section.block-gap,section.warnings{background:#fff7ed;border-left:4px solid var(--warn);padding:16px;border-radius:6px;margin:24px 0}ul{margin:0 0 12px 18px}code{background:var(--bg);padding:2px 6px;border-radius:4px;font-size:0.9em}svg{max-width:100%;height:auto;display:block;margin:12px 0}figure{margin:16px 0}.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0}.kpi{border:1px solid var(--soft);border-radius:8px;padding:14px;background:var(--bg)}.kpi-value{display:block;font-size:1.6rem;font-weight:700;color:var(--accent);line-height:1.1}.kpi-label{display:block;font-size:0.8rem;color:var(--muted);margin-top:4px}.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:0.8rem;color:var(--muted);margin:6px 0 14px}.legend span{display:inline-flex;align-items:center;gap:6px}.legend i{width:10px;height:10px;border-radius:2px;display:inline-block}</style>`;
        const header = `<header><h1>Auditoria técnica ${auditId.toUpperCase()}</h1><p class="meta">Gerada em ${new Date().toISOString().slice(0, 10)} · sistema i18n ${effectiveSystemVersion || "n/a"} · última entrada de changelog: ${effectiveChangelogDate ?? "n/a"}</p><p class="meta">Plataforma: <strong>Senex AI</strong> · Motor: <strong>PetMoreTime</strong></p></header>`;
        let bodyHtml = `${header}\n${outline.close.exec_summary_html ?? ""}\n${renderedHtml.join("\n")}`;
        const warnings = [...(outline.block_warnings ?? [])];
        const coverage = assessCoverage(bodyHtml);
        if (coverage.missing.length > 0) {
          const list = coverage.missing.map((item) => `<li><strong>${item.title_pt}</strong> (id <code>${item.id}</code>) — pilar ${item.pillar}</li>`).join("");
          bodyHtml += `\n<section id="generation-warnings" class="warnings"><h2>Lacunas de geração</h2><p>Os itens abaixo do checklist canônico não foram emitidos. O relatório foi salvo mesmo assim — re-execute para preencher.</p><ul>${list}</ul></section>`;
          warnings.push(`Cobertura incompleta: ${coverage.missing.length} itens ausentes`);
        }

        const fullHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Auditoria ${auditId}</title>${style}</head><body>${bodyHtml}</body></html>`;
        await setStage("uploading", "Salvando relatório", 95, {
          blocks_done: outline.rendered_blocks?.length ?? outline.blocks.length,
          blocks_total: totalBlocks,
        });
        await pushLog({ level: "info", phase: "save", message: `Salvando HTML (${(fullHtml.length / 1024).toFixed(1)} KB)` });

        const path = `${numericVersion}/auditoria.html`;
        const { error: uploadError } = await service.storage
          .from("audit-reports")
          .upload(path, new TextEncoder().encode(fullHtml), { upsert: true, contentType: "text/html; charset=utf-8" });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = service.storage.from("audit-reports").getPublicUrl(path);

        const status = warnings.length > 0 ? "ready_with_warnings" : "ready";
        const finalSummary: Record<string, any> = {
          ...(outline.close.summary ?? {}),
          generator: "senex-ai",
          model: PRIMARY_MODEL,
          status,
          stage: status,
          stage_label: status === "ready" ? "Pronto" : "Pronto com lacunas",
          progress: 100,
          blocks_done: outline.rendered_blocks?.length ?? outline.blocks.length,
          blocks_total: totalBlocks,
          words: coverage.words,
          h2: coverage.h2,
          tables: coverage.tables,
          coverage_missing: coverage.missing.map((item) => item.id),
          skipped_blocks: outline.skipped_blocks ?? [],
          warnings,
          audit_context: refreshedSummary.audit_context ?? auditContext,
        };

        outline = { ...outline, finalized: true };
        await service.from("technical_audits").update({
          html_path: publicUrl.publicUrl,
          summary: finalSummary,
          outline,
          last_heartbeat: new Date().toISOString(),
        }).eq("id", auditId);
        await pushLog({
          level: status === "ready" ? "info" : "warn",
          phase: "save",
          message: `Geração concluída — status ${status}${(outline.skipped_blocks?.length ?? 0) ? ` · ${outline.skipped_blocks?.length} bloco(s) pulado(s)` : ""}`,
        });
      } catch (error: any) {
        console.error("background audit generation failed:", error);
        try {
          await pushLog({ level: "error", phase: "system", message: `Erro fatal: ${error?.message ?? String(error)}` });
        } catch {
          // noop
        }
        await service.from("technical_audits").update({
          summary: {
            ...asObject((await refreshAuditRow())?.summary, {} as Record<string, any>),
            status: "failed",
            stage: "failed",
            stage_label: "Falhou",
            progress: 100,
            error: error?.message ?? String(error),
            generator: "senex-ai",
          },
        }).eq("id", auditId);
      }
    })();

    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundJob);
    }

    return new Response(JSON.stringify({ ok: true, audit: auditRow, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("generate-audit error:", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
