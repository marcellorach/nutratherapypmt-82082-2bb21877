/**
 * Registro central de tarefas de IA — Fase 1 (read-only foundation).
 *
 * Mapeia cada "família de tarefa" (curation, meta-analysis, clinical chat, etc.)
 * para os modelos candidatos disponíveis no AI Gateway da Lovable AI, o modelo
 * recomendado como default, parâmetros de routing (reasoning, temperature) e
 * a `prompt_key` correspondente em `ai_prompt_versions`.
 *
 * Fonte da verdade para o painel "Modelos & Prompts por Tarefa" em
 * /administrador?tab=ai-config. Edge functions consumirão este registro via
 * `getModelForTask(taskId)` (Fase 2) — por enquanto é apenas leitura/UI.
 *
 * Ver mem://architecture/changelog-driven-context.
 */

export type AIModelId =
  // Gemini
  | "google/gemini-3-pro-preview"
  | "google/gemini-3-flash-preview"
  | "google/gemini-3.1-pro-preview"
  | "google/gemini-3.5-flash"
  | "google/gemini-2.5-pro"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite"
  // OpenAI
  | "openai/gpt-5"
  | "openai/gpt-5-mini"
  | "openai/gpt-5.2"
  | "openai/gpt-5.4"
  | "openai/gpt-5.4-mini"
  | "openai/gpt-5.4-pro"
  | "openai/gpt-5.5"
  | "openai/gpt-5.5-pro";

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export interface AITaskRouting {
  reasoning_effort?: ReasoningEffort;
  temperature?: number;
  /** Habilitar context caching (Gemini) para reaproveitar tokens entre queries no mesmo documento. */
  context_caching?: boolean;
  /** Notas humanas sobre porque esses parâmetros foram escolhidos. */
  notes?: string;
}

export type AITaskCategory =
  | "extraction"
  | "curation"
  | "meta_analysis"
  | "clinical_chat"
  | "clinical_inference"
  | "auditing";

export interface AITaskDefinition {
  /** Identificador canônico — usado em `ai_prompt_versions.task_id`. */
  id: string;
  /** Rótulo bilíngue para UI. */
  label_pt: string;
  label_en: string;
  description_pt: string;
  description_en: string;
  category: AITaskCategory;
  /** Modelo recomendado para esta tarefa, no formato do AI Gateway. */
  recommended_model: AIModelId;
  /** Outros modelos viáveis (UI mostra como alternativas). */
  candidate_models: AIModelId[];
  /** Parâmetros de routing recomendados ao executar esta tarefa. */
  routing: AITaskRouting;
  /** Chave usada em `ai_prompt_versions.task_id`. Em geral igual a `id`. */
  prompt_key: string;
  /** Edge functions / hooks que executam esta tarefa hoje. Documentação apenas. */
  consumers: string[];
  /** Justificativa bilíngue da escolha do modelo recomendado. */
  rationale_pt: string;
  rationale_en: string;
}

/**
 * Catálogo inicial — espelha os 8 prompts já semeados em `ai_prompt_versions`.
 * Os recomendados refletem a decisão registrada no chat:
 *  - Meta-análise / auditoria de Core Rules → openai/gpt-5.4 reasoning=high
 *  - Chat clínico crítico → openai/gpt-5.4 reasoning=medium
 *  - Chat clínico factual / extração massiva → google/gemini-2.5-pro com caching
 *  - Extração de triplets em larga escala → google/gemini-3-pro-preview
 */
export const AI_TASKS: AITaskDefinition[] = [
  {
    id: "extraction_stage1",
    label_pt: "Extração — Estágio 1 (entidades)",
    label_en: "Extraction — Stage 1 (entities)",
    description_pt: "Identifica entidades biomédicas (compostos, condições, biomarcadores) em PDFs longos.",
    description_en: "Identifies biomedical entities (compounds, conditions, biomarkers) in long PDFs.",
    category: "extraction",
    recommended_model: "google/gemini-3-pro-preview",
    candidate_models: [
      "google/gemini-3-pro-preview",
      "google/gemini-2.5-pro",
      "openai/gpt-5.4",
    ],
    routing: {
      temperature: 0.1,
      context_caching: true,
      notes: "Janela grande + extração estruturada; Gemini 3 Pro lida nativamente com PDF multimodal.",
    },
    prompt_key: "extraction_stage1",
    consumers: ["extract-study-entities", "gemini-file-search"],
    rationale_pt: "Gemini 3 Pro suporta PDF nativo + janela ampla e mantém alta fidelidade textual em extração estruturada.",
    rationale_en: "Gemini 3 Pro handles PDF natively with a large context window and high textual fidelity for structured extraction.",
  },
  {
    id: "extraction_stage2",
    label_pt: "Extração — Estágio 2 (relações)",
    label_en: "Extraction — Stage 2 (relations)",
    description_pt: "Liga entidades em triplets (sujeito-predicado-objeto) com evidência textual.",
    description_en: "Links entities into triplets (subject-predicate-object) with textual evidence.",
    category: "extraction",
    recommended_model: "google/gemini-3-pro-preview",
    candidate_models: ["google/gemini-3-pro-preview", "google/gemini-2.5-pro", "openai/gpt-5.4"],
    routing: { temperature: 0.1, context_caching: true },
    prompt_key: "extraction_stage2",
    consumers: ["extract-study-entities"],
    rationale_pt: "Mesma família do Estágio 1 para reaproveitar cache de contexto sobre o mesmo PDF.",
    rationale_en: "Same family as Stage 1 to reuse context caching over the same PDF.",
  },
  {
    id: "extraction_stage3",
    label_pt: "Extração — Estágio 3 (qualificadores)",
    label_en: "Extraction — Stage 3 (qualifiers)",
    description_pt: "Anexa dose, espécie, raça, duração e confiança a cada triplet.",
    description_en: "Attaches dose, species, breed, duration and confidence to each triplet.",
    category: "extraction",
    recommended_model: "google/gemini-3-pro-preview",
    candidate_models: ["google/gemini-3-pro-preview", "openai/gpt-5.4"],
    routing: { temperature: 0.1, context_caching: true },
    prompt_key: "extraction_stage3",
    consumers: ["extract-study-entities"],
    rationale_pt: "Aproveita o mesmo cache de PDF dos estágios anteriores.",
    rationale_en: "Reuses the PDF cache from previous stages.",
  },
  {
    id: "triplet_extraction",
    label_pt: "Triplets — extração consolidada",
    label_en: "Triplets — consolidated extraction",
    description_pt: "Pipeline legado de triplet extraction (fallback / chunks).",
    description_en: "Legacy triplet extraction pipeline (fallback / chunks).",
    category: "extraction",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "google/gemini-3-pro-preview"],
    routing: { temperature: 0.1 },
    prompt_key: "triplet_extraction",
    consumers: ["extract-triplets", "extract-study-entities (legacy)"],
    rationale_pt: "Gemini 2.5 Pro mantém compatibilidade com o schema atual de triplets em produção.",
    rationale_en: "Gemini 2.5 Pro keeps compatibility with the current production triplets schema.",
  },
  {
    id: "meta_study_analysis",
    label_pt: "Meta-análise — Regras-Core vs. estudos arquiteturais",
    label_en: "Meta-analysis — Core Rules vs. architectural studies",
    description_pt: "Compara N estudos contra Regras-Core ativas; detecta confirmações, extensões e contradições.",
    description_en: "Compares N studies against active Core Rules; detects confirmations, extensions and contradictions.",
    category: "meta_analysis",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "openai/gpt-5.5", "google/gemini-3-pro-preview", "google/gemini-2.5-pro"],
    routing: {
      reasoning_effort: "high",
      temperature: 0.2,
      notes: "reasoning=high captura contradições sutis com qualificadores (ex.: idade, dose, espécie).",
    },
    prompt_key: "extract-meta-study",
    consumers: ["extract-meta-study"],
    rationale_pt: "GPT-5.4 com reasoning=high é o melhor para raciocínio simbólico e detecção de contradições contextuais.",
    rationale_en: "GPT-5.4 with reasoning=high is best at symbolic reasoning and contextual contradiction detection.",
  },
  {
    id: "relations_auditor",
    label_pt: "Auditor de relações (KG)",
    label_en: "Relations auditor (KG)",
    description_pt: "Chat conversacional que audita arestas do Knowledge Graph e gera diagramas.",
    description_en: "Conversational chat that audits Knowledge Graph edges and renders diagrams.",
    category: "auditing",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "google/gemini-2.5-pro"],
    routing: { reasoning_effort: "medium", temperature: 0.3 },
    prompt_key: "relations_auditor",
    consumers: ["chat-relations-auditor"],
    rationale_pt: "Reasoning intermediário equilibra latência e detecção de inconsistências entre arestas.",
    rationale_en: "Medium reasoning balances latency with edge-inconsistency detection.",
  },
  {
    id: "geroprotector_stack",
    label_pt: "Stack geroprotetor (recomendação clínica)",
    label_en: "Geroprotector stack (clinical recommendation)",
    description_pt: "Monta o stack de até 8 compostos sinérgicos a partir do contexto clínico do pet.",
    description_en: "Builds the synergistic stack of up to 8 compounds from the pet's clinical context.",
    category: "clinical_inference",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "google/gemini-2.5-pro", "openai/gpt-5"],
    routing: { reasoning_effort: "medium", temperature: 0.3 },
    prompt_key: "geroprotector_stack",
    consumers: ["hybrid-recommendation", "deep-diagnostic"],
    rationale_pt: "Reasoning explícito reduz alucinação ao ranquear compostos contra contraindicações.",
    rationale_en: "Explicit reasoning lowers hallucination when ranking compounds against contraindications.",
  },
  {
    id: "lab_driven_adjustment",
    label_pt: "Ajuste de stack por exames laboratoriais",
    label_en: "Lab-driven stack adjustment",
    description_pt: "Reavalia o stack com base em desvios de bioquímica/hemograma.",
    description_en: "Re-evaluates the stack based on biochemistry / CBC deviations.",
    category: "clinical_inference",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "google/gemini-2.5-pro"],
    routing: { reasoning_effort: "medium", temperature: 0.2 },
    prompt_key: "lab_driven_adjustment",
    consumers: ["lab-interpretation", "hybrid-recommendation"],
    rationale_pt: "GPT-5.4 lida melhor com regras numéricas (limites de referência) sem inventar valores.",
    rationale_en: "GPT-5.4 handles numeric rules (reference ranges) better without fabricating values.",
  },
  {
    id: "treatment_proposal_12m",
    label_pt: "Proposta de tratamento 12 meses",
    label_en: "12-month treatment proposal",
    description_pt: "Gera plano clínico de 12 meses (exames, milestones, marcos financeiros).",
    description_en: "Generates the 12-month clinical plan (exams, milestones, financial markers).",
    category: "clinical_inference",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "google/gemini-2.5-pro"],
    routing: { reasoning_effort: "medium", temperature: 0.4 },
    prompt_key: "treatment_proposal_12m",
    consumers: ["treatment-proposal"],
    rationale_pt: "Reasoning intermediário equilibra criatividade do plano com fidelidade aos dados clínicos.",
    rationale_en: "Medium reasoning balances plan creativity with fidelity to clinical data.",
  },
  // Tarefas planejadas — ainda sem prompt semeado (UI mostra como "planejado").
  {
    id: "clinical_chat_factual",
    label_pt: "Chat clínico — perguntas factuais",
    label_en: "Clinical chat — factual questions",
    description_pt: "Q&A sobre um único estudo (dose, n, p-value) — prioriza fidelidade ao PDF de origem.",
    description_en: "Q&A about a single study (dose, n, p-value) — prioritizes fidelity to the source PDF.",
    category: "clinical_chat",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "google/gemini-3-pro-preview", "openai/gpt-5.4-mini"],
    routing: {
      temperature: 0.1,
      context_caching: true,
      notes: "Context caching reduz ~25% do custo em perguntas subsequentes sobre o mesmo PDF.",
    },
    prompt_key: "clinical_chat_factual",
    consumers: ["chat (planned)"],
    rationale_pt: "Gemini 2.5 Pro com caching é ótimo custo/benefício para citações textuais.",
    rationale_en: "Gemini 2.5 Pro with caching is best price/quality for textual citations.",
  },
  {
    id: "clinical_chat_critical",
    label_pt: "Chat clínico — segunda opinião crítica",
    label_en: "Clinical chat — critical second opinion",
    description_pt: "Avaliação metodológica adversarial (vieses, confounders, limites do estudo).",
    description_en: "Adversarial methodological evaluation (biases, confounders, study limits).",
    category: "clinical_chat",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "openai/gpt-5.5", "google/gemini-3-pro-preview"],
    routing: {
      reasoning_effort: "high",
      temperature: 0.3,
      notes: "reasoning=high para raciocínio adversarial; aceita maior latência em troca de profundidade.",
    },
    prompt_key: "clinical_chat_critical",
    consumers: ["chat (planned)"],
    rationale_pt: "GPT-5.4 reasoning=high é o estado-da-arte em raciocínio crítico contraditório.",
    rationale_en: "GPT-5.4 reasoning=high is state-of-the-art for adversarial critical reasoning.",
  },
];

export const AI_TASK_BY_ID: Record<string, AITaskDefinition> = Object.fromEntries(
  AI_TASKS.map((t) => [t.id, t]),
);

/**
 * Helper que será consumido pelas edge functions na Fase 2.
 * Retorna apenas a configuração estática (sem ler o prompt do banco).
 */
export function getModelForTask(taskId: string): AITaskDefinition | undefined {
  return AI_TASK_BY_ID[taskId];
}

/** Lista de modelos disponíveis no AI Gateway — usada para o radar e seleção manual. */
export const AI_GATEWAY_MODELS: AIModelId[] = [
  "google/gemini-3-pro-preview",
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5.2",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.4-pro",
  "openai/gpt-5.5",
  "openai/gpt-5.5-pro",
];