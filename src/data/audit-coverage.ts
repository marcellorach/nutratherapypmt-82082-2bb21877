/**
 * Checklist canônico de cobertura das auditorias técnicas do Senex AI.
 *
 * Este arquivo é a FONTE ÚNICA para:
 *  - o escopo default mostrado no diálogo "Solicitar nova auditoria"
 *  - o checklist que a edge function `generate-audit` injeta no prompt do LLM
 *    e usa como base para validar que NENHUMA área foi esquecida no relatório
 *
 * Cada item declara como o LLM (e o validador) podem verificar a área no
 * sistema real: tabs admin, edge functions, tabelas do banco e/ou marcadores
 * que devem aparecer no HTML final.
 */

export type CoverageStatusHint =
  | "active"
  | "partial"
  | "doc_only"
  | "sandbox"
  | "planned";

export interface CoverageItem {
  /** id estável usado por validação (deve aparecer como id na seção HTML). */
  id: string;
  /** Pilar do sistema ao qual o item pertence. */
  pillar: CoveragePillar;
  /** Título em português (renderizado na UI e como heading h3 da seção). */
  title_pt: string;
  /** Título em inglês — espelho obrigatório do PT (regra Bilingual All Layers). */
  title_en: string;
  /** Como o LLM pode verificar essa área no código/banco. */
  evidence: {
    /** Tabs admin (id em `src/config/admin-tabs.ts`) onde a área aparece. */
    tabs?: string[];
    /** Edge functions relacionadas (nome do diretório). */
    edge_functions?: string[];
    /** Tabelas Postgres relevantes. */
    tables?: string[];
    /** Outras evidências: arquivos, migrations, fluxos, docs. */
    notes?: string[];
  };
  /** Estado esperado por padrão — o LLM pode confirmar ou ajustar. */
  expected_status_hint: CoverageStatusHint;
}

export type CoveragePillar =
  | "platform-infra"
  | "curation-pipeline"
  | "knowledge-graph"
  | "ai-scientist"
  | "architectural-foundations"
  | "patient-recommendation"
  | "digital-twin"
  | "compliance"
  | "bilingual"
  | "operations"
  | "sandbox-planned";

export const COVERAGE_PILLARS: Array<{
  id: CoveragePillar;
  title_pt: string;
  title_en: string;
}> = [
  { id: "platform-infra", title_pt: "Plataforma & Infraestrutura", title_en: "Platform & Infrastructure" },
  { id: "curation-pipeline", title_pt: "Pipeline de Curadoria", title_en: "Curation Pipeline" },
  { id: "knowledge-graph", title_pt: "Knowledge Graph", title_en: "Knowledge Graph" },
  { id: "ai-scientist", title_pt: "AI Scientist", title_en: "AI Scientist" },
  { id: "architectural-foundations", title_pt: "Fundamentos Arquiteturais (Meta-KG)", title_en: "Architectural Foundations (Meta-KG)" },
  { id: "patient-recommendation", title_pt: "Análise do Paciente & Recomendação Híbrida", title_en: "Patient Analysis & Hybrid Recommendation" },
  { id: "digital-twin", title_pt: "Digital Twin & Projeções", title_en: "Digital Twin & Projections" },
  { id: "compliance", title_pt: "Conformidade Regulatória", title_en: "Regulatory Compliance" },
  { id: "bilingual", title_pt: "Bilíngue PT/EN", title_en: "Bilingual PT/EN" },
  { id: "operations", title_pt: "Operações & Governança", title_en: "Operations & Governance" },
  { id: "sandbox-planned", title_pt: "Sandbox & Planejado", title_en: "Sandbox & Planned" },
];

export const AUDIT_COVERAGE: CoverageItem[] = [
  // ────────── Plataforma & Infra ──────────
  {
    id: "auth-rls",
    pillar: "platform-infra",
    title_pt: "Autenticação, papéis e RLS",
    title_en: "Authentication, roles and RLS",
    evidence: {
      tabs: ["access-requests", "users-roles"],
      tables: ["user_roles", "profiles", "access_requests"],
      notes: ["função SECURITY DEFINER `has_role`/`is_admin`", "policies por tabela crítica"],
    },
    expected_status_hint: "active",
  },
  {
    id: "edge-functions",
    pillar: "platform-infra",
    title_pt: "Edge Functions (catálogo, papéis, JWT)",
    title_en: "Edge functions (catalog, roles, JWT)",
    evidence: { notes: ["67+ funções em supabase/functions/*", "verify_jwt + validação em código"] },
    expected_status_hint: "active",
  },
  {
    id: "storage-buckets",
    pillar: "platform-infra",
    title_pt: "Buckets de Storage",
    title_en: "Storage buckets",
    evidence: { notes: ["study_pdfs, pet_exams_pdfs, audit-reports, meta-study-covers, pet-photos"] },
    expected_status_hint: "active",
  },
  {
    id: "design-system",
    pillar: "platform-infra",
    title_pt: "Design System & tokens semânticos",
    title_en: "Design system & semantic tokens",
    evidence: { tabs: ["design-conventions"], notes: ["index.css, tailwind.config.ts"] },
    expected_status_hint: "active",
  },

  // ────────── Pipeline de Curadoria ──────────
  {
    id: "curation-7-stages",
    pillar: "curation-pipeline",
    title_pt: "Pipeline de curadoria de 7 estágios (PDF → triplets → KG → recomendação)",
    title_en: "7-stage curation pipeline (PDF → triplets → KG → recommendation)",
    evidence: {
      tabs: ["estudos", "triplet-curation", "knowledge-graph"],
      edge_functions: ["parse-study", "vectorize-study", "extract-study-entities", "process-study", "sync-study-to-neo4j"],
      tables: ["processed_studies", "study_embeddings", "triplet_extractions", "hierarchical_edges"],
    },
    expected_status_hint: "active",
  },
  {
    id: "vectorization-pre-curation",
    pillar: "curation-pipeline",
    title_pt: "Vetorização como pré-requisito da curadoria",
    title_en: "Vectorization as curation prerequisite",
    evidence: { edge_functions: ["vectorize-study", "extract-study-entities"], tables: ["study_embeddings"] },
    expected_status_hint: "active",
  },
  {
    id: "evidence-conflicts",
    pillar: "curation-pipeline",
    title_pt: "Conflitos de evidência e resolução canônica",
    title_en: "Evidence conflicts and canonical resolution",
    evidence: { tabs: ["evidence-conflicts"], edge_functions: ["enrich-triplet"] },
    expected_status_hint: "active",
  },
  {
    id: "study-duplicates",
    pillar: "curation-pipeline",
    title_pt: "Detecção de duplicatas de estudos (SHA-256 + Levenshtein)",
    title_en: "Study duplicate detection (SHA-256 + Levenshtein)",
    evidence: { tabs: ["estudos"], notes: ["fileHashUtils + checks no upload"] },
    expected_status_hint: "active",
  },

  // ────────── Knowledge Graph ──────────
  {
    id: "kg-5-layers",
    pillar: "knowledge-graph",
    title_pt: "Modelo de 5 camadas (Compostos · Mecanismos · Pathways · Condições · Outcomes)",
    title_en: "5-layer model (Compounds · Mechanisms · Pathways · Conditions · Outcomes)",
    evidence: { tabs: ["knowledge-graph", "relacoes"], tables: ["hierarchical_edges", "triplet_extractions"], notes: ["medical_knowledge_graph é legado (0 linhas) — storage real = hierarchical_edges + Neo4j mirror"] },
    expected_status_hint: "active",
  },
  {
    id: "kg-taxonomy",
    pillar: "knowledge-graph",
    title_pt: "Taxonomia SNOMED-CT VetSCT + UMLS",
    title_en: "SNOMED-CT VetSCT + UMLS taxonomy",
    evidence: { tabs: ["ontology-hub"], notes: ["biomedical-taxonomy.ts"] },
    expected_status_hint: "active",
  },
  {
    id: "kg-gap-fill",
    pillar: "knowledge-graph",
    title_pt: "Pipeline gap-fill PubMed + Gemini",
    title_en: "PubMed + Gemini gap-fill pipeline",
    evidence: { edge_functions: ["kg-missing-triplets", "backfill-triplet-enrichment"] },
    expected_status_hint: "active",
  },
  {
    id: "kg-curation-gatekeeper",
    pillar: "knowledge-graph",
    title_pt: "Gatekeeper de curadoria (auto-approve ≥50%, HITL caso contrário)",
    title_en: "Curation gatekeeper (auto-approve ≥50%, HITL otherwise)",
    evidence: { tabs: ["triplet-curation"], tables: ["triplet_extractions"] },
    expected_status_hint: "active",
  },

  // ────────── AI Scientist ──────────
  {
    id: "ai-scientist-roadmap",
    pillar: "ai-scientist",
    title_pt: "Kanban de Priorizações (roadmap operacional + histórico de movimentações)",
    title_en: "Prioritization kanban (operational roadmap + movement history)",
    evidence: { tabs: ["priorizacoes"], tables: ["prioritization_history", "prioritization_overrides"] },
    expected_status_hint: "active",
  },
  {
    id: "ai-scientist-synthetic-cohorts",
    pillar: "ai-scientist",
    title_pt: "Cohorts sintéticos + sugestão automática (suggest-cohort-ideas)",
    title_en: "Synthetic cohorts + automatic suggestion (suggest-cohort-ideas)",
    evidence: {
      tabs: ["priorizacoes"],
      edge_functions: ["suggest-cohort-ideas", "generate-synthetic-cohort", "check-cohort-originality"],
      tables: ["synthetic_cohorts", "cohort_suggestions"],
    },
    expected_status_hint: "active",
  },
  {
    id: "ai-scientist-population-insights",
    pillar: "ai-scientist",
    title_pt: "Population Insights v0 + validação vet-curador",
    title_en: "Population Insights v0 + vet-curator validation",
    evidence: {
      tabs: ["priorizacoes"],
      edge_functions: ["analyze-cohort-patterns", "analyze-all-cohorts-patterns", "check-insight-originality"],
      tables: ["cohort_insights"],
    },
    expected_status_hint: "active",
  },
  {
    id: "ai-scientist-predictive-models",
    pillar: "ai-scientist",
    title_pt: "Catálogo de 6 modelos preditivos ancorados em cohorts",
    title_en: "Catalog of 6 predictive models anchored on cohorts",
    evidence: { tabs: ["modelos"], notes: ["predictiveModelsData.ts"] },
    expected_status_hint: "active",
  },

  // ────────── Fundamentos Arquiteturais ──────────
  {
    id: "core-rules",
    pillar: "architectural-foundations",
    title_pt: "Regras-Core (RC-NNN) com runtime_effect e justificativa",
    title_en: "Core rules (RC-NNN) with runtime_effect and justification",
    evidence: { tabs: ["fundamentos"], tables: ["core_rules", "core_rule_evidence", "core_rule_modulators"] },
    expected_status_hint: "active",
  },
  {
    id: "meta-studies",
    pillar: "architectural-foundations",
    title_pt: "Meta-estudos arquiteturais (não-clínicos) e modulators translacionais",
    title_en: "Architectural meta-studies (non-clinical) and translational modulators",
    evidence: { tabs: ["fundamentos"], tables: ["meta_studies"], edge_functions: ["evaluate-meta-study-reliability", "chat-meta-study"] },
    expected_status_hint: "active",
  },
  {
    id: "meta-kg-sandbox",
    pillar: "architectural-foundations",
    title_pt: "Sandbox / Kanban do Meta-KG",
    title_en: "Meta-KG sandbox / Kanban",
    evidence: { tabs: ["fundamentos"], notes: ["MetaStudyKanban + IngestaoMetaEstudo"] },
    expected_status_hint: "partial",
  },

  // ────────── Paciente & Recomendação ──────────
  {
    id: "patient-analysis",
    pillar: "patient-recommendation",
    title_pt: "Análise do paciente (6 estágios, breed/labs/condições)",
    title_en: "Patient analysis (6 stages, breed/labs/conditions)",
    evidence: { tabs: ["pet-management"], edge_functions: ["condition-insights", "calculate-recommendation-confidence"] },
    expected_status_hint: "active",
  },
  {
    id: "hybrid-recommendation",
    pillar: "patient-recommendation",
    title_pt: "Motor de recomendação híbrida (limite de 8 compostos sinérgicos)",
    title_en: "Hybrid recommendation engine (8 synergistic compounds cap)",
    evidence: { tabs: ["nutraceuticals-unified", "veterinary-targets"], edge_functions: ["calculate-recommendation-confidence"] },
    expected_status_hint: "active",
  },
  {
    id: "breed-predispositions",
    pillar: "patient-recommendation",
    title_pt: "Predisposições por raça (81 raças, 254 predisposições)",
    title_en: "Breed predispositions (81 breeds, 254 predispositions)",
    evidence: { tabs: ["breeds-management"], tables: ["breeds", "breed_predispositions"] },
    expected_status_hint: "active",
  },
  {
    id: "lab-references",
    pillar: "patient-recommendation",
    title_pt: "Referências laboratoriais caninas",
    title_en: "Canine lab reference intervals",
    evidence: { tabs: ["lab-references"], tables: ["lab_ranges"] },
    expected_status_hint: "active",
  },
  {
    id: "pet-food-coverage",
    pillar: "patient-recommendation",
    title_pt: "Catálogo de rações + cobertura nutricional",
    title_en: "Pet food catalog + nutritional coverage",
    evidence: { tabs: ["pet-food-catalog", "pet-food-coverage"], edge_functions: ["bulk-enrich-pet-food"] },
    expected_status_hint: "active",
  },

  // ────────── Digital Twin ──────────
  {
    id: "digital-twin",
    pillar: "digital-twin",
    title_pt: "Digital Twin & projeções — DOIS motores distintos: (a) progressão de condição × nutracêutico = SIGMOIDE calibrada 1/(1+exp(-k·(t−t50))) em condition-progression-engine.ts:86 ancorada em condition_response_curves; (b) envelhecimento biológico = curva de GOMPERTZ por SIZE CATEGORY (4 categorias calibradas — small/medium/large/giant — Dog Aging Project/Kraus 2013) em breed_aging_curves + supabase/functions/project-pet-trajectory/index.ts:332, aplicada a qualquer raça via mapping raça→size. NÃO descrever (a) como Gompertz.",
    title_en: "Digital Twin & projections — TWO distinct engines: (a) condition × nutraceutical progression = calibrated SIGMOID 1/(1+exp(-k·(t−t50))) in condition-progression-engine.ts:86 anchored on condition_response_curves; (b) biological aging = GOMPERTZ curve per SIZE CATEGORY (4 calibrated categories — small/medium/large/giant — Dog Aging Project/Kraus 2013) in breed_aging_curves + supabase/functions/project-pet-trajectory/index.ts:332, applied to any breed via breed→size mapping. Do NOT describe (a) as Gompertz.",
    evidence: { notes: ["condition-progression-engine.ts:86 (sigmoide para condição × tratamento)", "condition_response_curves (calibração da sigmoide)", "breed_aging_curves (4 linhas, por size category, Kraus 2013)", "project-pet-trajectory/index.ts:332 (gompertz_alpha/beta aplicados via size mapping; função ATIVA via usePetTrajectoryProjection)", "proposal-roi.ts"] },
    expected_status_hint: "active",
  },
  {
    id: "treatment-proposal",
    pillar: "digital-twin",
    title_pt: "Sistema de propostas terapêuticas com cronograma e ROI",
    title_en: "Treatment proposal system with schedule and ROI",
    evidence: { tabs: ["custo-beneficio"], notes: ["ProposalAIChat, ScenarioComparison"] },
    expected_status_hint: "active",
  },

  // ────────── Compliance ──────────
  { id: "compliance-fda", pillar: "compliance", title_pt: "Conformidade FDA", title_en: "FDA compliance", evidence: { tabs: ["compliance"] }, expected_status_hint: "partial" },
  { id: "compliance-ema", pillar: "compliance", title_pt: "Conformidade EMA", title_en: "EMA compliance", evidence: { tabs: ["compliance"] }, expected_status_hint: "partial" },
  { id: "compliance-avma", pillar: "compliance", title_pt: "Conformidade AVMA", title_en: "AVMA compliance", evidence: { tabs: ["compliance"] }, expected_status_hint: "partial" },
  { id: "compliance-gmlp", pillar: "compliance", title_pt: "Good Machine Learning Practice (GMLP)", title_en: "Good Machine Learning Practice (GMLP)", evidence: { tabs: ["compliance"] }, expected_status_hint: "partial" },

  // ────────── Bilingual ──────────
  {
    id: "bilingual-parity",
    pillar: "bilingual",
    title_pt: "Paridade PT/EN — chaves i18n, dados estáticos e DB (name_en)",
    title_en: "PT/EN parity — i18n keys, static data and DB (name_en)",
    evidence: { tabs: ["translations"], edge_functions: ["translate-text", "translate-conditions", "run-translation-audit"] },
    expected_status_hint: "active",
  },
  {
    id: "i18n-versioning",
    pillar: "bilingual",
    title_pt: "Versionamento I18N_VERSION + cache-busting",
    title_en: "I18N_VERSION versioning + cache-busting",
    evidence: { notes: ["src/i18n.ts I18N_VERSION incremental"] },
    expected_status_hint: "active",
  },

  // ────────── Operações ──────────
  {
    id: "ai-prompts-governance",
    pillar: "operations",
    title_pt: "AI Prompts (versionamento + ativo por tarefa/modelo)",
    title_en: "AI prompts (versioning + active per task/model)",
    evidence: { tabs: ["prompts", "config-ia"], tables: ["ai_prompt_versions"] },
    expected_status_hint: "active",
  },
  {
    id: "analytics",
    pillar: "operations",
    title_pt: "Analytics e métricas operacionais",
    title_en: "Analytics and operational metrics",
    evidence: { tabs: ["analytics"] },
    expected_status_hint: "active",
  },
  {
    id: "demo-data-governance",
    pillar: "operations",
    title_pt: "Governança de dados de demo (is_demo + bulk-delete protegido)",
    title_en: "Demo data governance (is_demo + guarded bulk-delete)",
    evidence: { tabs: ["pet-management"], notes: ["flag is_demo em pets"] },
    expected_status_hint: "active",
  },
  {
    id: "no-mock-policy",
    pillar: "operations",
    title_pt: "Política No-Mock (sem dados simulados em módulos clínicos)",
    title_en: "No-mock policy (no simulated data in clinical modules)",
    evidence: { notes: ["regra core do projeto"] },
    expected_status_hint: "active",
  },

  // ────────── Sandbox / Planejado ──────────
  {
    id: "clinical-monitoring",
    pillar: "sandbox-planned",
    title_pt: "Monitoramento clínico longitudinal (RWPM)",
    title_en: "Longitudinal clinical monitoring (RWPM)",
    evidence: { tabs: ["clinical-monitoring"] },
    expected_status_hint: "partial",
  },
  {
    id: "invoxia-integration",
    pillar: "sandbox-planned",
    title_pt: "Integração Invoxia (atividade/biometria)",
    title_en: "Invoxia integration (activity/biometrics)",
    evidence: { edge_functions: ["invoxia-api"] },
    expected_status_hint: "sandbox",
  },
];

/** Agrupamento pronto para renderização. */
export function coverageByPillar() {
  const map = new Map<CoveragePillar, CoverageItem[]>();
  for (const pillar of COVERAGE_PILLARS) map.set(pillar.id, []);
  for (const item of AUDIT_COVERAGE) map.get(item.pillar)?.push(item);
  return COVERAGE_PILLARS.map((p) => ({ ...p, items: map.get(p.id) ?? [] }));
}

/** Render bilíngue (PT) para uso como escopo default no diálogo. */
export function renderCoverageScopePt(): string {
  const lines: string[] = [
    "Cobertura mínima OBRIGATÓRIA desta auditoria (cada item deve aparecer no relatório com status real: ativo / parcial / doc-only / sandbox / planejado):",
    "",
  ];
  for (const group of coverageByPillar()) {
    lines.push(`▸ ${group.title_pt}`);
    for (const item of group.items) {
      lines.push(`  • ${item.title_pt}`);
    }
    lines.push("");
  }
  lines.push(
    "Adicione ênfases adicionais abaixo conforme o foco desta auditoria — o checklist acima nunca pode ser reduzido.",
  );
  return lines.join("\n");
}

/** Versão sucinta (id + título) para o prompt do LLM. */
export function renderCoverageChecklistForPrompt(): string {
  return coverageByPillar()
    .map(
      (g) =>
        `## ${g.title_pt} (${g.id})\n` +
        g.items
          .map(
            (i) =>
              `- [${i.id}] ${i.title_pt} — verificar via: ${[
                i.evidence.tabs?.length ? `tabs=${i.evidence.tabs.join(",")}` : null,
                i.evidence.edge_functions?.length ? `fns=${i.evidence.edge_functions.join(",")}` : null,
                i.evidence.tables?.length ? `tabelas=${i.evidence.tables.join(",")}` : null,
                i.evidence.notes?.length ? `notas=${i.evidence.notes.join(" | ")}` : null,
              ]
                .filter(Boolean)
                .join(" · ")} (hint: ${i.expected_status_hint})`,
          )
          .join("\n"),
    )
    .join("\n\n");
}

export const COVERAGE_VERSION = "1.0.0";