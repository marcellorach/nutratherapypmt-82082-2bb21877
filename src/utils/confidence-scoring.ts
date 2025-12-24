/**
 * Sistema de Confidence Scoring
 * Calcula scores de confiança para entidades extraídas
 */

import { ConfidenceScore } from '@/types/vetgraphrag-enhanced';

interface EntityMentions {
  count: number;
  contexts: string[];
  citations?: string[];
}

interface KnowledgeGraphMatch {
  matched: boolean;
  matchScore: number; // 0-1
  existingNodeId?: string;
}

/**
 * Calcula confidence score completo para uma entidade
 */
export function calculateConfidenceScore(params: {
  llmConfidence: number; // 0-1
  mentions?: EntityMentions;
  kgMatch?: KnowledgeGraphMatch;
  crossValidation?: boolean;
}): ConfidenceScore {
  const { llmConfidence, mentions, kgMatch, crossValidation } = params;
  
  // Base score = confiança do LLM
  let overall = llmConfidence;
  
  // Bonus por match com KG existente (+20%)
  if (kgMatch?.matched) {
    overall += kgMatch.matchScore * 0.2;
  }
  
  // Bonus por múltiplas menções (+10%)
  if (mentions && mentions.count > 1) {
    const mentionBonus = Math.min(mentions.count / 10, 0.1);
    overall += mentionBonus;
  }
  
  // Bonus por citações (+15%)
  if (mentions?.citations && mentions.citations.length > 0) {
    const citationBonus = Math.min(mentions.citations.length / 10, 0.15);
    overall += citationBonus;
  }
  
  // Bonus por validação cruzada (+10%)
  if (crossValidation) {
    overall += 0.1;
  }
  
  // Normalizar para 0-1
  overall = Math.min(overall, 1.0);
  
  return {
    overall,
    llm_confidence: llmConfidence,
    kg_match_score: kgMatch?.matchScore,
    mention_frequency: mentions?.count,
    citation_count: mentions?.citations?.length,
    cross_validation: crossValidation
  };
}

/**
 * Calcula relevance score de um estudo
 */
export function calculateStudyRelevanceScore(params: {
  studyType: string;
  sampleSize?: number;
  publicationYear?: number;
  journalImpact?: number;
  statisticalSignificance: boolean;
  pValue?: string;
}): number {
  const { studyType, sampleSize, publicationYear, journalImpact, statisticalSignificance, pValue } = params;
  
  // Weight por tipo de estudo
  const studyTypeWeights: Record<string, number> = {
    'randomized_controlled_trial': 1.0,
    'meta_analysis': 1.0,
    'systematic_review': 0.9,
    'cohort_study': 0.7,
    'case_control': 0.6,
    'observational_study': 0.5,
    'case_report': 0.3,
    'in_vivo': 0.5,
    'in_vitro': 0.4,
    'review': 0.4
  };
  
  const studyTypeScore = studyTypeWeights[studyType] || 0.5;
  
  // Score por sample size
  let sampleSizeScore = 0.5;
  if (sampleSize) {
    if (sampleSize >= 100) sampleSizeScore = 1.0;
    else if (sampleSize >= 50) sampleSizeScore = 0.8;
    else if (sampleSize >= 20) sampleSizeScore = 0.6;
    else if (sampleSize >= 10) sampleSizeScore = 0.4;
    else sampleSizeScore = 0.2;
  }
  
  // Score por recência (últimos 10 anos)
  let recencyScore = 0.5;
  if (publicationYear) {
    const currentYear = new Date().getFullYear();
    const yearsAgo = currentYear - publicationYear;
    if (yearsAgo <= 3) recencyScore = 1.0;
    else if (yearsAgo <= 5) recencyScore = 0.9;
    else if (yearsAgo <= 10) recencyScore = 0.7;
    else if (yearsAgo <= 15) recencyScore = 0.5;
    else recencyScore = 0.3;
  }
  
  // Score por impacto do jornal (normalizado)
  let journalScore = 0.5;
  if (journalImpact) {
    journalScore = Math.min(journalImpact / 10, 1.0);
  }
  
  // Score por significância estatística
  let statisticalScore = 0.5;
  if (statisticalSignificance) {
    if (pValue) {
      const pValueNum = parseFloat(pValue);
      if (pValueNum <= 0.001) statisticalScore = 1.0;
      else if (pValueNum <= 0.01) statisticalScore = 0.9;
      else if (pValueNum <= 0.05) statisticalScore = 0.7;
      else statisticalScore = 0.5;
    } else {
      statisticalScore = 0.7;
    }
  }
  
  // Relevance Score ponderado
  const relevanceScore = (
    studyTypeScore * 0.3 +
    sampleSizeScore * 0.2 +
    recencyScore * 0.15 +
    journalScore * 0.15 +
    statisticalScore * 0.2
  );
  
  // Normalizar para 1-5
  return Math.round(relevanceScore * 5 * 10) / 10;
}

/**
 * Calcula quality score de um estudo baseado em metodologia
 */
export function calculateStudyQualityScore(params: {
  studyType: string;
  randomization: boolean;
  blinding?: string;
  placeboControlled: boolean;
  sampleSize?: number;
  statisticalSignificance: boolean;
  conflictsDeclared: boolean;
}): number {
  const { studyType, randomization, blinding, placeboControlled, sampleSize, statisticalSignificance, conflictsDeclared } = params;
  
  let score = 0;
  
  // Base por tipo de estudo
  if (studyType === 'randomized_controlled_trial' || studyType === 'meta_analysis') {
    score += 2;
  } else if (studyType === 'systematic_review' || studyType === 'cohort_study') {
    score += 1.5;
  } else if (studyType === 'case_control') {
    score += 1;
  } else {
    score += 0.5;
  }
  
  // Randomização (+0.5)
  if (randomization) score += 0.5;
  
  // Blinding (+0.5 a +1.0)
  if (blinding === 'triple') score += 1.0;
  else if (blinding === 'double') score += 0.7;
  else if (blinding === 'single') score += 0.4;
  
  // Placebo-controlled (+0.5)
  if (placeboControlled) score += 0.5;
  
  // Sample size adequado (+0.5)
  if (sampleSize && sampleSize >= 30) score += 0.5;
  
  // Significância estatística (+0.5)
  if (statisticalSignificance) score += 0.5;
  
  // Transparência (conflitos declarados) (+0.3)
  if (conflictsDeclared) score += 0.3;
  
  // Normalizar para 1-5
  return Math.min(Math.round(score * 10) / 10, 5.0);
}

/**
 * Determina evidence level baseado em características do estudo
 */
export function determineEvidenceLevel(params: {
  studyType: string;
  randomization: boolean;
  sampleSize?: number;
}): string {
  const { studyType, randomization, sampleSize } = params;
  
  if (studyType === 'meta_analysis') return 'level_1a';
  if (studyType === 'randomized_controlled_trial' && randomization) return 'level_1b';
  if (studyType === 'cohort_study') return 'level_2a';
  if (studyType === 'case_control') return 'level_2b';
  if (studyType === 'case_report' || studyType === 'observational_study') return 'level_3';
  if (studyType === 'in_vivo') return 'level_5';
  if (studyType === 'in_vitro') return 'level_5';
  return 'level_4';
}

/**
 * Valida e ajusta confidence score baseado em regras
 */
export function validateConfidenceScore(score: ConfidenceScore): ConfidenceScore {
  // Regra: se não tem match com KG e poucas menções, reduzir confiança
  if (!score.kg_match_score && (score.mention_frequency || 0) < 2) {
    score.overall = Math.max(score.overall * 0.8, 0.3);
  }
  
  // Regra: se tem alta confiança LLM mas zero citações, reduzir
  if (score.llm_confidence > 0.8 && (score.citation_count || 0) === 0) {
    score.overall = Math.min(score.overall, 0.7);
  }
  
  // Regra: cross-validation + KG match = alta confiança garantida
  if (score.cross_validation && score.kg_match_score && score.kg_match_score > 0.7) {
    score.overall = Math.max(score.overall, 0.8);
  }
  
  return score;
}
