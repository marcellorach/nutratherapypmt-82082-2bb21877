/**
 * Conflict Detection Service
 * Analyzes evidence claims to detect dosage conflicts and calculate agreement scores
 */

export interface EvidenceClaim {
  id: string;
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  species_context: string[];
  study_id: string | null;
  study_quality_score: number | null;
  study_year: number | null;
  dose_value: number | null;
  dose_min: number | null;
  dose_max: number | null;
  dose_unit: string | null;
  dose_frequency: string | null;
  dose_duration: string | null;
  dose_route: string | null;
  extraction_confidence: number | null;
  triplet_id: string | null;
}

export interface ConflictAnalysis {
  claimCount: number;
  studyCount: number;
  
  // Dosage analysis
  doseConflictLevel: 'none' | 'low' | 'moderate' | 'high';
  doseVarianceCoefficient: number; // CV = std/mean
  hasDoseData: boolean;
  
  // Individual dose ranges from each study
  doseRanges: {
    claimId: string;
    studyId: string | null;
    studyYear: number | null;
    studyQuality: number | null;
    species: string[];
    doseValue: number | null;
    doseMin: number | null;
    doseMax: number | null;
    doseUnit: string | null;
    doseFrequency: string | null;
  }[];
  
  // Agreement analysis
  agreementScore: number; // 0-1, how much studies agree
  
  // Action flags
  requiresHumanReview: boolean;
  aggregationSafe: boolean;
  
  // AI suggestion for human
  humanGuidance: string;
  recommendedAction: 'aggregate' | 'show_range' | 'keep_separate' | 'needs_review';
}

export interface ConflictDetectionResult {
  relationshipKey: string;
  subjectName: string;
  subjectType: string;
  predicate: string;
  objectName: string;
  objectType: string;
  speciesContext: string[];
  analysis: ConflictAnalysis;
  claims: EvidenceClaim[];
}

/**
 * Calculate the coefficient of variation (CV) for a set of numeric values
 * CV = standard deviation / mean
 */
function calculateCV(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev / mean;
}

/**
 * Determine conflict level based on coefficient of variation
 */
function determineConflictLevel(cv: number, studyCount: number): 'none' | 'low' | 'moderate' | 'high' {
  if (studyCount < 2) return 'none';
  
  if (cv < 0.2) return 'low';      // < 20% variance
  if (cv < 0.5) return 'moderate'; // 20-50% variance
  return 'high';                   // > 50% variance
}

/**
 * Generate human-readable guidance based on conflict analysis
 */
function generateHumanGuidance(analysis: Partial<ConflictAnalysis>, claims: EvidenceClaim[]): string {
  const { doseConflictLevel, doseVarianceCoefficient, studyCount } = analysis;
  
  if (studyCount === 1) {
    return 'Single study found. Consider marking as "preliminary" until more evidence is available.';
  }
  
  if (!analysis.hasDoseData) {
    return 'No dosage data available in the claims. Review qualitative aspects only.';
  }
  
  switch (doseConflictLevel) {
    case 'none':
    case 'low':
      return `Good agreement between ${studyCount} studies (CV: ${((doseVarianceCoefficient || 0) * 100).toFixed(1)}%). Safe to aggregate dosage data.`;
    
    case 'moderate':
      const moderateRange = claims
        .filter(c => c.dose_value || c.dose_min)
        .map(c => c.dose_value || c.dose_min)
        .sort((a, b) => (a || 0) - (b || 0));
      return `Moderate variance (CV: ${((doseVarianceCoefficient || 0) * 100).toFixed(1)}%) between ${studyCount} studies. Range: ${moderateRange[0]} - ${moderateRange[moderateRange.length - 1]}. Consider showing range with note.`;
    
    case 'high':
      // Find the highest quality study
      const sortedByQuality = [...claims]
        .filter(c => c.study_quality_score !== null)
        .sort((a, b) => (b.study_quality_score || 0) - (a.study_quality_score || 0));
      
      if (sortedByQuality.length > 0) {
        const bestStudy = sortedByQuality[0];
        return `High variance (CV: ${((doseVarianceCoefficient || 0) * 100).toFixed(1)}%) detected. Studies show conflicting dosages. Recommend using study from ${bestStudy.study_year || 'unknown year'} (quality: ${bestStudy.study_quality_score}) as primary reference, or keep separate for different contexts.`;
      }
      return `High variance (CV: ${((doseVarianceCoefficient || 0) * 100).toFixed(1)}%) detected. Manual review required to determine which study to prioritize.`;
    
    default:
      return 'Unable to analyze conflict. Manual review required.';
  }
}

/**
 * Analyze a group of claims for conflicts
 */
export function analyzeClaimsForConflicts(claims: EvidenceClaim[]): ConflictAnalysis {
  const claimCount = claims.length;
  const uniqueStudyIds = new Set(claims.map(c => c.study_id).filter(Boolean));
  const studyCount = uniqueStudyIds.size;
  
  // Extract dose values for variance calculation
  const doseValues: number[] = [];
  const doseRanges: ConflictAnalysis['doseRanges'] = [];
  
  for (const claim of claims) {
    // Use dose_value if available, otherwise use midpoint of min/max
    let effectiveDose: number | null = null;
    
    if (claim.dose_value !== null) {
      effectiveDose = claim.dose_value;
    } else if (claim.dose_min !== null && claim.dose_max !== null) {
      effectiveDose = (claim.dose_min + claim.dose_max) / 2;
    } else if (claim.dose_min !== null) {
      effectiveDose = claim.dose_min;
    } else if (claim.dose_max !== null) {
      effectiveDose = claim.dose_max;
    }
    
    if (effectiveDose !== null) {
      doseValues.push(effectiveDose);
    }
    
    doseRanges.push({
      claimId: claim.id,
      studyId: claim.study_id,
      studyYear: claim.study_year,
      studyQuality: claim.study_quality_score,
      species: claim.species_context || [],
      doseValue: claim.dose_value,
      doseMin: claim.dose_min,
      doseMax: claim.dose_max,
      doseUnit: claim.dose_unit,
      doseFrequency: claim.dose_frequency,
    });
  }
  
  const hasDoseData = doseValues.length > 0;
  const cv = hasDoseData ? calculateCV(doseValues) : 0;
  const conflictLevel = determineConflictLevel(cv, studyCount);
  
  // Calculate agreement score (inverse of normalized CV, capped at 1)
  const agreementScore = hasDoseData ? Math.max(0, 1 - cv) : 1;
  
  // Determine if human review is needed
  const requiresHumanReview = conflictLevel === 'high' || (conflictLevel === 'moderate' && studyCount >= 3);
  
  // Determine if aggregation is safe
  const aggregationSafe = conflictLevel === 'none' || conflictLevel === 'low';
  
  // Determine recommended action
  let recommendedAction: ConflictAnalysis['recommendedAction'];
  if (conflictLevel === 'high') {
    recommendedAction = 'needs_review';
  } else if (conflictLevel === 'moderate') {
    recommendedAction = 'show_range';
  } else if (studyCount >= 2) {
    recommendedAction = 'aggregate';
  } else {
    recommendedAction = 'keep_separate'; // Single study
  }
  
  const partialAnalysis = {
    claimCount,
    studyCount,
    doseConflictLevel: conflictLevel,
    doseVarianceCoefficient: cv,
    hasDoseData,
    doseRanges,
    agreementScore,
    requiresHumanReview,
    aggregationSafe,
    recommendedAction,
  };
  
  const humanGuidance = generateHumanGuidance(partialAnalysis, claims);
  
  return {
    ...partialAnalysis,
    humanGuidance,
  };
}

/**
 * Group claims by relationship and analyze each group
 */
export function detectConflictsInClaims(claims: EvidenceClaim[]): ConflictDetectionResult[] {
  // Group claims by normalized relationship key
  const groupedClaims = new Map<string, EvidenceClaim[]>();
  
  for (const claim of claims) {
    // Create a key that groups claims by the same relationship + species context
    const speciesKey = (claim.species_context || []).sort().join(',');
    const key = `${claim.subject_name.toLowerCase()}|${claim.predicate}|${claim.object_name.toLowerCase()}|${speciesKey}`;
    
    if (!groupedClaims.has(key)) {
      groupedClaims.set(key, []);
    }
    groupedClaims.get(key)!.push(claim);
  }
  
  // Analyze each group
  const results: ConflictDetectionResult[] = [];
  
  for (const [key, groupClaims] of groupedClaims) {
    const firstClaim = groupClaims[0];
    const analysis = analyzeClaimsForConflicts(groupClaims);
    
    results.push({
      relationshipKey: key,
      subjectName: firstClaim.subject_name,
      subjectType: firstClaim.subject_type,
      predicate: firstClaim.predicate,
      objectName: firstClaim.object_name,
      objectType: firstClaim.object_type,
      speciesContext: firstClaim.species_context || [],
      analysis,
      claims: groupClaims,
    });
  }
  
  // Sort by conflict level (high first) and claim count
  results.sort((a, b) => {
    const levelOrder = { high: 0, moderate: 1, low: 2, none: 3 };
    const levelDiff = levelOrder[a.analysis.doseConflictLevel] - levelOrder[b.analysis.doseConflictLevel];
    if (levelDiff !== 0) return levelDiff;
    return b.analysis.claimCount - a.analysis.claimCount;
  });
  
  return results;
}

/**
 * Filter results to only show conflicts that need attention
 */
export function getConflictsNeedingReview(results: ConflictDetectionResult[]): ConflictDetectionResult[] {
  return results.filter(r => r.analysis.requiresHumanReview);
}

/**
 * Calculate a weighted canonical value from selected claims
 */
export function calculateWeightedCanonicalValue(
  claims: EvidenceClaim[],
  weights?: { [claimId: string]: number }
): {
  dose_min: number | null;
  dose_max: number | null;
  dose_unit: string | null;
  dose_frequency: string | null;
} {
  if (claims.length === 0) {
    return { dose_min: null, dose_max: null, dose_unit: null, dose_frequency: null };
  }
  
  // Default weights based on study quality
  const effectiveWeights: { [claimId: string]: number } = {};
  let totalWeight = 0;
  
  for (const claim of claims) {
    const weight = weights?.[claim.id] ?? (claim.study_quality_score || 0.5);
    effectiveWeights[claim.id] = weight;
    totalWeight += weight;
  }
  
  // Normalize weights
  for (const id in effectiveWeights) {
    effectiveWeights[id] /= totalWeight;
  }
  
  // Calculate weighted values
  let weightedMin = 0;
  let weightedMax = 0;
  let hasMin = false;
  let hasMax = false;
  
  for (const claim of claims) {
    const w = effectiveWeights[claim.id];
    
    if (claim.dose_min !== null) {
      weightedMin += claim.dose_min * w;
      hasMin = true;
    } else if (claim.dose_value !== null) {
      weightedMin += claim.dose_value * w;
      hasMin = true;
    }
    
    if (claim.dose_max !== null) {
      weightedMax += claim.dose_max * w;
      hasMax = true;
    } else if (claim.dose_value !== null) {
      weightedMax += claim.dose_value * w;
      hasMax = true;
    }
  }
  
  // Get most common unit and frequency
  const unitCounts = new Map<string, number>();
  const freqCounts = new Map<string, number>();
  
  for (const claim of claims) {
    if (claim.dose_unit) {
      unitCounts.set(claim.dose_unit, (unitCounts.get(claim.dose_unit) || 0) + 1);
    }
    if (claim.dose_frequency) {
      freqCounts.set(claim.dose_frequency, (freqCounts.get(claim.dose_frequency) || 0) + 1);
    }
  }
  
  const mostCommonUnit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const mostCommonFreq = [...freqCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  return {
    dose_min: hasMin ? Math.round(weightedMin * 100) / 100 : null,
    dose_max: hasMax ? Math.round(weightedMax * 100) / 100 : null,
    dose_unit: mostCommonUnit,
    dose_frequency: mostCommonFreq,
  };
}
