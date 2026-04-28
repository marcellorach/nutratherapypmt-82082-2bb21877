/**
 * Biological Timeline Engine — v2 (Honest, KG-grounded)
 *
 * Replaces the v1 global multipliers with per-condition logic that requires
 * actual KG evidence (compound × condition with efficacy_score >= 3) before
 * any reduction is applied. Adds protocol penalties (polypharmacy, adherence)
 * so the toggle is a fair comparison, not an optimistic assumption.
 *
 * Phase 2 (edge function) overrides this when AI projection is available.
 */

export interface BreedPredispositionInput {
  condition_id: string;
  condition_name: string;
  condition_name_en?: string | null;
  risk_factor: number;
  evidence_grade: 'high' | 'moderate' | 'low' | 'very_low';
}

export interface ActiveConditionInput {
  id: string;
  condition_name: string;
  severity?: string | null;
  status?: string | null;
}

/**
 * KG coverage entry: per condition, a list of supporting compounds with
 * efficacy and evidence grade. Empty/missing = no protective effect modeled.
 */
export interface KgCoverageEntry {
  conditionKey: string; // lowercased condition name
  compounds: Array<{
    name: string;
    efficacy_0_5: number;
    relationship_type?: string | null;
  }>;
  bestEfficacy: number; // 0..5
  supportCount: number; // distinct compounds with efficacy >= 3
}

export interface ProjectedExistingCondition {
  id: string;
  name: string;
  currentSeverity: 'mild' | 'moderate' | 'severe';
  projectedSeverityScore: number;
  projectedSeverityLabel: 'mild' | 'moderate' | 'severe';
  deltaPercent: number;
  kgCovered: boolean;
  protectionApplied: number; // 0..0.40
  anchorCompounds: string[]; // names of supporting compounds
}

export interface ProjectedNewCondition {
  conditionId: string;
  name: string;
  probability: number;
  evidenceGrade: BreedPredispositionInput['evidence_grade'];
  riskFactor: number;
  kgCovered: boolean;
  protectionApplied: number;
  anchorCompounds: string[];
}

export interface ProtocolCaveat {
  type: 'polypharmacy' | 'adherence' | 'no_kg_coverage' | 'partial_coverage';
  message: string;
  conditionName?: string;
}

export interface YearProjection {
  year: number;
  ageAtYear: number;
  biologicalAge: number;
  existingConditions: ProjectedExistingCondition[];
  newConditions: ProjectedNewCondition[];
  expectedRemainingYears: number;
  protocolCaveats: ProtocolCaveat[];
  coverageRatio: number; // 0..1, fraction of conditions with KG support
}

export interface TimelineParams {
  currentAgeYears: number;
  averageLifespanYears: number;
  sizeCategory?: string | null;
  averageWeightKg?: number | null;
  activeConditions: ActiveConditionInput[];
  breedPredispositions: BreedPredispositionInput[];
  withIntervention: boolean;
  maxYearsAhead?: number;
  /** Optional KG coverage map. Without this, intervention applies ZERO benefit. */
  kgCoverage?: KgCoverageEntry[];
  /** Estimated daily compound count when intervention is on (for polypharmacy penalty). */
  protocolCompoundCount?: number;
  /** Estimated adherence factor 0..1 (default 0.75). */
  adherenceFactor?: number;
}

const SEVERITY_TO_SCORE: Record<string, number> = {
  mild: 0.2,
  moderate: 0.55,
  severe: 0.9,
};

const EVIDENCE_GRADE_FACTOR: Record<string, number> = {
  high: 1.0,
  moderate: 0.7,
  low: 0.4,
  very_low: 0.2,
};

function scoreToSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score >= 0.75) return 'severe';
  if (score >= 0.4) return 'moderate';
  return 'mild';
}

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
 * Looks up KG coverage for a condition (case-insensitive, partial match).
 */
function lookupCoverage(
  conditionName: string,
  coverage: KgCoverageEntry[] | undefined,
): KgCoverageEntry | null {
  if (!coverage || coverage.length === 0) return null;
  const key = conditionName.toLowerCase().trim();
  // exact
  const exact = coverage.find(c => c.conditionKey === key);
  if (exact) return exact;
  // partial (covers Inflammaging matches Chronic Inflammation, etc.)
  const partial = coverage.find(
    c => key.includes(c.conditionKey) || c.conditionKey.includes(key),
  );
  return partial || null;
}

/**
 * Compute per-condition protection from KG evidence.
 * Returns 0..0.40 reduction multiplier (max 40% reduction).
 * Without KG support → 0 (toggle has NO effect on this condition).
 */
function conditionProtection(
  conditionName: string,
  coverage: KgCoverageEntry[] | undefined,
  withIntervention: boolean,
): { reduction: number; anchors: string[]; covered: boolean } {
  if (!withIntervention) return { reduction: 0, anchors: [], covered: false };
  const entry = lookupCoverage(conditionName, coverage);
  if (!entry || entry.supportCount === 0) {
    return { reduction: 0, anchors: [], covered: false };
  }
  // Top 2 anchors by efficacy
  const top = [...entry.compounds]
    .filter(c => c.efficacy_0_5 >= 3)
    .sort((a, b) => b.efficacy_0_5 - a.efficacy_0_5)
    .slice(0, 2);
  if (top.length === 0) {
    return { reduction: 0, anchors: [], covered: false };
  }
  // Sum of efficacies / 10, capped at 0.40
  const rawReduction = Math.min(
    top.reduce((s, c) => s + c.efficacy_0_5, 0) / 10,
    0.4,
  );
  return {
    reduction: rawReduction,
    anchors: top.map(c => c.name),
    covered: true,
  };
}

function progressSeverity(
  baselineScore: number,
  yearsAhead: number,
  sizeFactor: number,
  protection: number,
  adherence: number,
): number {
  const k = 0.55 * sizeFactor;
  const t0 = 2.5;
  const sigmoid = 1 / (1 + Math.exp(-k * (yearsAhead - t0)));
  const ceiling = 0.95;
  const headroom = Math.max(ceiling - baselineScore, 0);
  let projected = baselineScore + headroom * sigmoid;
  // Effective protection = KG protection × adherence
  const effectiveProtection = protection * adherence;
  if (effectiveProtection > 0) {
    const delta = projected - baselineScore;
    projected = projected - delta * effectiveProtection;
  }
  return Math.min(projected, ceiling);
}

function cumulativeIncidence(
  currentAge: number,
  targetAge: number,
  riskFactor: number,
  lifespan: number,
  sizeFactor: number,
  evidenceGrade: BreedPredispositionInput['evidence_grade'],
  protection: number,
  adherence: number,
): number {
  if (targetAge <= currentAge) return 0;
  const lifeFraction = Math.min(targetAge / lifespan, 1.6);
  const hazardBase = Math.pow(Math.max(lifeFraction - 0.45, 0), 2.1);
  const riskMultiplier = (riskFactor / 10) * 0.5;
  const evidenceDamp = EVIDENCE_GRADE_FACTOR[evidenceGrade] ?? 0.5;
  let lambda = hazardBase * riskMultiplier * sizeFactor * evidenceDamp * (targetAge - currentAge);
  // Incidence reduction is 60% of severity reduction (preventive < curative)
  const effectiveProtection = protection * adherence * 0.6;
  if (effectiveProtection > 0) {
    lambda = lambda * (1 - effectiveProtection);
  }
  return 1 - Math.exp(-lambda);
}

function estimateBiologicalAge(
  chronologicalAge: number,
  activeConditions: ActiveConditionInput[],
  sizeFactor: number,
): number {
  const conditionLoad = activeConditions
    .filter(c => c.status === 'active' || !c.status)
    .reduce((sum, c) => sum + (SEVERITY_TO_SCORE[c.severity || 'mild'] || 0.2), 0);
  const ageDelta = conditionLoad * 0.6 * sizeFactor + (sizeFactor - 1) * chronologicalAge * 0.08;
  return Math.max(chronologicalAge + ageDelta, chronologicalAge);
}

function estimateRemainingYears(
  biologicalAge: number,
  lifespan: number,
  severeConditionsCount: number,
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
    kgCoverage,
    protocolCompoundCount = 0,
    adherenceFactor = 0.75,
  } = params;

  const sizeFactor = sizeAgingFactor(sizeCategory, averageWeightKg);
  const lifespan = averageLifespanYears && averageLifespanYears > 0 ? averageLifespanYears : 12;
  const maxYears = params.maxYearsAhead ?? Math.max(Math.ceil(lifespan + 4 - currentAgeYears), 6);

  const activeFiltered = activeConditions.filter(c => c.status === 'active' || !c.status);
  const activeNames = new Set(activeFiltered.map(c => c.condition_name.toLowerCase()));

  // Polypharmacy adherence penalty: every compound beyond 4 reduces adherence by 5%
  const polyAdherence = withIntervention && protocolCompoundCount > 4
    ? Math.max(adherenceFactor - (protocolCompoundCount - 4) * 0.05, 0.4)
    : adherenceFactor;

  const projections: YearProjection[] = [];

  for (let y = 0; y <= maxYears; y++) {
    const ageAtYear = currentAgeYears + y;
    const caveats: ProtocolCaveat[] = [];
    let coveredCount = 0;
    let totalConditions = activeFiltered.length + breedPredispositions.length;

    const existingConditions: ProjectedExistingCondition[] = activeFiltered.map(c => {
      const baselineLabel = (c.severity as 'mild' | 'moderate' | 'severe') || 'mild';
      const baselineScore = SEVERITY_TO_SCORE[baselineLabel] || 0.2;
      const prot = conditionProtection(c.condition_name, kgCoverage, withIntervention);
      if (prot.covered) coveredCount++;
      const projectedScore = progressSeverity(baselineScore, y, sizeFactor, prot.reduction, polyAdherence);
      return {
        id: c.id,
        name: c.condition_name,
        currentSeverity: baselineLabel,
        projectedSeverityScore: projectedScore,
        projectedSeverityLabel: scoreToSeverity(projectedScore),
        deltaPercent: Math.round(((projectedScore - baselineScore) / Math.max(baselineScore, 0.01)) * 100),
        kgCovered: prot.covered,
        protectionApplied: prot.reduction,
        anchorCompounds: prot.anchors,
      };
    });

    const newConditions: ProjectedNewCondition[] = breedPredispositions
      .filter(p => !activeNames.has(p.condition_name.toLowerCase()) &&
                   !activeNames.has((p.condition_name_en || '').toLowerCase()))
      .map(p => {
        const prot = conditionProtection(p.condition_name, kgCoverage, withIntervention);
        if (prot.covered) coveredCount++;
        const prob = cumulativeIncidence(
          currentAgeYears,
          ageAtYear,
          p.risk_factor,
          lifespan,
          sizeFactor,
          p.evidence_grade,
          prot.reduction,
          polyAdherence,
        );
        return {
          conditionId: p.condition_id,
          name: p.condition_name,
          probability: prob,
          evidenceGrade: p.evidence_grade,
          riskFactor: p.risk_factor,
          kgCovered: prot.covered,
          protectionApplied: prot.reduction,
          anchorCompounds: prot.anchors,
        };
      })
      .filter(p => p.probability >= 0.05)
      .sort((a, b) => b.probability - a.probability);

    if (withIntervention && y === 0) {
      const uncovered = [
        ...existingConditions.filter(c => !c.kgCovered).map(c => c.name),
        ...newConditions.filter(c => !c.kgCovered).map(c => c.name),
      ];
      if (uncovered.length > 0 && coveredCount === 0) {
        caveats.push({
          type: 'no_kg_coverage',
          message: `Nenhuma condição deste pet tem evidência KG suficiente para benefício do protocolo (${uncovered.length} condição(ões) sem cobertura).`,
        });
      } else if (uncovered.length > coveredCount) {
        caveats.push({
          type: 'partial_coverage',
          message: `${coveredCount} de ${coveredCount + uncovered.length} condição(ões) têm evidência KG. As demais não recebem benefício do protocolo.`,
        });
      }
      if (protocolCompoundCount > 4) {
        caveats.push({
          type: 'polypharmacy',
          message: `Polifarmácia: ${protocolCompoundCount} compostos diários. Adesão ajustada para ${Math.round(polyAdherence * 100)}%.`,
        });
      }
      caveats.push({
        type: 'adherence',
        message: `Adesão estimada: ${Math.round(polyAdherence * 100)}%. Benefício real depende da regularidade.`,
      });
    }

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
      protocolCaveats: caveats,
      coverageRatio: totalConditions > 0 ? coveredCount / totalConditions : 0,
    });
  }

  return projections;
}
