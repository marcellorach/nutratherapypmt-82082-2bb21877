/**
 * Confidence Scoring System for VetGraphRAG Recommendations
 * 
 * This module provides types for measuring and expressing confidence levels
 * in recommendations based on Knowledge Graph coverage and evidence quality.
 */

export interface KGCoverageMetrics {
  /** Overall coverage score (0-1) */
  score: number;
  /** Number of relevant triplets found */
  tripletCount: number;
  /** Number of supporting studies */
  studyCount: number;
  /** Species match quality */
  speciesMatch: 'exact' | 'close' | 'distant' | 'none';
  /** Whether breed-specific data exists */
  breedSpecific: boolean;
  /** Number of direct nutraceutical-condition relationships */
  directRelationships: number;
  /** Number of multi-hop paths found */
  multiHopPaths: number;
}

export interface EvidenceQualityMetrics {
  /** Overall evidence quality score (0-1) */
  score: number;
  /** Highest evidence level found (e.g., 'level_1a', 'level_2', 'level_5') */
  highestEvidenceLevel: string;
  /** Types of studies found */
  studyTypesFound: string[];
  /** Average study quality score */
  averageStudyQuality: number;
  /** Number of replicated findings */
  replicationCount: number;
  /** Whether randomized controlled trials exist */
  hasRCT: boolean;
  /** Whether meta-analyses exist */
  hasMetaAnalysis: boolean;
}

export interface DataFreshnessMetrics {
  /** Overall freshness score (0-1) */
  score: number;
  /** Year of most recent study */
  mostRecentStudyYear: number;
  /** Median year of all studies */
  medianStudyYear: number;
  /** Number of studies from last 5 years */
  recentStudiesCount: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export interface RecommendationConfidence {
  /** Overall confidence score (0-1) */
  overall: number;
  
  /** Knowledge Graph coverage metrics */
  kgCoverage: KGCoverageMetrics;
  
  /** Evidence quality metrics */
  evidenceQuality: EvidenceQualityMetrics;
  
  /** Data freshness metrics */
  dataFreshness: DataFreshnessMetrics;
  
  /** Computed confidence level */
  confidenceLevel: ConfidenceLevel;
  
  /** Whether LLM fallback is required */
  requiresLlmFallback: boolean;
  
  /** Whether human/veterinarian review is recommended */
  humanReviewRecommended: boolean;
  
  /** Human-readable explanation of confidence */
  rationale: string;
  
  /** List of warnings or caveats */
  warnings: string[];
}

export interface ConfidenceThresholds {
  high: number;      // >= 0.7
  medium: number;    // >= 0.5
  low: number;       // >= 0.3
  insufficient: number; // < 0.3
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  high: 0.7,
  medium: 0.5,
  low: 0.3,
  insufficient: 0
};

export interface ConfidenceCalculationParams {
  petProfile: {
    species?: string;
    breed?: string;
    age?: number;
    weight?: number;
  };
  targetCondition: string;
  conditionId?: string;
  /**
   * Optional pet UUID. When provided, the hybrid-recommendation service will
   * load the longitudinal clinical context (consultations + nutrition) and
   * forward it to the edge function as CURRENT_STATE / CLINICAL_TRAJECTORY /
   * DIET_PROFILE blocks (weights 1.0 / 0.4 / context).
   */
  petId?: string;
}

export interface ConfidenceCalculationResult {
  confidence: RecommendationConfidence;
  triplets: Array<{
    id: string;
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    evidenceLevel: string;
    studyId?: string;
  }>;
  studies: Array<{
    id: string;
    title: string;
    year: number;
    evidenceLevel: string;
    quality: number;
  }>;
}

export type RecommendationSource = 'knowledge_graph' | 'hybrid' | 'llm_fallback';

export type DisclaimerType = 'none' | 'low_confidence' | 'no_kg_data';

/**
 * Provenance per-composto (Eixo B — granularidade fina, ortogonal ao Eixo A
 * de qualidade científica em `src/rules/general/evidence-levels.ts`).
 *
 * Valores MANTIDOS em PascalCase/kebab por compatibilidade com UI existente.
 * Bloco 2(e) do plano vai (1) normalizar para snake_case e (2) separar
 * value↔label. Não migrar agora — evita dois churns no mesmo campo.
 */
export type CompoundProvenance = 'KG-backed' | 'AI-enriched' | 'AI-generated';

/**
 * Envelope de abstenção retornado por funções IA quando NÃO há sinal de
 * entrada suficiente para formar uma hipótese marcada.
 *
 * IMPORTANTE — fronteira do Bloco 3:
 *   abstain ≠ "KG vazio". KG vazio gera resposta marcada (`source:'llm_fallback'`
 *   + `disclaimer:'no_kg_data'`), nunca abstain.
 *   abstain = "não dá para dizer nada com responsabilidade, nem marcado"
 *   (ex.: sem condição informada, sem dados do pet, texto sem sinal clínico).
 */
export interface AbstainEnvelope {
  abstain: true;
  abstain_reason: 'clinical_signal_insufficient';
  abstain_detail?: string;
  source: RecommendationSource;
  disclaimer: DisclaimerType;
}

export interface HybridRecommendationResult {
  source: RecommendationSource;
  confidence: RecommendationConfidence;
  recommendation: {
    nutraceuticals: Array<{
      name: string;
      dosage: string;
      mechanism: string;
      evidenceLevel: string;
    }>;
    rationale: string;
    precautions: string[];
  };
  disclaimer: DisclaimerType;
  llmEnrichment?: string;
}
