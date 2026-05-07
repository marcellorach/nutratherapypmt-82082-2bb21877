/**
 * Sprint 7 — Honest ROI computation for the tutor's proposal CTA.
 *
 * Pure, side-effect-free helpers so we can unit-test the math without
 * rendering the React tree. Numbers come from the proposal itself
 * (monthly price + months) plus an optional reference cost for treating
 * the installed condition (which the vet flow may pass when known).
 *
 * If `installedTreatmentCostBrl` is missing we honestly return null for
 * the comparison cells — the UI shows "—" instead of inventing a number.
 */

export interface ROIInput {
  monthlyPriceBrl: number;
  subscriptionMonths: number;
  installedTreatmentCostBrl?: number | null;
}

export interface ROIResult {
  annualPlanCost: number;
  installedCost: number | null;
  projectedDelta: number | null;
  /** Credit returned at M3 if calibration exams don't show ≥ targetImprovementPct. */
  m3CreditBrl: number;
  targetImprovementPct: number;
}

const DEFAULT_TARGET_IMPROVEMENT_PCT = 15;
const M3_CREDIT_RATIO = 0.5; // refund 50% of the 3-month investment

export function computeProposalROI(input: ROIInput): ROIResult {
  const monthly = Math.max(0, Number(input.monthlyPriceBrl) || 0);
  const months = Math.max(1, Number(input.subscriptionMonths) || 12);
  const annualPlanCost = monthly * months;

  const installedCost =
    input.installedTreatmentCostBrl != null && Number.isFinite(input.installedTreatmentCostBrl)
      ? Number(input.installedTreatmentCostBrl)
      : null;

  const projectedDelta = installedCost != null ? installedCost - annualPlanCost : null;

  const m3CreditBrl = Math.round(monthly * 3 * M3_CREDIT_RATIO * 100) / 100;

  return {
    annualPlanCost,
    installedCost,
    projectedDelta,
    m3CreditBrl,
    targetImprovementPct: DEFAULT_TARGET_IMPROVEMENT_PCT,
  };
}