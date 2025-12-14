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
