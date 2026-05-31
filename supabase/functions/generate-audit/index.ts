// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PRIMARY_MODEL = "google/gemini-3.1-pro-preview";
const FALLBACK_MODEL = "openai/gpt-5-mini";

// Watchdog / anti-stall tuning
const LLM_CALL_TIMEOUT_MS = 90_000;   // single LLM call hard timeout
const LLM_RETRY_BACKOFFS_MS = [5_000, 15_000]; // 2 retries after the first attempt
const HEARTBEAT_INTERVAL_MS = 5_000;  // touch last_heartbeat while a block is running
const MAX_LOG_ENTRIES = 200;          // ring buffer cap, trimmed in DB

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

function groupCoverage() {
  const map = new Map<string, CoverageItem[]>();
  for (const i of COVERAGE) { if (!map.has(i.pillar)) map.set(i.pillar, []); map.get(i.pillar)!.push(i); }
  return Array.from(map.entries()).map(([pillar, items]) => ({ pillar, items }));
}
function checklistForPrompt() {
  return groupCoverage().map((g) => `## ${g.pillar}\n` + g.items.map((i) => `- [${i.id}] ${i.title_pt} — evidência: ${i.evidence} (hint: ${i.expected})`).join("\n")).join("\n\n");
}
function stripHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function assessCoverage(html: string) {
  const lower = html.toLowerCase();
  const missing: CoverageItem[] = [];
  for (const item of COVERAGE) {
    const idHit = lower.includes(`id="${item.id}"`) || lower.includes(`id='${item.id}'`);
    const titleHit = lower.includes(item.title_pt.toLowerCase().slice(0, 22));
    if (!idHit && !titleHit) missing.push(item);
  }
  return { missing, words: stripHtml(html).split(" ").filter(Boolean).length, h2: (html.match(/<h2\b/gi) ?? []).length, tables: (html.match(/<table\b/gi) ?? []).length };
}

// ===== Logging / heartbeat helpers (used as closures by the background job) =====
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if ((body as any)?.action === "progress") {
      const id = String((body as any).audit_id ?? "").toLowerCase();
      if (!id) return new Response(JSON.stringify({ error: "audit_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: row } = await service.from("technical_audits").select("id, html_path, summary, updated_at, progress_log, last_heartbeat, resume_count").eq("id", id).maybeSingle();
      const summary: any = row?.summary ?? {};
      const log = Array.isArray((row as any)?.progress_log) ? (row as any).progress_log : [];
      return new Response(JSON.stringify({
        audit_id: id, status: summary.status ?? (row ? "unknown" : "missing"),
        stage: summary.stage ?? null, stage_label: summary.stage_label ?? null,
        progress: typeof summary.progress === "number" ? summary.progress : null,
        blocks_done: typeof summary.blocks_done === "number" ? summary.blocks_done : null,
        blocks_total: typeof summary.blocks_total === "number" ? summary.blocks_total : null,
        warnings: Array.isArray(summary.warnings) ? summary.warnings : null,
        coverage_missing: Array.isArray(summary.coverage_missing) ? summary.coverage_missing : null,
        log: log.slice(-30),
        last_heartbeat: (row as any)?.last_heartbeat ?? null,
        resume_count: (row as any)?.resume_count ?? 0,
        error: summary.error ?? null, html_path: row?.html_path ?? null, updated_at: row?.updated_at ?? null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((body as any)?.action === "fix_mime") {
      const { data: rows } = await service.from("technical_audits").select("id, html_path").not("html_path", "is", null);
      const results: any[] = [];
      for (const r of (rows ?? []) as Array<{ id: string; html_path: string }>) {
        const m = r.html_path.match(/audit-reports\/(.+)$/); if (!m) { results.push({ id: r.id, skipped: true }); continue; }
        const dl = await fetch(r.html_path); if (!dl.ok) { results.push({ id: r.id, error: `download ${dl.status}` }); continue; }
        const html = await dl.text();
        const { error: upErr } = await service.storage.from("audit-reports").upload(m[1], new TextEncoder().encode(html), { upsert: true, contentType: "text/html; charset=utf-8" });
        results.push({ id: r.id, ok: !upErr, error: upErr?.message });
      }
      return new Response(JSON.stringify({ fixed: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { version, scope, system_version, system_changelog_date } = body as { version: string; scope: string; system_version?: string; system_changelog_date?: string; };
    if (!version || !scope) return new Response(JSON.stringify({ error: "version and scope required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Factual snapshot
    const snapshot: Record<string, any> = {};
    const tableNames = ["studies", "study_embeddings", "triplet_extractions", "medical_knowledge_graph", "medical_knowledge_graph_edges", "hierarchical_edges", "pets", "pet_conditions", "pet_exams", "pet_consultations", "pet_medications", "breeds", "breed_predispositions", "lab_ranges", "core_rules", "meta_studies", "core_rule_evidence", "core_rule_modulators", "synthetic_cohorts", "cohort_suggestions", "cohort_insights", "prioritization_history", "prioritization_overrides", "user_roles", "profiles", "access_requests", "ai_prompt_versions", "technical_audits", "health_conditions", "nutraceuticals", "nutraceutical_conditions"];
    const counts: Record<string, number | null> = {};
    await Promise.all(tableNames.map(async (t) => { try { const { count } = await service.from(t).select("*", { count: "exact", head: true }); counts[t] = count ?? 0; } catch { counts[t] = null; } }));
    snapshot.counts = counts;

    let prevAuditsCtx = "";
    try {
      const { data: prevAudits } = await service.from("technical_audits").select("version, audit_date, system_version, summary").order("audit_date", { ascending: false }).limit(6);
      prevAuditsCtx = JSON.stringify((prevAudits ?? []).map((a: any) => ({ version: a.version, date: a.audit_date, i18n: a.system_version, sections: a.summary?.sections, pages: a.summary?.pages, strengths: a.summary?.strengths, gaps: a.summary?.gaps, risks: a.summary?.risks })));
    } catch { /* noop */ }

    const baseSystem = `Você é o auditor técnico interno da plataforma Senex AI (PetMoreTime).
NUNCA mencione "Lovable", "Lovable AI" ou ferramentas de desenvolvimento. Use "Senex AI" como marca e "PetMoreTime" como motor.
Escreva em PORTUGUÊS, denso, analítico, em HTML semântico.

POLÍTICA OBRIGATÓRIA:
- Toda auditoria é standalone e cumulativa. Nunca produza "teste rápido", "smoke" ou "delta-only".
- Profundidade-alvo equivalente ou superior à V3 (30+ páginas, 25+ seções h2, 8+ tabelas).
- Cada item do checklist canônico precisa aparecer como subseção com id estável.
- Áreas existentes mas incompletas → classifique como "parcial", "doc-only", "sandbox" ou "planejado" e descreva o gap. NUNCA omita.

CHECKLIST CANÔNICO (todos os ids devem aparecer no relatório):
${checklistForPrompt()}

SNAPSHOT FACTUAL DO BANCO (use números reais):
${JSON.stringify(snapshot, null, 2)}

AUDITORIAS ANTERIORES (contexto):
${prevAuditsCtx}`;

    async function callTool(messages: any[], tool: any, model: string) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, tools: [tool], tool_choice: { type: "function", function: { name: tool.function.name } } }),
      });
      if (!r.ok) { const t = await r.text(); throw new Error(`${model} → ${r.status}: ${t.slice(0, 400)}`); }
      const d = await r.json();
      const args = d?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error(`${model} returned no tool_call`);
      return JSON.parse(args);
    }
    async function tryWithFallback(messages: any[], tool: any) {
      try { return await callTool(messages, tool, PRIMARY_MODEL); }
      catch (e) { console.warn("primary failed:", e); return await callTool(messages, tool, FALLBACK_MODEL); }
    }

    const auditId = version.toLowerCase().startsWith("v") ? version.toLowerCase() : `v${version.toLowerCase()}`;
    const numericVersion = auditId.replace(/^v/, "");
    const isResume = (body as any)?.action === "resume";
    let inserted: any;
    if (isResume) {
      const { data: existing } = await service.from("technical_audits").select("*").eq("id", auditId).maybeSingle();
      if (!existing) return new Response(JSON.stringify({ error: "audit not found for resume" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      inserted = existing;
      await service.from("technical_audits")
        .update({ summary: { ...((existing.summary as any) ?? {}), status: "processing", stage: "resuming", stage_label: "Retomando…", error: null }, resume_count: (existing.resume_count ?? 0) + 1, last_heartbeat: new Date().toISOString() })
        .eq("id", auditId);
    } else {
      const initialSummary = { status: "processing", generator: "senex-ai", model: PRIMARY_MODEL, stage: "queued", stage_label: "Na fila", progress: 2, blocks_done: 0, blocks_total: 0, warnings: [] as string[] };
      const { data, error: insErr } = await service.from("technical_audits").upsert({
        id: auditId, version: numericVersion, audit_date: new Date().toISOString().slice(0, 10),
        system_version: system_version ?? "", system_changelog_date: system_changelog_date ?? null,
        scope, scope_history: [], html_path: null, pdf_path: null, docx_path: null,
        summary: initialSummary, superseded_by: null, outline: null,
        progress_log: [], last_heartbeat: new Date().toISOString(), resume_count: 0,
      }).select("*").single();
      if (insErr) throw insErr;
      inserted = data;
    }

    // === Logging + heartbeat closures ===
    async function pushLog(entry: Omit<LogEntry, "ts">) {
      const full: LogEntry = { ts: new Date().toISOString(), ...entry };
      try {
        // Read current log, append, trim to last MAX_LOG_ENTRIES, write back.
        const { data: row } = await service.from("technical_audits").select("progress_log").eq("id", auditId).maybeSingle();
        const prev = Array.isArray(row?.progress_log) ? (row!.progress_log as LogEntry[]) : [];
        const next = [...prev, full].slice(-MAX_LOG_ENTRIES);
        await service.from("technical_audits").update({ progress_log: next, last_heartbeat: full.ts }).eq("id", auditId);
      } catch (e) { console.warn("pushLog failed", e); }
      // Always console.log too for edge function logs.
      console.log(`[audit ${auditId}] ${full.level.toUpperCase()} ${full.phase}: ${full.message}`);
    }
    async function heartbeat() {
      try { await service.from("technical_audits").update({ last_heartbeat: new Date().toISOString() }).eq("id", auditId); } catch { /* noop */ }
    }

    async function setStage(stage: string, label: string, progress: number, extra: Record<string, any> = {}) {
      try {
        const { data: curr } = await service.from("technical_audits").select("summary").eq("id", auditId).maybeSingle();
        const merged = { ...((curr?.summary as any) ?? {}), ...extra, status: "processing", stage, stage_label: label, progress };
        await service.from("technical_audits").update({ summary: merged, last_heartbeat: new Date().toISOString() }).eq("id", auditId);
      } catch (e) { console.warn("setStage failed", e); }
    }

    const backgroundJob = (async () => {
      try {
        await pushLog({ level: "info", phase: "system", message: isResume ? `Retomando geração (tentativa #${(inserted.resume_count ?? 0) + 1})` : "Iniciando geração" });

        // ===== Resilient LLM call: per-attempt timeout + retries + model fallback =====
        async function callToolWithTimeout(messages: any[], tool: any, model: string, timeoutMs: number) {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), timeoutMs);
          try {
            const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, messages, tools: [tool], tool_choice: { type: "function", function: { name: tool.function.name } } }),
              signal: ctrl.signal,
            });
            if (!r.ok) { const txt = await r.text(); throw new Error(`${model} → ${r.status}: ${txt.slice(0, 300)}`); }
            const d = await r.json();
            const args = d?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
            if (!args) throw new Error(`${model} returned no tool_call`);
            return JSON.parse(args);
          } finally { clearTimeout(t); }
        }
        async function resilientCall(messages: any[], tool: any, opts: { phase: LogPhase; label: string; block_id?: string }) {
          const attempts = [{ model: PRIMARY_MODEL, backoff: 0 }, { model: FALLBACK_MODEL, backoff: LLM_RETRY_BACKOFFS_MS[0] }, { model: FALLBACK_MODEL, backoff: LLM_RETRY_BACKOFFS_MS[1] }];
          let lastErr: any;
          for (let i = 0; i < attempts.length; i++) {
            const { model, backoff } = attempts[i];
            if (backoff > 0) await new Promise((r) => setTimeout(r, backoff));
            const hb = setInterval(() => { heartbeat().catch(() => {}); }, HEARTBEAT_INTERVAL_MS);
            const t0 = Date.now();
            try {
              await pushLog({ level: "info", phase: opts.phase, block_id: opts.block_id, attempt: i + 1, message: `${opts.label} — tentativa ${i + 1}/${attempts.length} (${model})` });
              const out = await callToolWithTimeout(messages, tool, model, LLM_CALL_TIMEOUT_MS);
              await pushLog({ level: "info", phase: opts.phase, block_id: opts.block_id, attempt: i + 1, duration_ms: Date.now() - t0, message: `${opts.label} — ok (${((Date.now()-t0)/1000).toFixed(1)}s)` });
              return out;
            } catch (e: any) {
              lastErr = e;
              const reason = e?.name === "AbortError" ? `timeout >${LLM_CALL_TIMEOUT_MS/1000}s` : (e?.message ?? String(e));
              await pushLog({ level: "warn", phase: opts.phase, block_id: opts.block_id, attempt: i + 1, duration_ms: Date.now() - t0, message: `${opts.label} — falha (${reason})` });
            } finally { clearInterval(hb); }
          }
          throw lastErr ?? new Error("all LLM attempts failed");
        }

        // ===== Outline (skip if resuming and outline already present) =====
        let outline: any = (inserted as any)?.outline ?? null;
        if (!outline) {
          await setStage("outlining", "Montando estrutura do relatório", 8);
        const outlineTool = { type: "function", function: { name: "emit_outline", description: "Índice completo do relatório por pilar.", parameters: { type: "object", properties: { title: { type: "string" }, blocks: { type: "array", items: { type: "object", properties: { block_id: { type: "string" }, pillar_title: { type: "string" }, sections: { type: "array", items: { type: "object", properties: { section_id: { type: "string" }, title: { type: "string" }, bullets: { type: "array", items: { type: "string" } } }, required: ["section_id", "title", "bullets"], additionalProperties: false } } }, required: ["block_id", "pillar_title", "sections"], additionalProperties: false } } }, required: ["title", "blocks"], additionalProperties: false } } };
          outline = await resilientCall([
          { role: "system", content: baseSystem },
          { role: "user", content: `Auditoria ${auditId} (i18n ${system_version ?? "n/a"}).
ESCOPO DO USUÁRIO (ênfases adicionais — não substitui o checklist):
${scope}

Monte o ÍNDICE: um bloco por pilar do checklist + blocos extras (sumário executivo já será gerado separado, então NÃO o inclua; inclua: mudanças desde versão anterior, comparação histórica, forças, gaps e riscos consolidados, roadmap, apêndices, bibliografia). Cada seção tem 3-6 bullets. TODOS os section_id do checklist canônico devem aparecer pelo menos uma vez.` },
          ], outlineTool, { phase: "outline", label: "Outline" });
        await service.from("technical_audits").update({ outline }).eq("id", auditId);
        } else {
          await pushLog({ level: "info", phase: "outline", message: "Outline já presente — reaproveitando" });
        }

        const blocks = (outline.blocks ?? []) as Array<any>;
        const totalBlocks = blocks.length + 1;
        await setStage("blocks", `Gerando ${totalBlocks} blocos`, 15, { blocks_total: totalBlocks });

        // 2) BLOCOS
        const blockTool = { type: "function", function: { name: "emit_block", description: "HTML denso de um bloco.", parameters: { type: "object", properties: { html: { type: "string" }, warnings: { type: "array", items: { type: "string" } } }, required: ["html"], additionalProperties: false } } };
        const renderedHtml: string[] = [];
        const blockWarnings: string[] = [];
        const skippedBlocks: string[] = [];
        for (let i = 0; i < blocks.length; i++) {
          const blk = blocks[i];
          const pct = 15 + Math.round(((i + 0.5) / totalBlocks) * 70);
          await setStage("blocks", `Bloco ${i + 1}/${totalBlocks}: ${blk.pillar_title}`, pct, { blocks_done: i });
          const messages = [
            { role: "system", content: baseSystem },
            { role: "user", content: `Renderize o bloco "${blk.pillar_title}" (block_id=${blk.block_id}). Use exatamente os section_id propostos.

SEÇÕES:
${(blk.sections ?? []).map((s: any) => `- ${s.section_id} · ${s.title}\n  bullets:\n  ${(s.bullets ?? []).map((b: string) => `· ${b}`).join("\n  ")}`).join("\n\n")}

REGRAS:
- Envolva em <section id="${blk.block_id}"> com <h2>${blk.pillar_title}</h2>.
- Para cada seção: <section id="SECTION_ID"><h3>...</h3>...</section>.
- Texto denso (≥ 180 palavras por seção), analítico, em PT.
- Inclua ao menos 1 <table> elegante por bloco.
- Se algo não estiver implementado, marque "Status: parcial/doc-only/sandbox/planejado" e descreva o gap.
- NÃO emita <html>, <head>, <body> ou <style>. Apenas fragment HTML.` },
          ];
          try {
            const attempt = await resilientCall(messages, blockTool, { phase: "block", block_id: blk.block_id, label: `Bloco ${i + 1}/${totalBlocks} (${blk.pillar_title})` });
            renderedHtml.push(String(attempt.html ?? ""));
            if (Array.isArray(attempt.warnings)) blockWarnings.push(...attempt.warnings);
          } catch (e: any) {
            const reason = e?.message ?? String(e);
            skippedBlocks.push(blk.block_id);
            blockWarnings.push(`bloco ${blk.block_id}: PULADO após 3 tentativas (${reason})`);
            await pushLog({ level: "error", phase: "block", block_id: blk.block_id, message: `Bloco PULADO após 3 tentativas — ${reason}. Continuando para o próximo.` });
            renderedHtml.push(`<section id="${blk.block_id}" class="block-gap"><h2>${blk.pillar_title} — Lacuna de geração</h2><p>Bloco não pôde ser gerado após 3 tentativas. Motivo: ${reason}. Re-execute para preencher.</p></section>`);
          }
        }

        // 3) CIERRE
        await setStage("closing", "Gerando sumário executivo", 88, { blocks_done: blocks.length });
        const closeTool = { type: "function", function: { name: "emit_close", description: "Sumário executivo + summary estruturado.", parameters: { type: "object", properties: { exec_summary_html: { type: "string" }, summary: { type: "object", properties: { strengths: { type: "number" }, gaps: { type: "number" }, risks: { type: "number" }, pages: { type: "number" }, generator: { type: "string" }, parity: { type: "string" }, highlights: { type: "array", items: { type: "string" } }, compliance: { type: "object", properties: { fda: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false }, ema: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false }, avma: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false }, gmlp: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, principles: { type: "number" } }, required: ["covered","partial","missing","principles"], additionalProperties: false } }, required: ["fda","ema","avma","gmlp"], additionalProperties: false } }, required: ["strengths","gaps","risks","pages","generator","parity","highlights","compliance"], additionalProperties: false } }, required: ["exec_summary_html", "summary"], additionalProperties: false } } };
        let close: any;
        try {
          close = await resilientCall([
          { role: "system", content: baseSystem },
          { role: "user", content: `Gere o SUMÁRIO EXECUTIVO da auditoria ${auditId} com base nas seções já renderizadas, e o resumo estruturado JSON.

Inclua no exec_summary_html (<section id="executive-summary">):
- Tabela "Pontos-chave" (Área · Status · Observação)
- 2-3 parágrafos sobre o estado geral da plataforma
- Quadro de comparação com a versão anterior se disponível

SEÇÕES JÁ RENDERIZADAS (resumo):
${renderedHtml.join("\n").slice(0, 14000)}` },
          ], closeTool, { phase: "cierre", label: "Sumário executivo" });
        } catch (e: any) {
          await pushLog({ level: "warn", phase: "cierre", message: `Sumário executivo falhou — usando placeholder (${e?.message ?? e})` });
          close = { exec_summary_html: `<section id="executive-summary"><h2>Sumário executivo</h2><p>Não foi possível gerar o sumário executivo após 3 tentativas. O relatório foi preservado com os blocos renderizados.</p></section>`, summary: { strengths: 0, gaps: 0, risks: 0, pages: 0, generator: "senex-ai", parity: "n/a", highlights: [], compliance: { fda: { covered:0, partial:0, missing:0, points:0 }, ema: { covered:0, partial:0, missing:0, points:0 }, avma: { covered:0, partial:0, missing:0, points:0 }, gmlp: { covered:0, partial:0, missing:0, principles:0 } } } };
          blockWarnings.push(`cierre: placeholder (${e?.message ?? e})`);
        }

        // 4) MONTAGEM
        const style = `<style>:root{--ink:#111827;--muted:#4b5563;--soft:#e5e7eb;--bg:#f9fafb;--accent:#1d4ed8;--warn:#b45309}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);line-height:1.6;max-width:980px;margin:0 auto;padding:48px 32px;background:#fff}h1{font-size:2rem;font-weight:700;margin:0 0 8px}h2{font-size:1.4rem;font-weight:700;margin:48px 0 16px;padding-bottom:8px;border-bottom:2px solid var(--soft)}h3{font-size:1.1rem;font-weight:600;margin:24px 0 8px}p{margin:0 0 12px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92rem}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--soft);vertical-align:top}th{background:var(--bg);font-weight:600}.meta{color:var(--muted);font-size:0.85rem}section.block-gap,section.warnings{background:#fff7ed;border-left:4px solid var(--warn);padding:16px;border-radius:6px;margin:24px 0}ul{margin:0 0 12px 18px}code{background:var(--bg);padding:2px 6px;border-radius:4px;font-size:0.9em}</style>`;
        const header = `<header><h1>Auditoria técnica ${auditId.toUpperCase()}</h1><p class="meta">Gerada em ${new Date().toISOString().slice(0,10)} · sistema i18n ${system_version ?? "n/a"} · última entrada de changelog: ${system_changelog_date ?? "n/a"}</p><p class="meta">Plataforma: <strong>Senex AI</strong> · Motor: <strong>PetMoreTime</strong></p></header>`;
        let bodyHtml = `${header}\n${close.exec_summary_html ?? ""}\n${renderedHtml.join("\n")}`;

        // 5) VALIDAÇÃO POR COBERTURA
        await pushLog({ level: "info", phase: "validate", message: "Validando cobertura do checklist canônico" });
        const cov = assessCoverage(bodyHtml);
        const warnings = [...blockWarnings];
        if (cov.missing.length > 0) {
          const list = cov.missing.map((m) => `<li><strong>${m.title_pt}</strong> (id <code>${m.id}</code>) — pilar ${m.pillar}</li>`).join("");
          bodyHtml += `\n<section id="generation-warnings" class="warnings"><h2>Lacunas de geração</h2><p>Os itens abaixo do checklist canônico não foram emitidos. O relatório foi salvo mesmo assim — re-execute para preencher.</p><ul>${list}</ul></section>`;
          warnings.push(`Cobertura incompleta: ${cov.missing.length} itens ausentes`);
        }

        const fullHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Auditoria ${auditId}</title>${style}</head><body>${bodyHtml}</body></html>`;

        // 6) UPLOAD
        await setStage("uploading", "Salvando relatório", 95);
        await pushLog({ level: "info", phase: "save", message: `Salvando HTML (${(fullHtml.length/1024).toFixed(1)} KB)` });
        const path = `${version}/auditoria.html`;
        const { error: upErr } = await service.storage.from("audit-reports").upload(path, new TextEncoder().encode(fullHtml), { upsert: true, contentType: "text/html; charset=utf-8" });
        if (upErr) throw upErr;
        const { data: pub } = service.storage.from("audit-reports").getPublicUrl(path);
        const status = warnings.length > 0 ? "ready_with_warnings" : "ready";
        const finalSummary: any = { ...(close.summary ?? {}), generator: "senex-ai", model: PRIMARY_MODEL, status, stage: status, stage_label: status === "ready" ? "Pronto" : "Pronto com lacunas", progress: 100, blocks_done: blocks.length, blocks_total: totalBlocks, words: cov.words, h2: cov.h2, tables: cov.tables, coverage_missing: cov.missing.map((m) => m.id), skipped_blocks: skippedBlocks, warnings };
        await service.from("technical_audits").update({ html_path: pub.publicUrl, summary: finalSummary }).eq("id", auditId);
        await pushLog({ level: status === "ready" ? "info" : "warn", phase: "save", message: `Geração concluída — status ${status}${skippedBlocks.length ? ` · ${skippedBlocks.length} bloco(s) pulado(s)` : ""}` });
      } catch (err: any) {
        console.error("background audit generation failed:", err);
        try { await pushLog({ level: "error", phase: "system", message: `Erro fatal: ${err?.message ?? String(err)}` }); } catch { /* noop */ }
        await service.from("technical_audits").update({
          summary: { status: "failed", stage: "failed", stage_label: "Falhou", progress: 100, error: err?.message ?? String(err), generator: "senex-ai" },
        }).eq("id", auditId);
      }
    })();

    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundJob);
    }

    return new Response(JSON.stringify({ ok: true, audit: inserted, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-audit error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});