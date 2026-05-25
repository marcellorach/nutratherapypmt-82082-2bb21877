/**
 * Population Insights v0 — esqueleto.
 *
 * Conteúdo é seed manual, claramente rotulado como "aguardando PetLove".
 * Quando o ETL real chegar (card #7 do board), substituiremos esta source
 * por consulta em tabelas reais de cohort histórico.
 */

export type InsightStage = 'discovery' | 'hypothesis' | 'proposed_meta_study' | 'approved';

export type InsightOrigin = 'synthetic_cohort' | 'kg_gap' | 'conflict_detection' | 'literature_news';

export interface PopulationInsight {
  id: string;
  title_pt: string;
  title_en: string;
  summary_pt: string;
  summary_en: string;
  stage: InsightStage;
  origin: InsightOrigin;
  /** Recorte de população afetado (string livre — vira filtro no v1). */
  cohort_hint?: string;
  /** prevalence_delta + kg_gap + actionability — soma normalizada 0–100. */
  discovery_score: number;
  /** Componentes do score, para transparência. */
  score_breakdown: {
    prevalence_delta: number;
    kg_gap: number;
    actionability: number;
  };
  awaiting_real_cohort: boolean;
  created_at: string;
}

export const POPULATION_INSIGHTS_SEED: PopulationInsight[] = [
  {
    id: 'pop-1',
    title_pt: 'Goldens 8+ com ALT elevada vs uso de SAMe',
    title_en: 'Goldens 8+ with elevated ALT vs SAMe usage',
    summary_pt: 'Em cohort sintético, Goldens >8a com ALT >120 U/L sem suporte hepático mostram progressão 2.1× mais rápida vs grupo com SAMe. Validar em histórico real.',
    summary_en: 'In synthetic cohort, Goldens >8y with ALT >120 U/L without hepatic support progress 2.1× faster vs SAMe group. Needs real-history validation.',
    stage: 'hypothesis',
    origin: 'synthetic_cohort',
    cohort_hint: 'Golden Retriever; idade ≥8; ALT ≥120 U/L',
    discovery_score: 78,
    score_breakdown: { prevalence_delta: 0.72, kg_gap: 0.65, actionability: 0.95 },
    awaiting_real_cohort: true,
    created_at: '2026-05-20',
  },
  {
    id: 'pop-2',
    title_pt: 'Lacuna: ômega-3 × disfunção cognitiva canina',
    title_en: 'Gap: omega-3 × canine cognitive dysfunction',
    summary_pt: 'Apenas 2 triplets de alta confiança ligando ômega-3 a DCC em cães. Literatura humana abundante. Candidato a meta-estudo dedicado.',
    summary_en: 'Only 2 high-confidence triplets linking omega-3 to CCD in dogs. Abundant human literature. Candidate for a dedicated meta-study.',
    stage: 'discovery',
    origin: 'kg_gap',
    cohort_hint: 'Cães ≥10a com sinais cognitivos',
    discovery_score: 71,
    score_breakdown: { prevalence_delta: 0.5, kg_gap: 0.92, actionability: 0.7 },
    awaiting_real_cohort: true,
    created_at: '2026-05-21',
  },
  {
    id: 'pop-3',
    title_pt: 'Conflito: dose de curcumina em DRC estágio 2',
    title_en: 'Conflict: curcumin dose in CKD stage 2',
    summary_pt: 'Três fontes recomendam doses divergentes (50, 80, 200 mg/kg/d). Necessita resolução canônica antes de entrar em protocolo.',
    summary_en: 'Three sources suggest divergent doses (50, 80, 200 mg/kg/d). Needs canonical resolution before becoming protocol.',
    stage: 'discovery',
    origin: 'conflict_detection',
    cohort_hint: 'Cães DRC IRIS 2',
    discovery_score: 65,
    score_breakdown: { prevalence_delta: 0.4, kg_gap: 0.6, actionability: 0.95 },
    awaiting_real_cohort: false,
    created_at: '2026-05-22',
  },
  {
    id: 'pop-4',
    title_pt: 'Meta-estudo proposto: rapamicina em raças braquicéfalas',
    title_en: 'Proposed meta-study: rapamycin in brachycephalic breeds',
    summary_pt: 'Sinais convergentes em 4 estudos sobre extensão de healthspan. Proposta de meta-estudo formal aguardando aprovação P&D.',
    summary_en: 'Convergent signals across 4 studies on healthspan extension. Formal meta-study proposal awaiting R&D approval.',
    stage: 'proposed_meta_study',
    origin: 'literature_news',
    cohort_hint: 'Bulldog; Pug; idade 5–10',
    discovery_score: 83,
    score_breakdown: { prevalence_delta: 0.78, kg_gap: 0.82, actionability: 0.88 },
    awaiting_real_cohort: true,
    created_at: '2026-05-23',
  },
];