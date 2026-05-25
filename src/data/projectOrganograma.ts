// Espelho tipado da arquitetura do projeto NutraTherapy.
// Fonte única usada pela página /administrador?tab=organograma.
// SEMPRE atualizar este arquivo quando uma nova área/componente
// importante for adicionado, removido ou refatorado.
// Ver memory: mem://architecture/organograma-source-of-truth

export interface OrganogramaNode {
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  files?: string[];
  children?: OrganogramaNode[];
}

export type OrganogramaAreaKey =
  | "auth"
  | "curation"
  | "kg"
  | "base-knowledge"
  | "clinical-pipeline"
  | "vet-ui"
  | "tutor-ui"
  | "admin"
  | "i18n"
  | "infra";

export interface OrganogramaArea extends OrganogramaNode {
  key: OrganogramaAreaKey;
  /** Outras áreas para as quais esta envia dados (cross-links no grafo). */
  linksTo?: OrganogramaAreaKey[];
}

export const organogramaLastUpdated = "2026-05-25";

export const organogramaConvencoes: { label: string; label_en: string; value: string; value_en: string }[] = [
  { label: "Idioma", label_en: "Language", value: "PT-BR + EN obrigatórios — incrementar I18N_VERSION em src/i18n.ts a cada mudança de string", value_en: "PT-BR + EN mandatory — increment I18N_VERSION in src/i18n.ts on every string change" },
  { label: "No-mock", label_en: "No-mock", value: "Apenas dados reais do banco e edge functions — sinalizar explicitamente quando algo for LLM-only", value_en: "Real DB data and edge functions only — explicitly label when something is LLM-only" },
  { label: "Backend", label_en: "Backend", value: "Lovable Cloud (Supabase abstraído) — nunca mencionar Supabase ao usuário final", value_en: "Lovable Cloud (Supabase abstracted) — never mention Supabase to the end user" },
  { label: "IDs canônicos", label_en: "Canonical IDs", value: "Sempre usar UUID Supabase (node.properties.id), nunca elementId do Neo4j", value_en: "Always use Supabase UUID (node.properties.id), never Neo4j elementId" },
  { label: "Taxonomia", label_en: "Taxonomy", value: "SNOMED-CT VetSCT + UMLS, governadas por src/data/biomedical-taxonomy.ts", value_en: "SNOMED-CT VetSCT + UMLS, governed by src/data/biomedical-taxonomy.ts" },
  { label: "Curadoria", label_en: "Curation", value: "Triplets só entram no KG após aprovação manual; ≥50% confiança autoaprova", value_en: "Triplets only enter the KG after manual approval; ≥50% confidence auto-approves" },
  { label: "Escopo clínico", label_en: "Clinical scope", value: "Cães — condições metabólicas e degenerativas (sem imagem complexa)", value_en: "Dogs — metabolic and degenerative conditions (no complex imaging)" },
  { label: "Stack terapêutico", label_en: "Therapeutic stack", value: "Máx 8 compostos sinérgicos, nomes humanos, deduplicado por chave alfanumérica", value_en: "Max 8 synergistic compounds, human-readable names, deduped by alphanumeric key" },
];

export const organograma: OrganogramaArea[] = [
  {
    key: "auth",
    title: "Autenticação & Acesso",
    title_en: "Authentication & Access",
    description: "Login, perfis, papéis (admin/vet/tutor) e fila de solicitações de acesso.",
    description_en: "Login, profiles, roles (admin/vet/tutor) and access request queue.",
    linksTo: ["admin", "vet-ui", "tutor-ui"],
    children: [
      {
        title: "Login / Signup",
        title_en: "Login / Signup",
        description: "E-mail+senha + OAuth Google. Sem signup anônimo.",
        description_en: "Email+password + Google OAuth. No anonymous signup.",
        files: ["src/pages/Auth.tsx", "src/contexts/AuthContext.tsx"],
      },
      {
        title: "Perfis & papéis",
        title_en: "Profiles & Roles",
        description: "Tabela profiles + user_roles (RLS). is_admin() security definer.",
        description_en: "profiles + user_roles table (RLS). is_admin() security definer.",
        files: ["src/components/administrador/access/AccessRequestsPanel.tsx"],
      },
      {
        title: "Solicitações de acesso",
        title_en: "Access Requests",
        description: "Fila pendente revisada por admin via approve_access_request().",
        description_en: "Pending queue reviewed by admin via approve_access_request().",
        files: ["src/components/administrador/access/AccessRequestsPanel.tsx"],
      },
    ],
  },
  {
    key: "curation",
    title: "Curadoria Científica",
    title_en: "Scientific Curation",
    description: "Pipeline de 7 estágios: PDF → digestão → embeddings → triplets → curadoria humana → KG.",
    description_en: "7-stage pipeline: PDF → digestion → embeddings → triplets → human curation → KG.",
    linksTo: ["kg", "base-knowledge"],
    children: [
      {
        title: "Upload & digestão",
        title_en: "Upload & Digestion",
        description: "Hash SHA-256 antiduplicação, Levenshtein no título, log imutável.",
        description_en: "SHA-256 hash deduplication, Levenshtein on title, immutable log.",
        files: [
          "src/components/administrador/EstudosTab.tsx",
          "supabase/functions/process-pdf/index.ts",
        ],
      },
      {
        title: "Extração de triplets",
        title_en: "Triplet Extraction",
        description: "Chunking + Gemini Pro. Predicados normalizados via dicionário.",
        description_en: "Chunking + Gemini Pro. Predicates normalized via dictionary.",
        files: ["supabase/functions/extract-triplets/index.ts"],
      },
      {
        title: "Kanban de curadoria",
        title_en: "Curation Kanban",
        description: "Pendentes / Aprovados / Rejeitados com excerpt-source e chat inline.",
        description_en: "Pending / Approved / Rejected with source excerpts and inline chat.",
        files: ["src/components/administrador/estudos/curation/TripletCurationBoard.tsx"],
      },
      {
        title: "Curadoria de doses",
        title_en: "Dosage Curation",
        description: "Web autoritativo, KG triplet, estimativa IA — selos de proveniência.",
        description_en: "Authoritative web, KG triplet, AI estimate — provenance badges.",
        files: ["src/components/administrador/dosage-curation/DosageCurationPanel.tsx"],
      },
      {
        title: "Conflitos de evidência",
        title_en: "Evidence Conflicts",
        description: "Resolução canônica por especialista quando estudos divergem.",
        description_en: "Canonical resolution by expert when studies conflict.",
        files: ["src/components/administrador/conflicts/ConflictReviewPanel.tsx"],
      },
    ],
  },
  {
    key: "kg",
    title: "Knowledge Graph",
    title_en: "Knowledge Graph",
    description: "Grafo causal de 5 camadas (Composto → Mecanismo → Pathway → Condição → Outcome).",
    description_en: "5-layer causal graph (Compound → Mechanism → Pathway → Condition → Outcome).",
    linksTo: ["clinical-pipeline"],
    children: [
      {
        title: "Visualização 3D (force-graph)",
        title_en: "3D Visualization (force-graph)",
        description: "react-force-graph-3d com WebGL para escalar +10k nós.",
        description_en: "react-force-graph-3d with WebGL to scale 10k+ nodes.",
        files: ["src/components/administrador/visualizations/KnowledgeGraphViewer.tsx"],
      },
      {
        title: "Sync Neo4j",
        title_en: "Neo4j Sync",
        description: "Espelha hierarchical_edges do Postgres para Neo4j com canonical IDs.",
        description_en: "Mirrors hierarchical_edges from Postgres to Neo4j with canonical IDs.",
        files: [
          "supabase/functions/neo4j-sync/index.ts",
          "supabase/functions/neo4j-query/index.ts",
        ],
      },
      {
        title: "Tab Relações",
        title_en: "Relations Tab",
        description: "Lista hierarchical_edges via RPC get_relations_graph_data.",
        description_en: "Lists hierarchical_edges via RPC get_relations_graph_data.",
        files: ["src/components/administrador/visualizations/relations/RelationsTab.tsx"],
      },
      {
        title: "Auditoria de Ontologia",
        title_en: "Ontology Audit",
        description: "Reclassificação interativa de entidades biológicas.",
        description_en: "Interactive reclassification of biological entities.",
        files: ["src/components/administrador/auditoria/OntologyAuditTab.tsx"],
      },
    ],
  },
  {
    key: "base-knowledge",
    title: "Base de Conhecimento",
    title_en: "Knowledge Base",
    description: "Entidades canônicas (compostos, condições, raças, exames) — manualmente curadas.",
    description_en: "Canonical entities (compounds, conditions, breeds, exams) — manually curated.",
    linksTo: ["kg", "clinical-pipeline"],
    children: [
      {
        title: "Dados base",
        title_en: "Base Data",
        description: "Importação SNOMED/UMLS + curadoria admin.",
        description_en: "SNOMED/UMLS import + admin curation.",
        files: ["src/components/administrador/base-knowledge/BaseKnowledgeTab.tsx"],
      },
      {
        title: "Raças & predisposições",
        title_en: "Breeds & Predispositions",
        description: "Mapa raça → risco genético usado no estágio Stage-2 do pipeline.",
        description_en: "Breed → genetic risk map used in Stage-2 of the pipeline.",
        files: ["src/components/administrador/breeds/BreedsManagementTab.tsx"],
      },
      {
        title: "Referências laboratoriais",
        title_en: "Lab References",
        description: "Intervalos caninos por idade/peso para interpretação de exames.",
        description_en: "Canine ranges by age/weight for lab result interpretation.",
        files: ["src/components/administrador/lab-references/LabReferencesTab.tsx"],
      },
      {
        title: "Mapeamento SNOMED/UMLS",
        title_en: "SNOMED/UMLS Mapping",
        description: "Vincula entidades locais a códigos padronizados.",
        description_en: "Links local entities to standardized codes.",
        files: ["src/components/administrador/OntologyMappingTab.tsx"],
      },
      {
        title: "Taxonomia biomédica",
        title_en: "Biomedical Taxonomy",
        description: "Dicionário governando classificação multi-tier.",
        description_en: "Dictionary governing multi-tier classification.",
        files: ["src/data/biomedical-taxonomy.ts"],
      },
    ],
  },
  {
    key: "clinical-pipeline",
    title: "Pipeline Clínico Senex AI",
    title_en: "Senex AI Clinical Pipeline",
    description: "7 estágios que transformam dados do pet em recomendações geroprotetoras justificadas.",
    description_en: "7 stages transforming pet data into justified geroprotector recommendations.",
    linksTo: ["vet-ui"],
    children: [
      {
        title: "Orquestrador",
        title_en: "Orchestrator",
        description: "runClinicalAnalysisPipeline emite stage-start/end/log para a UI ao vivo.",
        description_en: "runClinicalAnalysisPipeline emits stage-start/end/log for the live UI.",
        files: ["src/services/clinical/runClinicalAnalysisPipeline.ts"],
      },
      {
        title: "Stage 1 — Predisposições",
        title_en: "Stage 1 — Predispositions",
        description: "Cruza raça do pet com breed_predispositions.",
        description_en: "Cross-references pet breed with breed_predispositions.",
        files: ["src/services/clinical/stages/predispositions.ts"],
      },
      {
        title: "Stage 2 — Exames vs referências",
        title_en: "Stage 2 — Labs vs References",
        description: "Compara bloodwork com lab_references por idade/peso.",
        description_en: "Compares bloodwork with lab_references by age/weight.",
        files: ["src/services/clinical/stages/labAnalysis.ts"],
      },
      {
        title: "Stage 3 — Consulta KG",
        title_en: "Stage 3 — KG Query",
        description: "Busca triplets aprovados (composto → condição) com confidence ≥ threshold.",
        description_en: "Fetches approved triplets (compound → condition) with confidence ≥ threshold.",
        files: ["supabase/functions/kg-query/index.ts"],
      },
      {
        title: "Stage 4 — Interações & contraindicações",
        title_en: "Stage 4 — Interactions & Contraindications",
        description: "Filtra compostos que conflitam com medicamentos atuais.",
        description_en: "Filters compounds conflicting with current medications.",
        files: ["src/services/clinical/stages/interactions.ts"],
      },
      {
        title: "Stage 5 — Stack final",
        title_en: "Stage 5 — Final Stack",
        description: "Cap de 8 compostos sinérgicos, deduplicação por chave alfanumérica.",
        description_en: "Cap of 8 synergistic compounds, deduplication by alphanumeric key.",
        files: ["supabase/functions/hybrid-recommendation/index.ts"],
      },
      {
        title: "Stage 6 — Projeção de trajetória",
        title_en: "Stage 6 — Trajectory Projection",
        description: "Curva sigmoide de severidade vs tempo com baseline real do pet.",
        description_en: "Sigmoid severity-vs-time curve with the pet's real baseline.",
        files: ["supabase/functions/project-pet-trajectory/index.ts"],
      },
      {
        title: "Stage 7 — Triplets faltantes (admin)",
        title_en: "Stage 7 — Missing Triplets (admin)",
        description: "Diagnóstico de gaps no KG quando ganho projetado = 0.",
        description_en: "Diagnosis of KG gaps when projected gain = 0.",
        files: ["supabase/functions/kg-missing-triplets/index.ts"],
      },
    ],
  },
  {
    key: "vet-ui",
    title: "Interface Veterinário",
    title_en: "Veterinarian Interface",
    description: "Perfil do pet, timeline biológica, recomendações com evidências, chats especializados.",
    description_en: "Pet profile, biological timeline, evidence-backed recommendations, specialized chats.",
    linksTo: ["clinical-pipeline", "kg"],
    children: [
      {
        title: "PetProfilePage (3 colunas)",
        title_en: "PetProfilePage (3 columns)",
        description: "Funil cronológico: dados → análise → recomendação.",
        description_en: "Chronological funnel: data → analysis → recommendation.",
        files: ["src/pages/veterinario/PetProfilePage.tsx"],
      },
      {
        title: "Pipeline Workflow + Log ao vivo",
        title_en: "Pipeline Workflow + Live Log",
        description: "Workflow visual que acende por stage real + console com export .log.",
        description_en: "Visual workflow lighting up per real stage + console with .log export.",
        files: [
          "src/components/pet/ClinicalPipelineWorkflow.tsx",
          "src/components/pet/ClinicalPipelineLogPanel.tsx",
        ],
      },
      {
        title: "Digital Twin · Trajetória",
        title_en: "Digital Twin · Trajectory",
        description: "Comparativo cenário-base vs com-protocolo (anos de vida saudável).",
        description_en: "Baseline vs protocol-enhanced scenario comparison (healthy life-years).",
        files: ["src/components/pet/BiologicalTimeline.tsx"],
      },
      {
        title: "Cards de recomendação",
        title_en: "Recommendation Cards",
        description: "Slider de dose + KG embutido + sinergias por paciente + estudos clicáveis.",
        description_en: "Dose slider + embedded KG + per-patient synergies + clickable studies.",
        files: ["src/components/pet/CompoundDosageSlider.tsx"],
      },
      {
        title: "Painéis de evidência",
        title_en: "Evidence Panels",
        description: "Pathway biológico, projeção de melhora, missing triplets (admin).",
        description_en: "Biological pathway, improvement projection, missing triplets (admin).",
        files: [
          "src/components/pet/MissingTripletsDialog.tsx",
          "src/components/pet/VetRecommendationPanel.tsx",
        ],
      },
    ],
  },
  {
    key: "tutor-ui",
    title: "Interface Tutor",
    title_en: "Tutor Interface",
    description: "Landing, planos, aprovação de protocolo, acompanhamento mensal.",
    description_en: "Landing, plans, protocol approval, monthly follow-up.",
    children: [
      {
        title: "Landing & planos",
        title_en: "Landing & Plans",
        description: "Página pública e seleção de plano anual.",
        description_en: "Public page and annual plan selection.",
        files: ["src/pages/Index.tsx"],
      },
      {
        title: "Aprovação de protocolo",
        title_en: "Protocol Approval",
        description: "Tutor revisa o stack proposto pelo veterinário.",
        description_en: "Tutor reviews the stack proposed by the veterinarian.",
        files: ["src/pages/tutor/"],
      },
    ],
  },
  {
    key: "admin",
    title: "Painel Admin",
    title_en: "Admin Panel",
    description: "27+ tabs agrupadas (Knowledge Base, Data Processing, Research, Configuration).",
    description_en: "27+ grouped tabs (Knowledge Base, Data Processing, Research, Configuration).",
    linksTo: ["curation", "kg", "base-knowledge", "i18n"],
    children: [
      {
        title: "Configuração centralizada",
        title_en: "Centralized Configuration",
        description: "adminTabsConfig com lazy loading + grupos.",
        description_en: "adminTabsConfig with lazy loading + groups.",
        files: ["src/config/admin-tabs.ts"],
      },
      {
        title: "Fundamentos Arquiteturais (Meta-KG)",
        title_en: "Architectural Foundations (Meta-KG)",
        description: "Governança: Core Rules (RC-001/002/003), meta-estudos arquiteturais e mapa de influência.",
        description_en: "Governance: Core Rules (RC-001/002/003), architectural meta-studies and influence map.",
        files: [
          "src/pages/administrador/FundamentosTab.tsx",
          "docs/CORE_RULES.md",
        ],
      },
      {
        title: "Sidebar agrupada",
        title_en: "Grouped Sidebar",
        description: "5 grupos: KB, Data, Research, Predictive, Configuration.",
        description_en: "5 groups: KB, Data, Research, Predictive, Configuration.",
        files: ["src/components/administrador/sidebar/AdminSidebarGroups.tsx"],
      },
      {
        title: "Organograma (esta tela)",
        title_en: "Organogram (this screen)",
        description: "Visão estrutural + changelog visual + force-graph + mermaid.",
        description_en: "Structural view + visual changelog + force-graph + mermaid.",
        files: [
          "src/pages/administrador/OrganogramaTab.tsx",
          "src/data/projectOrganograma.ts",
          "src/data/projectChangelog.ts",
        ],
      },
      {
        title: "Gestão de pets",
        title_en: "Pet Management",
        description: "Pets demo (is_demo flag) com complexidade crescente.",
        description_en: "Demo pets (is_demo flag) with increasing complexity.",
        files: ["src/components/administrador/patients/AdminPetManagementTab.tsx"],
      },
      {
        title: "Cobertura de rações (Fase 5)",
        title_en: "Pet Food Coverage (Phase 5)",
        description: "KPIs, heatmap por marca, enriquecimento em lote e log de execuções.",
        description_en: "KPIs, brand heatmap, bulk enrichment and run log.",
        files: [
          "src/components/administrador/pet-food/PetFoodCoverageTab.tsx",
          "supabase/functions/bulk-enrich-pet-food/index.ts",
        ],
      },
      {
        title: "Governança de IA — Modelos & Prompts por Tarefa (Fase 1)",
        title_en: "AI Governance — Models & Prompts by Task (Phase 1)",
        description: "Registro central que mapeia cada família de tarefa (extração, meta-análise, chat clínico, inferência clínica, auditoria) ao modelo do AI Gateway, parâmetros de routing (reasoning, temperature, context caching) e prompt versionado em banco. Painel read-only em /administrador?tab=ai-config.",
        description_en: "Central registry mapping each task family (extraction, meta-analysis, clinical chat, clinical inference, auditing) to its AI Gateway model, routing parameters (reasoning, temperature, context caching) and DB-versioned prompt. Read-only panel at /administrador?tab=ai-config.",
        files: [
          "src/config/ai-tasks.ts",
          "src/hooks/useAIPromptVersions.ts",
          "src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx",
          "src/components/administrador/ConfiguracoesIATab.tsx",
          "supabase/migrations/20260521160844_233e5785-acfa-4994-8725-7a45895634c0.sql",
        ],
      },
      {
        title: "Painel de Priorizações + Camada de Visualização de Papéis",
        title_en: "Prioritization Panel + Role Visualization Layer",
        description: "Aba 'Priorizações' (Kanban com 5 colunas) como fonte única do roadmap operacional + Gerador de Sugestões de Cohort para a PetLove. Camada de visualização declarativa (5 perfis: Arquiteto, Líder P&D, Vet-Curador, Vet-Responsável, Tutor) filtra grupos da sidebar via RoleViewSwitcher no Header. NÃO é segurança — é redução de ruído cognitivo.",
        description_en: "'Prioritization' tab (5-column Kanban) as single source of the operational roadmap + Cohort Request Generator for PetLove. Declarative role visualization layer (5 profiles) filters sidebar groups via RoleViewSwitcher in the Header. NOT security — cognitive load reduction.",
        files: [
          "src/pages/administrador/PriorizacoesTab.tsx",
          "src/components/administrador/priorizacoes/PrioritizationBoard.tsx",
          "src/components/administrador/priorizacoes/PrioritizationCard.tsx",
          "src/components/administrador/priorizacoes/CohortRequestGenerator.tsx",
          "src/data/prioritizationBoard.ts",
          "src/config/role-views.ts",
          "src/contexts/RoleViewContext.tsx",
          "src/components/layout/RoleViewSwitcher.tsx",
        ],
      },
    ],
  },
  {
    key: "i18n",
    title: "Internacionalização",
    title_en: "Internationalization",
    description: "PT/EN obrigatório com I18N_VERSION para cache busting.",
    description_en: "PT/EN mandatory with I18N_VERSION for cache busting.",
    children: [
      {
        title: "Bootstrap i18n",
        title_en: "i18n Bootstrap",
        description: "Detector de versão recarrega bundles quando versão muda.",
        description_en: "Version detector reloads bundles when version changes.",
        files: ["src/i18n.ts"],
      },
      {
        title: "Bundles",
        title_en: "Bundles",
        description: "translation.json em PT e EN — chaves espelhadas obrigatoriamente.",
        description_en: "translation.json in PT and EN — mirrored keys mandatory.",
        files: [
          "src/locales/pt/translation.json",
          "src/locales/en/translation.json",
        ],
      },
      {
        title: "Translations Hub (Audit + Manage)",
        title_en: "Translations Hub (Audit + Manage)",
        description: "Hub único com sub-tabs Audit (cobertura) + Manage (edição via DB).",
        description_en: "Single hub with Audit (coverage) + Manage (DB edit) sub-tabs.",
        files: [
          "src/components/administrador/TranslationsHub.tsx",
          "src/components/administrador/auditoria/TranslationAuditTab.tsx",
          "src/components/administrador/traducoes/TranslationManager.tsx",
        ],
      },
    ],
  },
  {
    key: "infra",
    title: "Infraestrutura",
    title_en: "Infrastructure",
    description: "Lovable Cloud (Postgres + Storage + Edge Functions), secrets, AI Gateway.",
    description_en: "Lovable Cloud (Postgres + Storage + Edge Functions), secrets, AI Gateway.",
    children: [
      {
        title: "Edge Functions",
        title_en: "Edge Functions",
        description: "Deploy automático; verify_jwt configurável por função.",
        description_en: "Automatic deploy; verify_jwt configurable per function.",
        files: ["supabase/config.toml", "supabase/functions/"],
      },
      {
        title: "Storage",
        title_en: "Storage",
        description: "Bucket study_pdfs (privado) para PDFs originais.",
        description_en: "study_pdfs bucket (private) for original PDFs.",
      },
      {
        title: "Lovable AI Gateway",
        title_en: "Lovable AI Gateway",
        description: "Gemini 3 Pro/Flash + GPT-5 sem API key do usuário.",
        description_en: "Gemini 3 Pro/Flash + GPT-5 without user API key.",
      },
      {
        title: "Secrets",
        title_en: "Secrets",
        description: "GOOGLE_AI_API_KEY, OPENAI_API_KEY, INVOXIA_*, etc.",
        description_en: "GOOGLE_AI_API_KEY, OPENAI_API_KEY, INVOXIA_*, etc.",
      },
    ],
  },
];

/** Árvore ASCII gerada a partir do array acima — fallback simples e copiável. */
function buildAscii(): string {
  const lines: string[] = ["NutraTherapy"];
  organograma.forEach((area, ai) => {
    const isLastArea = ai === organograma.length - 1;
    const areaPrefix = isLastArea ? "└─" : "├─";
    lines.push(`${areaPrefix} ${area.title}`);
    const childPad = isLastArea ? "   " : "│  ";
    (area.children ?? []).forEach((child, ci) => {
      const isLastChild = ci === (area.children!.length - 1);
      const childPrefix = isLastChild ? "└─" : "├─";
      lines.push(`${childPad}${childPrefix} ${child.title}`);
    });
  });
  return lines.join("\n");
}

export const organogramaAscii = buildAscii();
