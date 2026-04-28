/**
 * Biological Timeline Engine — Phase 1 (Heuristic)
 *
 * Projects a dog's clinical trajectory across future years using:
 * - Current active conditions (with severity)
 * - Breed predispositions from `breed_predispositions` table
 * - Breed average lifespan + size-based aging acceleration
 * - Gompertz-inspired hazard accumulation
 *
 * IMPORTANT: This is a Phase 1 heuristic engine. It produces transparent,
 * defensible estimates for UX validation. Phase 2 will replace the math with
 * an edge function backed by KG triplets + Lovable AI for citation-grounded
 * projections. Every output here is labeled "Heuristic Beta" in the UI.
 */

export interface BreedPredispositionInput {
  condition_id: string;
  condition_name: string;
  condition_name_en?: string | null;
  risk_factor: number; // 1.0 - 10.0
  evidence_grade: 'high' | 'moderate' | 'low' | 'very_low';
}

export interface ActiveConditionInput {
  id: string;
  condition_name: string;
  severity?: string | null; // 'mild' | 'moderate' | 'severe'
  status?: string | null;
}

export interface ProjectedExistingCondition {
  id: string;
  name: string;
  currentSeverity: 'mild' | 'moderate' | 'severe';
  projectedSeverityScore: number; // 0..1 (mild=0.2, moderate=0.55, severe=0.9)
  projectedSeverityLabel: 'mild' | 'moderate' | 'severe';
  deltaPercent: number; // change vs baseline
}

export interface ProjectedNewCondition {
  conditionId: string;
  name: string;
  probability: number; // 0..1
  evidenceGrade: BreedPredispositionInput['evidence_grade'];
  riskFactor: number;
}

export interface YearProjection {
  year: number; // years from now (0 = today)
  ageAtYear: number;
  biologicalAge: number;
  existingConditions: ProjectedExistingCondition[];
  newConditions: ProjectedNewCondition[];
  expectedRemainingYears: number;
}

export interface TimelineParams {
  currentAgeYears: number;
  averageLifespanYears: number; // breed lifespan
  sizeCategory?: string | null; // 'small' | 'medium' | 'large' | 'giant'
  averageWeightKg?: number | null;
  activeConditions: ActiveConditionInput[];
  breedPredispositions: BreedPredispositionInput[];
  withIntervention: boolean; // applies a generic protective factor
  maxYearsAhead?: number; // default = lifespan + 4 - currentAge
}

const SEVERITY_TO_SCORE: Record<string, number> = {
  mild: 0.2,
  moderate: 0.55,
  severe: 0.9,
};

function scoreToSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score >= 0.75) return 'severe';
  if (score >= 0.4) return 'moderate';
  return 'mild';
}

/**
 * Aging acceleration by body size — large/giant breeds age faster.
 * Source: Dog Aging Project / Kraus et al. 2013 (allometric scaling).
 */
function sizeAgingFactor(size?: string | null, weightKg?: number | null): number {
  if (size) {
    switch (size.toLowerCase()) {
      case 'giant': return 1.45;
      case 'large': return 1.25;
      case 'medium': return 1.05;
      case 'small': return 0.9;
    }
  }
  if (weightKg && weightKg > 0) {
    if (weightKg >= 45) return 1.45;
    if (weightKg >= 25) return 1.25;
    if (weightKg >= 10) return 1.05;
    return 0.9;
  }
  return 1.0;
}

/**
 * Gompertz-style hazard: probability accelerates with age, scaled by breed
 * lifespan. Returns cumulative incidence by `targetAge` for a baseline risk.
 */
function cumulativeIncidence(
  currentAge: number,
  targetAge: number,
  riskFactor: number,
  lifespan: number,
  sizeFactor: number,
  evidenceGrade: BreedPredispositionInput['evidence_grade']
): number {
  if (targetAge <= currentAge) return 0;
  // Normalized "biological clock": fraction of expected life consumed.
  const lifeFraction = Math.min(targetAge / lifespan, 1.6);
  // Hazard accelerates ~quadratically past 50% of lifespan.
  const hazardBase = Math.pow(Math.max(lifeFraction - 0.45, 0), 2.1);
  // Risk factor (1..10) scaled to a reasonable multiplier (0.05..0.5).
  const riskMultiplier = (riskFactor / 10) * 0.5;
  // Evidence dampener — low-evidence predispositions get smaller contribution.
  const evidenceDamp = {
    high: 1.0,
    moderate: 0.85,
    low: 0.65,
    very_low: 0.5,
  }[evidenceGrade];

  const lambda = hazardBase * riskMultiplier * sizeFactor * evidenceDamp * (targetAge - currentAge);
  return 1 - Math.exp(-lambda);
}

/**
 * Severity progression for an existing condition over time.
 * Sigmoid-shaped: slow at first, accelerating after ~2 years untreated.
 */
function progressSeverity(
  baselineScore: number,
  yearsAhead: number,
  sizeFactor: number,
  withIntervention: boolean
): number {
  const k = 0.55 * sizeFactor; // growth rate
  const t0 = 2.5; // inflection (years)
  const sigmoid = 1 / (1 + Math.exp(-k * (yearsAhead - t0)));
  // Untreated: condition can climb up to severity 0.95
  const ceiling = 0.95;
  const headroom = Math.max(ceiling - baselineScore, 0);
  let projected = baselineScore + headroom * sigmoid;
  if (withIntervention) {
    // Generic geroprotector effect: reduces progression by ~35% (Phase 2 will
    // pull this from KG triplets per condition+compound).
    const reduction = (projected - baselineScore) * 0.35;
    projected = projected - reduction;
  }
  return Math.min(projected, ceiling);
}

/**
 * Heuristic "biological age": chronological age adjusted by:
 * - number and severity of active conditions
 * - size-based aging factor
 */
function estimateBiologicalAge(
  chronologicalAge: number,
  activeConditions: ActiveConditionInput[],
  sizeFactor: number
): number {
  const conditionLoad = activeConditions
    .filter(c => c.status === 'active' || !c.status)
    .reduce((sum, c) => sum + (SEVERITY_TO_SCORE[c.severity || 'mild'] || 0.2), 0);
  // Each unit of severity load adds ~0.6 biological years; size accelerates.
  const ageDelta = conditionLoad * 0.6 * sizeFactor + (sizeFactor - 1) * chronologicalAge * 0.08;
  return Math.max(chronologicalAge + ageDelta, chronologicalAge);
}

/**
 * Expected remaining years using a Gompertz-derived survival curve calibrated
 * to breed `average_lifespan_years`, penalized by biological-age excess and
 * severe condition burden.
 */
function estimateRemainingYears(
  biologicalAge: number,
  lifespan: number,
  severeConditionsCount: number
): number {
  const base = Math.max(lifespan - biologicalAge, 0);
  const severePenalty = severeConditionsCount * 0.6;
  return Math.max(base - severePenalty, 0);
}

export function buildBiologicalTimeline(params: TimelineParams): YearProjection[] {
  const {
    currentAgeYears,
    averageLifespanYears,
    sizeCategory,
    averageWeightKg,
    activeConditions,
    breedPredispositions,
    withIntervention,
  } = params;

  const sizeFactor = sizeAgingFactor(sizeCategory, averageWeightKg);
  const lifespan = averageLifespanYears && averageLifespanYears > 0 ? averageLifespanYears : 12;
  const maxYears = params.maxYearsAhead ?? Math.max(Math.ceil(lifespan + 4 - currentAgeYears), 6);

  const activeFiltered = activeConditions.filter(c => c.status === 'active' || !c.status);
  const activeNames = new Set(activeFiltered.map(c => c.condition_name.toLowerCase()));

  const projections: YearProjection[] = [];
  for (let y = 0; y <= maxYears; y++) {
    const ageAtYear = currentAgeYears + y;

    const existingConditions: ProjectedExistingCondition[] = activeFiltered.map(c => {
      const baselineLabel = (c.severity as 'mild' | 'moderate' | 'severe') || 'mild';
      const baselineScore = SEVERITY_TO_SCORE[baselineLabel] || 0.2;
      const projectedScore = progressSeverity(baselineScore, y, sizeFactor, withIntervention);
      return {
        id: c.id,
        name: c.condition_name,
        currentSeverity: baselineLabel,
        projectedSeverityScore: projectedScore,
        projectedSeverityLabel: scoreToSeverity(projectedScore),
        deltaPercent: Math.round(((projectedScore - baselineScore) / Math.max(baselineScore, 0.01)) * 100),
      };
    });

    const newConditions: ProjectedNewCondition[] = breedPredispositions
      // exclude predispositions the dog already has
      .filter(p => !activeNames.has(p.condition_name.toLowerCase()) &&
                   !activeNames.has((p.condition_name_en || '').toLowerCase()))
      .map(p => {
        let prob = cumulativeIncidence(
          currentAgeYears,
          ageAtYear,
          p.risk_factor,
          lifespan,
          sizeFactor,
          p.evidence_grade
        );
        if (withIntervention) prob = prob * 0.7; // generic preventive effect
        return {
          conditionId: p.condition_id,
          name: p.condition_name,
          probability: prob,
          evidenceGrade: p.evidence_grade,
          riskFactor: p.risk_factor,
        };
      })
      .filter(p => p.probability >= 0.05) // hide noise
      .sort((a, b) => b.probability - a.probability);

    // Biological age recomputed at each step using projected severities
    const projectedActiveForBio: ActiveConditionInput[] = existingConditions.map(e => ({
      id: e.id,
      condition_name: e.name,
      severity: e.projectedSeverityLabel,
      status: 'active',
    }));
    const biologicalAge = estimateBiologicalAge(ageAtYear, projectedActiveForBio, sizeFactor);
    const severeCount = existingConditions.filter(e => e.projectedSeverityLabel === 'severe').length;
    const remaining = estimateRemainingYears(biologicalAge, lifespan, severeCount);

    projections.push({
      year: y,
      ageAtYear,
      biologicalAge,
      existingConditions,
      newConditions,
      expectedRemainingYears: remaining,
    });
  }

  return projections;
}
