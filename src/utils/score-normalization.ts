/**
 * Utilities for normalizing confidence/efficacy scores across the application.
 * 
 * The Gemini LLM returns scores in 0-5 scale, but our visualization components
 * expect 0-1 scale. This module provides centralized normalization.
 */

/**
 * Normalizes any score to 0-1 scale.
 * If value > 1, assumes it's in 0-5 scale and converts.
 */
export const normalizeScore = (value: number | undefined | null, defaultValue = 0.5): number => {
  if (value === undefined || value === null) return defaultValue;
  // If greater than 1, assume 0-5 scale and normalize
  if (value > 1) return Math.min(1, value / 5);
  return Math.min(1, Math.max(0, value));
};

/**
 * Converts normalized score (0-1) to display scale (0-5)
 */
export const toDisplayScale = (normalized: number): number => {
  return +(normalized * 5).toFixed(1);
};

/**
 * Returns a display string like "4.2/5"
 */
export const formatScoreDisplay = (value: number | undefined | null, defaultValue = 0.5): string => {
  const normalized = normalizeScore(value, defaultValue);
  return `${toDisplayScale(normalized)}/5`;
};

/**
 * Returns percentage (0-100) from any score
 */
export const toPercentage = (value: number | undefined | null, defaultValue = 0.5): number => {
  return normalizeScore(value, defaultValue) * 100;
};

/**
 * Evidence level weights for combined scoring
 */
const EVIDENCE_WEIGHTS: Record<string, number> = {
  'rct': 1.0,
  'randomized_controlled_trial': 1.0,
  'meta_analysis': 1.0,
  'systematic_review': 0.95,
  'cohort': 0.8,
  'cohort_study': 0.8,
  'case_control': 0.6,
  'case_study': 0.4,
  'in_vitro': 0.3,
  'in_vivo': 0.5,
  'animal_study': 0.4,
  'expert_opinion': 0.2,
  'observational': 0.5
};

/**
 * Calculates edge width (1-5px) based on multiple factors
 */
export const calculateEdgeWidth = (
  confidence?: number | null,
  evidenceLevel?: string,
  intensity?: number | null
): number => {
  const normalizedConfidence = normalizeScore(confidence);
  const evidenceWeight = EVIDENCE_WEIGHTS[evidenceLevel?.toLowerCase() || ''] || 0.5;
  const normalizedIntensity = normalizeScore(intensity);
  
  // Combined weight: confidence (50%) + evidence (30%) + intensity (20%)
  const combinedWeight = 
    normalizedConfidence * 0.5 + 
    evidenceWeight * 0.3 + 
    normalizedIntensity * 0.2;
  
  // Map to 1-5px
  return Math.max(1, Math.round(combinedWeight * 5));
};

/**
 * Gets the color class for a percentage value
 */
export const getScoreColorClass = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Gets a descriptive label for a normalized score
 */
export const getScoreLabel = (normalized: number): string => {
  if (normalized >= 0.8) return 'Excellent';
  if (normalized >= 0.6) return 'Good';
  if (normalized >= 0.4) return 'Moderate';
  if (normalized >= 0.2) return 'Low';
  return 'Very Low';
};

/**
 * Species match weights for recommendation scoring
 */
const SPECIES_WEIGHTS: Record<string, number> = {
  'canine': 1.0,
  'feline': 0.7,
  'equine': 0.6,
  'mammal': 0.5,
  'rodent': 0.4,
  'in_vitro': 0.3,
  'unknown': 0.5
};

/**
 * Calculates a recommendation score for veterinary treatment suggestions
 * Based on multiple weighted factors
 */
export interface RecommendationScoreParams {
  confidence: number;
  evidenceLevel?: string;
  speciesContext?: string[];
  hasDoseRange?: boolean;
  replicationCount?: number;
}

export interface RecommendationScoreResult {
  score: number;
  breakdown: {
    confidence: number;
    evidence: number;
    species: number;
    dose: number;
    replication: number;
  };
  qualityLevel: 'high' | 'medium' | 'low' | 'insufficient';
}

export const calculateRecommendationScore = (
  params: RecommendationScoreParams
): RecommendationScoreResult => {
  const { confidence, evidenceLevel, speciesContext, hasDoseRange, replicationCount } = params;
  
  const normalizedConfidence = normalizeScore(confidence);
  const evidenceWeight = EVIDENCE_WEIGHTS[evidenceLevel?.toLowerCase() || ''] || 0.5;
  
  // Species match - prioritize canine for veterinary context
  let speciesMatch = 0.5;
  if (speciesContext && speciesContext.length > 0) {
    const maxWeight = Math.max(
      ...speciesContext.map(s => SPECIES_WEIGHTS[s.toLowerCase()] || 0.3)
    );
    speciesMatch = maxWeight;
  }
  
  // Dose availability bonus
  const doseBonus = hasDoseRange ? 1.0 : 0.5;
  
  // Replication factor - more replications = more confidence
  const replicationFactor = Math.min(1.0, 0.5 + (replicationCount || 0) * 0.25);
  
  // Weighted calculation
  const breakdown = {
    confidence: normalizedConfidence * 0.30,
    evidence: evidenceWeight * 0.25,
    species: speciesMatch * 0.20,
    dose: doseBonus * 0.10,
    replication: replicationFactor * 0.15
  };
  
  const score = Math.min(1, Object.values(breakdown).reduce((a, b) => a + b, 0));
  
  // Determine quality level
  let qualityLevel: 'high' | 'medium' | 'low' | 'insufficient';
  if (score >= 0.7) qualityLevel = 'high';
  else if (score >= 0.5) qualityLevel = 'medium';
  else if (score >= 0.3) qualityLevel = 'low';
  else qualityLevel = 'insufficient';
  
  return { score, breakdown, qualityLevel };
};

/**
 * Validates triplet quality for completeness metrics
 */
export interface TripletQualityMetrics {
  hasSpeciesContext: boolean;
  hasEvidenceLevel: boolean;
  hasDoseRange: boolean;
  hasCorrectLayers: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export const assessTripletQuality = (triplet: {
  species_context?: string[] | null;
  evidence_level?: string | null;
  dose_range?: Record<string, unknown> | null;
  subject_layer?: string | null;
  object_layer?: string | null;
  extraction_confidence?: number | null;
}): TripletQualityMetrics => {
  const hasSpeciesContext = !!(triplet.species_context && triplet.species_context.length > 0);
  const hasEvidenceLevel = !!(triplet.evidence_level && triplet.evidence_level !== 'unknown');
  const hasDoseRange = !!(triplet.dose_range && Object.keys(triplet.dose_range).length > 0);
  const hasCorrectLayers = !!(triplet.subject_layer && triplet.object_layer);
  
  const confidence = triplet.extraction_confidence || 0;
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (confidence >= 0.7) confidenceLevel = 'high';
  else if (confidence >= 0.4) confidenceLevel = 'medium';
  else confidenceLevel = 'low';
  
  return {
    hasSpeciesContext,
    hasEvidenceLevel,
    hasDoseRange,
    hasCorrectLayers,
    confidenceLevel
  };
};
