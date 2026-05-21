/**
 * Registro central de tarefas de IA — Fase 2.5 (cobertura completa).
 *
 * Mapeia CADA família de tarefa a:
 *  - modelo recomendado e candidatos
 *  - parâmetros de routing (reasoning, temperature, context_caching)
 *  - prompt_key em ai_prompt_versions
 *  - consumidores reais (edge functions)
 *  - status de integração com o router compartilhado:
 *      'connected' — função já chama callAITask(...) via _shared/ai-task-router.ts
 *      'legacy'    — função ainda usa fetch direto; troca de modelo no painel NÃO afeta
 *      'planned'   — task definida mas nenhuma função consome ainda
 */

export type AIModelId =
  | "google/gemini-3-pro-preview"
  | "google/gemini-3-flash-preview"
  | "google/gemini-3.1-pro-preview"
  | "google/gemini-3.5-flash"
  | "google/gemini-2.5-pro"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite"
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
  context_caching?: boolean;
  notes?: string;
}

export type AITaskCategory =
  | "extraction"
  | "curation"
  | "meta_analysis"
  | "clinical_chat"
  | "clinical_inference"
  | "auditing"
  | "translation"
  | "enrichment";

export type AITaskStatus = "connected" | "legacy" | "planned";

export interface AITaskDefinition {
  id: string;
  label_pt: string;
  label_en: string;
  description_pt: string;
  description_en: string;
  category: AITaskCategory;
  recommended_model: AIModelId;
  candidate_models: AIModelId[];
  routing: AITaskRouting;
  prompt_key: string;
  consumers: string[];
  rationale_pt: string;
  rationale_en: string;
  /** Indica se o consumidor está plugado no router compartilhado (fase 2.5). */
  status: AITaskStatus;
}

export const AI_TASKS: AITaskDefinition[] = [
  // ============== EXTRAÇÃO ==============
  {
    id: "extraction_stage1",
    label_pt: "Extração — Estágio 1 (entidades)",
    label_en: "Extraction — Stage 1 (entities)",
    description_pt: "Identifica entidades biomédicas (compostos, condições, biomarcadores) em PDFs longos.",
    description_en: "Identifies biomedical entities (compounds, conditions, biomarkers) in long PDFs.",
    category: "extraction",
    recommended_model: "google/gemini-3-pro-preview",
    candidate_models: ["google/gemini-3-pro-preview", "google/gemini-2.5-pro", "openai/gpt-5.4"],
    routing: { temperature: 0.1, context_caching: true, notes: "Janela grande + extração estruturada; Gemini 3 Pro lida nativamente com PDF multimodal." },
    prompt_key: "extraction_stage1",
    consumers: ["extract-study-entities", "gemini-file-search"],
    rationale_pt: "Gemini 3 Pro suporta PDF nativo + janela ampla e mantém alta fidelidade textual em extração estruturada.",
    rationale_en: "Gemini 3 Pro handles PDF natively with a large context window and high textual fidelity for structured extraction.",
    status: "legacy",
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
    status: "legacy",
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
    status: "legacy",
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
    consumers: ["generate-triplets"],
    rationale_pt: "Gemini 2.5 Pro mantém compatibilidade com o schema atual em produção.",
    rationale_en: "Gemini 2.5 Pro keeps compatibility with the current production schema.",
    status: "legacy",
  },
  {
    id: "triplet_enrichment",
    label_pt: "Triplets — enriquecimento retroativo",
    label_en: "Triplets — retroactive enrichment",
    description_pt: "Completa qualificadores (dose, espécie, mecanismo) em triplets já extraídos.",
    description_en: "Completes qualifiers (dose, species, mechanism) on already-extracted triplets.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.2 },
    prompt_key: "triplet_enrichment",
    consumers: ["enrich-triplet", "backfill-triplet-enrichment"],
    rationale_pt: "Gemini 2.5 Pro é custo-eficiente para enriquecer triplets em lote.",
    rationale_en: "Gemini 2.5 Pro is cost-efficient for batch triplet enrichment.",
    status: "connected",
  },

  // ============== META-ANÁLISE & AUDITORIA ==============
  {
    id: "meta_study_analysis",
    label_pt: "Meta-análise — Regras-Core vs. estudos arquiteturais",
    label_en: "Meta-analysis — Core Rules vs. architectural studies",
    description_pt: "Compara N estudos contra Regras-Core ativas; detecta confirmações, extensões e contradições.",
    description_en: "Compares N studies against active Core Rules; detects confirmations, extensions and contradictions.",
    category: "meta_analysis",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "openai/gpt-5.5", "google/gemini-3-pro-preview", "google/gemini-2.5-pro"],
    routing: { reasoning_effort: "high", temperature: 0.2, notes: "reasoning=high captura contradições sutis com qualificadores (ex.: idade, dose, espécie)." },
    prompt_key: "meta_study_analysis",
    consumers: ["extract-meta-study"],
    rationale_pt: "GPT-5.4 com reasoning=high é o melhor para raciocínio simbólico e detecção de contradições contextuais.",
    rationale_en: "GPT-5.4 with reasoning=high is best at symbolic reasoning and contextual contradiction detection.",
    status: "connected",
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
    consumers: ["relations-auditor"],
    rationale_pt: "Reasoning intermediário equilibra latência e detecção de inconsistências entre arestas.",
    rationale_en: "Medium reasoning balances latency with edge-inconsistency detection.",
    status: "connected",
  },
  {
    id: "study_tagging",
    label_pt: "Auto-tag de estudos",
    label_en: "Auto-tag studies",
    description_pt: "Classifica estudos por temas (longevidade, metabolismo, cardio etc.) a partir do abstract.",
    description_en: "Classifies studies by topic (longevity, metabolism, cardio, etc.) from the abstract.",
    category: "auditing",
    recommended_model: "google/gemini-2.5-flash",
    candidate_models: ["google/gemini-2.5-flash", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.2 },
    prompt_key: "study_tagging",
    consumers: ["auto-tag-studies"],
    rationale_pt: "Flash é rápido e barato para classificação multilabel sobre texto curto.",
    rationale_en: "Flash is fast and cheap for multilabel classification on short text.",
    status: "connected",
  },

  // ============== INFERÊNCIA CLÍNICA ==============
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
    consumers: ["hybrid-recommendation"],
    rationale_pt: "Reasoning explícito reduz alucinação ao ranquear compostos contra contraindicações.",
    rationale_en: "Explicit reasoning lowers hallucination when ranking compounds against contraindications.",
    status: "connected",
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
    consumers: ["hybrid-recommendation"],
    rationale_pt: "GPT-5.4 lida melhor com regras numéricas (limites de referência) sem inventar valores.",
    rationale_en: "GPT-5.4 handles numeric rules (reference ranges) better without fabricating values.",
    status: "planned",
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
    consumers: ["hybrid-recommendation"],
    rationale_pt: "Reasoning intermediário equilibra criatividade do plano com fidelidade aos dados clínicos.",
    rationale_en: "Medium reasoning balances plan creativity with fidelity to clinical data.",
    status: "planned",
  },
  {
    id: "trajectory_projection",
    label_pt: "Projeção de trajetória do pet",
    label_en: "Pet trajectory projection",
    description_pt: "Projeta evolução biológica (gain em anos) sob diferentes cenários terapêuticos.",
    description_en: "Projects biological evolution (years gained) under different therapeutic scenarios.",
    category: "clinical_inference",
    recommended_model: "openai/gpt-5.4",
    candidate_models: ["openai/gpt-5.4", "google/gemini-2.5-pro"],
    routing: { reasoning_effort: "medium", temperature: 0.3 },
    prompt_key: "trajectory_projection",
    consumers: ["project-pet-trajectory"],
    rationale_pt: "Reasoning estruturado garante consistência entre cenários projetados.",
    rationale_en: "Structured reasoning keeps projected scenarios consistent.",
    status: "legacy",
  },
  {
    id: "clinical_data_extraction",
    label_pt: "Extração de dados clínicos (texto livre)",
    label_en: "Clinical data extraction (free text)",
    description_pt: "Converte anamnese/observações em campos estruturados (condições, medicações, sintomas).",
    description_en: "Converts free-text consult notes into structured fields (conditions, meds, symptoms).",
    category: "extraction",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1 },
    prompt_key: "clinical_data_extraction",
    consumers: ["extract-pet-clinical-data"],
    rationale_pt: "Gemini 2.5 Pro tem boa fidelidade em extração estruturada de texto clínico.",
    rationale_en: "Gemini 2.5 Pro has good fidelity for structured extraction of clinical text.",
    status: "legacy",
  },
  {
    id: "lab_pdf_parsing",
    label_pt: "Parsing de PDF de exames",
    label_en: "Lab PDF parsing",
    description_pt: "Extrai valores laboratoriais de PDFs de exames veterinários.",
    description_en: "Extracts lab values from veterinary exam PDFs.",
    category: "extraction",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "google/gemini-3-pro-preview"],
    routing: { temperature: 0.0, context_caching: true },
    prompt_key: "lab_pdf_parsing",
    consumers: ["parse-pet-exam-pdf"],
    rationale_pt: "Gemini lê PDF nativamente; temperature=0 maximiza fidelidade numérica.",
    rationale_en: "Gemini reads PDF natively; temperature=0 maximizes numerical fidelity.",
    status: "legacy",
  },
  {
    id: "kg_gap_fill",
    label_pt: "Preenchimento de lacunas do KG (PubMed)",
    label_en: "KG evidence gap-fill (PubMed)",
    description_pt: "Estrutura achados do PubMed para preencher pares (composto × condição) ausentes no KG.",
    description_en: "Structures PubMed findings to fill missing (compound × condition) pairs in the KG.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4"],
    routing: { temperature: 0.2 },
    prompt_key: "kg_gap_fill",
    consumers: ["kg-evidence-gap-fill"],
    rationale_pt: "Gemini Pro é eficiente para estruturação de literatura científica em massa.",
    rationale_en: "Gemini Pro is efficient for bulk structuring of scientific literature.",
    status: "connected",
  },

  // ============== CHAT CLÍNICO ==============
  {
    id: "clinical_chat_factual",
    label_pt: "Chat clínico — perguntas factuais",
    label_en: "Clinical chat — factual questions",
    description_pt: "Q&A sobre um estudo (dose, n, p-value) — prioriza fidelidade ao PDF de origem.",
    description_en: "Q&A about a study (dose, n, p-value) — prioritizes fidelity to the source PDF.",
    category: "clinical_chat",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "google/gemini-3-pro-preview", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1, context_caching: true, notes: "Context caching reduz ~25% do custo em perguntas subsequentes sobre o mesmo PDF." },
    prompt_key: "clinical_chat_factual",
    consumers: ["chat", "document-chat"],
    rationale_pt: "Gemini 2.5 Pro com caching é ótimo custo/benefício para citações textuais.",
    rationale_en: "Gemini 2.5 Pro with caching is best price/quality for textual citations.",
    status: "connected",
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
    routing: { reasoning_effort: "high", temperature: 0.3, notes: "reasoning=high para raciocínio adversarial; aceita maior latência em troca de profundidade." },
    prompt_key: "clinical_chat_critical",
    consumers: ["chat (planned)"],
    rationale_pt: "GPT-5.4 reasoning=high é o estado-da-arte em raciocínio crítico contraditório.",
    rationale_en: "GPT-5.4 reasoning=high is state-of-the-art for adversarial critical reasoning.",
    status: "planned",
  },

  // ============== TRADUÇÃO ==============
  {
    id: "translation_generic",
    label_pt: "Tradução — texto geral",
    label_en: "Translation — general text",
    description_pt: "Tradução PT↔EN de strings curtas e parágrafos sem terminologia clínica específica.",
    description_en: "PT↔EN translation of short strings and paragraphs without specific clinical terminology.",
    category: "translation",
    recommended_model: "google/gemini-2.5-flash",
    candidate_models: ["google/gemini-2.5-flash", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1 },
    prompt_key: "translation_generic",
    consumers: ["translate-text", "translate-conditions"],
    rationale_pt: "Flash é barato e adequado para tradução de strings de UI.",
    rationale_en: "Flash is cheap and adequate for UI string translation.",
    status: "connected",
  },
  {
    id: "translation_conditions",
    label_pt: "Tradução — condições clínicas",
    label_en: "Translation — clinical conditions",
    description_pt: "Traduz e categoriza condições clínicas mantendo terminologia SNOMED/UMLS.",
    description_en: "Translates and categorizes clinical conditions preserving SNOMED/UMLS terminology.",
    category: "translation",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1 },
    prompt_key: "translation_conditions",
    consumers: ["translate-conditions", "translate-and-categorize-conditions"],
    rationale_pt: "Gemini Pro mantém precisão terminológica em vocabulário controlado.",
    rationale_en: "Gemini Pro preserves terminological precision over controlled vocabulary.",
    status: "connected",
  },

  // ============== ENRIQUECIMENTO & TAXONOMIA ==============
  {
    id: "taxonomy_suggestion",
    label_pt: "Sugestão de termos taxonômicos",
    label_en: "Taxonomy term suggestion",
    description_pt: "Sugere termos canônicos (SNOMED-CT VetSCT, UMLS) para entidades extraídas.",
    description_en: "Suggests canonical terms (SNOMED-CT VetSCT, UMLS) for extracted entities.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1 },
    prompt_key: "taxonomy_suggestion",
    consumers: ["suggest-taxonomy-terms"],
    rationale_pt: "Pro garante consistência em vocabulário biomédico controlado.",
    rationale_en: "Pro ensures consistency on controlled biomedical vocabulary.",
    status: "legacy",
  },
  {
    id: "dosage_web_lookup",
    label_pt: "Busca de dosagens em fontes web",
    label_en: "Web dosage lookup",
    description_pt: "Recupera dosagens de compostos a partir de fontes confiáveis na web.",
    description_en: "Retrieves compound dosages from trusted web sources.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.1 },
    prompt_key: "dosage_web_lookup",
    consumers: ["web-dosage-lookup"],
    rationale_pt: "Pro balanceia recall e precisão em sumarização de evidências web.",
    rationale_en: "Pro balances recall and precision on web evidence summarization.",
    status: "legacy",
  },
  {
    id: "food_enrichment",
    label_pt: "Enriquecimento de produtos de ração",
    label_en: "Pet food product enrichment",
    description_pt: "Completa dados nutricionais de produtos de ração via web search.",
    description_en: "Completes nutritional data on pet food products via web search.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro", "openai/gpt-5.4-mini"],
    routing: { temperature: 0.2 },
    prompt_key: "food_enrichment",
    consumers: ["enrich-pet-food-product", "bulk-enrich-pet-food"],
    rationale_pt: "Pro é estável em extração de fichas nutricionais com formato variado.",
    rationale_en: "Pro is stable on extracting nutritional sheets with varied formats.",
    status: "legacy",
  },
  {
    id: "spreadsheet_enrichment",
    label_pt: "Enriquecimento de planilhas de nutracêuticos",
    label_en: "Nutraceutical spreadsheet enrichment",
    description_pt: "Processa planilhas de nutracêuticos importadas, completando campos faltantes.",
    description_en: "Processes imported nutraceutical spreadsheets, completing missing fields.",
    category: "enrichment",
    recommended_model: "google/gemini-2.5-pro",
    candidate_models: ["google/gemini-2.5-pro"],
    routing: { temperature: 0.2 },
    prompt_key: "spreadsheet_enrichment",
    consumers: ["process-nutraceutical-spreadsheet"],
    rationale_pt: "Pro processa lotes grandes mantendo coerência entre linhas.",
    rationale_en: "Pro processes large batches keeping cross-row coherence.",
    status: "legacy",
  },
];

export const AI_TASK_BY_ID: Record<string, AITaskDefinition> = Object.fromEntries(
  AI_TASKS.map((t) => [t.id, t]),
);

export function getModelForTask(taskId: string): AITaskDefinition | undefined {
  return AI_TASK_BY_ID[taskId];
}

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
