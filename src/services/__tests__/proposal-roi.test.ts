import { describe, it, expect } from 'vitest';
import { computeProposalROI } from '../proposal-roi';

describe('computeProposalROI', () => {
  it('computes annual cost from monthly × months', () => {
    const r = computeProposalROI({ monthlyPriceBrl: 200, subscriptionMonths: 12 });
    expect(r.annualPlanCost).toBe(2400);
  });

  it('returns null for installedCost / projectedDelta when reference is absent', () => {
    const r = computeProposalROI({ monthlyPriceBrl: 200, subscriptionMonths: 12 });
    expect(r.installedCost).toBeNull();
    expect(r.projectedDelta).toBeNull();
  });

  it('computes positive delta when installed treatment costs more than the plan', () => {
    const r = computeProposalROI({
      monthlyPriceBrl: 200,
      subscriptionMonths: 12,
      installedTreatmentCostBrl: 6000,
    });
    expect(r.projectedDelta).toBe(3600);
  });

  it('computes negative delta when plan costs more than the installed treatment', () => {
    const r = computeProposalROI({
      monthlyPriceBrl: 500,
      subscriptionMonths: 12,
      installedTreatmentCostBrl: 1000,
    });
    expect(r.projectedDelta).toBe(-5000);
  });

  it('M3 credit equals 50% of three-month investment', () => {
    const r = computeProposalROI({ monthlyPriceBrl: 200, subscriptionMonths: 12 });
    // 200 * 3 * 0.5 = 300
    expect(r.m3CreditBrl).toBe(300);
  });

  it('clamps invalid input safely', () => {
    const r = computeProposalROI({ monthlyPriceBrl: -10, subscriptionMonths: 0 });
    expect(r.annualPlanCost).toBe(0);
  });

  it('exposes a sane default target improvement (>0)', () => {
    const r = computeProposalROI({ monthlyPriceBrl: 100, subscriptionMonths: 12 });
    expect(r.targetImprovementPct).toBeGreaterThan(0);
  });
});