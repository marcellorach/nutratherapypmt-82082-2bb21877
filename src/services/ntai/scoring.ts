
interface StudyAssessment {
  methodology_type?: string;
  sample_size?: number;
  randomization?: boolean;
  blinding?: string;
  placebo_controlled?: boolean;
  statistical_significance?: boolean;
  follow_up_duration?: string;
  species_tested?: string[];
  quality_score?: number;
  relevance_score?: number;
  novelty_score?: number;
}

/**
 * Calculate quality score from study assessment metadata.
 * Returns LLM-provided score if available, otherwise computes from methodology fields.
 */
export const scoreStudyQuality = (assessment: StudyAssessment): number => {
  // If LLM already provided a score, use it
  if (assessment.quality_score && assessment.quality_score > 0) {
    return assessment.quality_score;
  }

  let score = 1.0; // Base score

  // Methodology type scoring
  const methodType = (assessment.methodology_type || '').toLowerCase();
  if (methodType.includes('rct') || methodType.includes('randomized controlled')) score += 1.5;
  else if (methodType.includes('cohort') || methodType.includes('prospective')) score += 1.0;
  else if (methodType.includes('case-control') || methodType.includes('cross-sectional')) score += 0.5;
  else if (methodType.includes('meta-analysis') || methodType.includes('systematic review')) score += 1.5;

  // Sample size
  const n = assessment.sample_size || 0;
  if (n >= 100) score += 1.0;
  else if (n >= 30) score += 0.5;
  else if (n >= 10) score += 0.25;

  // Randomization
  if (assessment.randomization) score += 0.5;

  // Blinding
  const blinding = (assessment.blinding || '').toLowerCase();
  if (blinding.includes('double')) score += 0.5;
  else if (blinding.includes('single')) score += 0.25;

  // Statistical significance
  if (assessment.statistical_significance) score += 0.5;

  // Placebo controlled
  if (assessment.placebo_controlled) score += 0.5;

  return Math.min(5.0, Math.round(score * 10) / 10);
};

/**
 * Calculate relevance score from study assessment metadata.
 * Returns LLM-provided score if available, otherwise computes from species/duration.
 */
export const scoreStudyRelevance = (assessment: StudyAssessment): number => {
  // If LLM already provided a score, use it
  if (assessment.relevance_score && assessment.relevance_score > 0) {
    return assessment.relevance_score;
  }

  let score = 1.0;

  // Species relevance (canine/feline are most relevant)
  const species = (assessment.species_tested || []).map(s => s.toLowerCase());
  if (species.some(s => s.includes('canine') || s.includes('dog'))) score += 1.5;
  if (species.some(s => s.includes('feline') || s.includes('cat'))) score += 1.5;
  if (species.some(s => s.includes('equine') || s.includes('horse'))) score += 0.5;
  // In vitro / cell culture studies are less clinically relevant
  if (species.some(s => s.includes('in vitro') || s.includes('cell'))) score += 0.25;
  // Human studies have moderate relevance for veterinary extrapolation
  if (species.some(s => s.includes('human'))) score += 0.75;

  // Follow-up duration (longer = more relevant for chronic conditions)
  const duration = (assessment.follow_up_duration || '').toLowerCase();
  if (duration.includes('year') || duration.includes('month')) score += 0.5;
  else if (duration.includes('week')) score += 0.25;

  return Math.min(5.0, Math.round(score * 10) / 10);
};

/**
 * Novelty score is always from the LLM — cannot be computed deterministically.
 */
export const scoreStudyNovelty = (assessment: StudyAssessment): number => {
  return assessment.novelty_score || 0;
};
