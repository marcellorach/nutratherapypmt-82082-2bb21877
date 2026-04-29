// Espelho tipado da arquitetura do projeto NutraTherapy.
// Fonte única usada pela página /administrador?tab=organograma.
// SEMPRE atualizar este arquivo quando uma nova área/componente
// importante for adicionado, removido ou refatorado.
// Ver memory: mem://architecture/organograma-source-of-truth

export interface OrganogramaNode {
  title: string;
  description?: string;
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

export const organogramaLastUpdated = "2026-04-29";

export const organogramaConvencoes: { label: string; value: string }[] = [
  { label: "Idioma", value: "PT-BR + EN obrigatórios — incrementar I18N_VERSION em src/i18n.ts a cada mudança de string" },
  { label: "No-mock", value: "Apenas dados reais do banco e edge functions — sinalizar explicitamente quando algo for LLM-only" },
  { label: "Backend", value: "Lovable Cloud (Supabase abstraído) — nunca mencionar Supabase ao usuário final" },
  { label: "IDs canônicos", value: "Sempre usar UUID Supabase (node.properties.id), nunca elementId do Neo4j" },
  { label: "Taxonomia", value: "SNOMED-CT VetSCT + UMLS, governadas por src/data/biomedical-taxonomy.ts" },
  { label: "Curadoria", value: "Triplets só entram no KG após aprovação manual; ≥50% confiança autoaprova" },
  { label: "Escopo clínico", value: "Cães — condições metabólicas e degenerativas (sem imagem complexa)" },
  { label: "Stack terapêutico", value: "Máx 8 compostos sinérgicos, nomes humanos, deduplicado por chave alfanumérica" },
];

export const organograma: OrganogramaArea[] = [
  {
    key: "auth",
    title: "Autenticação & Acesso",
    description: "Login, perfis, papéis (admin/vet/tutor) e fila de solicitações de acesso.",
    linksTo: ["admin", "vet-ui", "tutor-ui"],
    children: [
      {
        title: "Login / Signup",
        description: "E-mail+senha + OAuth Google. Sem signup anônimo.",
        files: ["src/pages/Auth.tsx", "src/contexts/AuthContext.tsx"],
      },
      {
        title: "Perfis & papéis",
        description: "Tabela profiles + user_roles (RLS). is_admin() security definer.",
        files: ["src/components/administrador/access/AccessRequestsPanel.tsx"],
      },
      {
        title: "Solicitações de acesso",
        description: "Fila pendente revisada por admin via approve_access_request().",
        files: ["src/components/administrador/access/AccessRequestsPanel.tsx"],
      },
    ],
  },
  {
    key: "curation",
    title: "Curadoria Científica",
    description: "Pipeline de 7 estágios: PDF → digestão → embeddings → triplets → curadoria humana → KG.",
    linksTo: ["kg", "base-knowledge"],
    children: [
      {
        title: "Upload & digestão",
        description: "Hash SHA-256 antiduplicação, Levenshtein no título, log imutável.",
        files: [
          "src/components/administrador/EstudosTab.tsx",
          "supabase/functions/process-pdf/index.ts",
        ],
      },
      {
        title: "Extração de triplets",
        description: "Chunking + Gemini Pro. Predicados normalizados via dicionário.",
        files: ["supabase/functions/extract-triplets/index.ts"],
      },
      {
        title: "Kanban de curadoria",
        description: "Pendentes / Aprovados / Rejeitados com excerpt-source e chat inline.",
        files: ["src/components/administrador/estudos/curation/TripletCurationBoard.tsx"],
      },
      {
        title: "Curadoria de doses",
        description: "Web autoritativo, KG triplet, estimativa IA — selos de proveniência.",
        files: ["src/components/administrador/dosage-curation/DosageCurationPanel.tsx"],
      },
      {
        title: "Conflitos de evidência",
        description: "Resolução canônica por especialista quando estudos divergem.",
        files: ["src/components/administrador/conflicts/ConflictReviewPanel.tsx"],
      },
    ],
  },
  {
    key: "kg",
    title: "Knowledge Graph",
    description: "Grafo causal de 5 camadas (Composto → Mecanismo → Pathway → Condição → Outcome).",
    linksTo: ["clinical-pipeline"],
    children: [
      {
        title: "Visualização 3D (force-graph)",
        description: "react-force-graph-3d com WebGL para escalar +10k nós.",
        files: ["src/components/administrador/visualizations/KnowledgeGraphViewer.tsx"],
      },
      {
        title: "Sync Neo4j",
        description: "Espelha hierarchical_edges do Postgres para Neo4j com canonical IDs.",
        files: [
          "supabase/functions/neo4j-sync/index.ts",
          "supabase/functions/neo4j-query/index.ts",
        ],
      },
      {
        title: "Tab Relações",
        description: "Lista hierarchical_edges via RPC get_relations_graph_data.",
        files: ["src/components/administrador/visualizations/relations/RelationsTab.tsx"],
      },
      {
        title: "Auditoria de Ontologia",
        description: "Reclassificação interativa de entidades biológicas.",
        files: ["src/components/administrador/auditoria/OntologyAuditTab.tsx"],
      },
    ],
  },
  {
    key: "base-knowledge",
    title: "Base de Conhecimento",
    description: "Entidades canônicas (compostos, condições, raças, exames) — manualmente curadas.",
    linksTo: ["kg", "clinical-pipeline"],
    children: [
      {
        title: "Dados base",
        description: "Importação SNOMED/UMLS + curadoria admin.",
        files: ["src/components/administrador/base-knowledge/BaseKnowledgeTab.tsx"],
      },
      {
        title: "Raças & predisposições",
        description: "Mapa raça → risco genético usado no estágio Stage-2 do pipeline.",
        files: ["src/components/administrador/breeds/BreedsManagementTab.tsx"],
      },
      {
        title: "Referências laboratoriais",
        description: "Intervalos caninos por idade/peso para interpretação de exames.",
        files: ["src/components/administrador/lab-references/LabReferencesTab.tsx"],
      },
      {
        title: "Mapeamento SNOMED/UMLS",
        description: "Vincula entidades locais a códigos padronizados.",
        files: ["src/components/administrador/OntologyMappingTab.tsx"],
      },
      {
        title: "Taxonomia biomédica",
        description: "Dicionário governando classificação multi-tier.",
        files: ["src/data/biomedical-taxonomy.ts"],
      },
    ],
  },
  {
    key: "clinical-pipeline",
    title: "Pipeline Clínico VetGraphRAG",
    description: "7 estágios que transformam dados do pet em recomendações geroprotetoras justificadas.",
    linksTo: ["vet-ui"],
    children: [
      {
        title: "Orquestrador",
        description: "runClinicalAnalysisPipeline emite stage-start/end/log para a UI ao vivo.",
        files: ["src/services/clinical/runClinicalAnalysisPipeline.ts"],
      },
      {
        title: "Stage 1 — Predisposições",
        description: "Cruza raça do pet com breed_predispositions.",
        files: ["src/services/clinical/stages/predispositions.ts"],
      },
      {
        title: "Stage 2 — Exames vs referências",
        description: "Compara bloodwork com lab_references por idade/peso.",
        files: ["src/services/clinical/stages/labAnalysis.ts"],
      },
      {
        title: "Stage 3 — Consulta KG",
        description: "Busca triplets aprovados (composto → condição) com confidence ≥ threshold.",
        files: ["supabase/functions/kg-query/index.ts"],
      },
      {
        title: "Stage 4 — Interações & contraindicações",
        description: "Filtra compostos que conflitam com medicamentos atuais.",
        files: ["src/services/clinical/stages/interactions.ts"],
      },
      {
        title: "Stage 5 — Stack final",
        description: "Cap de 8 compostos sinérgicos, deduplicação por chave alfanumérica.",
        files: ["supabase/functions/hybrid-recommendation/index.ts"],
      },
      {
        title: "Stage 6 — Projeção de trajetória",
        description: "Curva sigmoide de severidade vs tempo com baseline real do pet.",
        files: ["supabase/functions/project-pet-trajectory/index.ts"],
      },
      {
        title: "Stage 7 — Triplets faltantes (admin)",
        description: "Diagnóstico de gaps no KG quando ganho projetado = 0.",
        files: ["supabase/functions/kg-missing-triplets/index.ts"],
      },
    ],
  },
  {
    key: "vet-ui",
    title: "Interface Veterinário",
    description: "Perfil do pet, timeline biológica, recomendações com evidências, chats especializados.",
    linksTo: ["clinical-pipeline", "kg"],
    children: [
      {
        title: "PetProfilePage (3 colunas)",
        description: "Funil cronológico: dados → análise → recomendação.",
        files: ["src/pages/veterinario/PetProfilePage.tsx"],
      },
      {
        title: "Pipeline Workflow + Log ao vivo",
        description: "Workflow visual que acende por stage real + console com export .log.",
        files: [
          "src/components/pet/ClinicalPipelineWorkflow.tsx",
          "src/components/pet/ClinicalPipelineLogPanel.tsx",
        ],
      },
      {
        title: "Digital Twin · Trajetória",
        description: "Comparativo cenário-base vs com-protocolo (anos de vida saudável).",
        files: ["src/components/pet/BiologicalTimeline.tsx"],
      },
      {
        title: "Cards de recomendação",
        description: "Slider de dose + KG embutido + sinergias por paciente + estudos clicáveis.",
        files: ["src/components/pet/CompoundDosageSlider.tsx"],
      },
      {
        title: "Painéis de evidência",
        description: "Pathway biológico, projeção de melhora, missing triplets (admin).",
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
    description: "Landing, planos, aprovação de protocolo, acompanhamento mensal.",
    children: [
      {
        title: "Landing & planos",
        description: "Página pública e seleção de plano anual.",
        files: ["src/pages/Index.tsx"],
      },
      {
        title: "Aprovação de protocolo",
        description: "Tutor revisa o stack proposto pelo veterinário.",
        files: ["src/pages/tutor/"],
      },
    ],
  },
  {
    key: "admin",
    title: "Painel Admin",
    description: "27+ tabs agrupadas (Knowledge Base, Data Processing, Research, Configuration).",
    linksTo: ["curation", "kg", "base-knowledge", "i18n"],
    children: [
      {
        title: "Configuração centralizada",
        description: "adminTabsConfig com lazy loading + grupos.",
        files: ["src/config/admin-tabs.ts"],
      },
      {
        title: "Sidebar agrupada",
        description: "5 grupos: KB, Data, Research, Predictive, Configuration.",
        files: ["src/components/administrador/sidebar/AdminSidebarGroups.tsx"],
      },
      {
        title: "Organograma (esta tela)",
        description: "Visão estrutural + changelog visual + force-graph + mermaid.",
        files: [
          "src/pages/administrador/OrganogramaTab.tsx",
          "src/data/projectOrganograma.ts",
          "src/data/projectChangelog.ts",
        ],
      },
      {
        title: "Gestão de pets",
        description: "Pets demo (is_demo flag) com complexidade crescente.",
        files: ["src/components/administrador/patients/AdminPetManagementTab.tsx"],
      },
    ],
  },
  {
    key: "i18n",
    title: "Internacionalização",
    description: "PT/EN obrigatório com I18N_VERSION para cache busting.",
    children: [
      {
        title: "Bootstrap i18n",
        description: "Detector de versão recarrega bundles quando versão muda.",
        files: ["src/i18n.ts"],
      },
      {
        title: "Bundles",
        description: "translation.json em PT e EN — chaves espelhadas obrigatoriamente.",
        files: [
          "src/locales/pt/translation.json",
          "src/locales/en/translation.json",
        ],
      },
      {
        title: "Audit & Manager",
        description: "Tabs admin para auditar cobertura e editar via DB.",
        files: [
          "src/components/administrador/auditoria/TranslationAuditTab.tsx",
          "src/components/administrador/traducoes/TranslationManager.tsx",
        ],
      },
    ],
  },
  {
    key: "infra",
    title: "Infraestrutura",
    description: "Lovable Cloud (Postgres + Storage + Edge Functions), secrets, AI Gateway.",
    children: [
      {
        title: "Edge Functions",
        description: "Deploy automático; verify_jwt configurável por função.",
        files: ["supabase/config.toml", "supabase/functions/"],
      },
      {
        title: "Storage",
        description: "Bucket study_pdfs (privado) para PDFs originais.",
      },
      {
        title: "Lovable AI Gateway",
        description: "Gemini 3 Pro/Flash + GPT-5 sem API key do usuário.",
      },
      {
        title: "Secrets",
        description: "GOOGLE_AI_API_KEY, OPENAI_API_KEY, INVOXIA_*, etc.",
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
