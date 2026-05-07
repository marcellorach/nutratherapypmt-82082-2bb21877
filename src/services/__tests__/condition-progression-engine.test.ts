import { describe, it, expect } from 'vitest';

// Stub localStorage before importing the engine (engine pulls supabase client which touches localStorage at module init).
(globalThis as any).localStorage = (globalThis as any).localStorage ?? {
  getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
};

import {
  buildPointsFromRow,
  classifyCompound,
  pickBestCurve,
  type CurveRow,
} from '../condition-progression-engine';

const oaOmega3: CurveRow = {
  id: '1',
  condition_canonical: 'Osteoarthritis',
  compound_class: 'omega_3',
  time_to_effect_weeks: 8,
  peak_effect_pct: 22,
  plateau_week: 16,
  placebo_decline_pct_per_year: 12,
  effect_size_smd: 0.61,
  confidence_band_pct: 7,
  citations: [{ pmid: '36142319', title: 'Meta-analysis 2022' }],
  extrapolated_from_human: false,
};

const senescenceNmn: CurveRow = {
  ...oaOmega3,
  id: '2',
  condition_canonical: 'Cellular Senescence',
  compound_class: 'nmn_nr',
  time_to_effect_weeks: 12,
  peak_effect_pct: 16,
  plateau_week: 24,
  placebo_decline_pct_per_year: 5,
  effect_size_smd: 0.4,
  extrapolated_from_human: true,
};

describe('classifyCompound', () => {
  it('maps omega-3 variants', () => {
    expect(classifyCompound('Omega-3')).toBe('omega_3');
    expect(classifyCompound('EPA + DHA')).toBe('omega_3');
    expect(classifyCompound('Fish oil concentrate')).toBe('omega_3');
  });
  it('maps glucosamine and chondroitin', () => {
    expect(classifyCompound('Glucosamina + Condroitina')).toBe('glucosamine_chondroitin');
  });
  it('maps green-lipped mussel / PCSO-524', () => {
    expect(classifyCompound('PCSO-524')).toBe('green_lipped_mussel');
    expect(classifyCompound('Mexilhão verde')).toBe('green_lipped_mussel');
  });
  it('maps curcumin/curcuma', () => {
    expect(classifyCompound('Cúrcuma')).toBe('curcumin');
  });
  it('maps NMN/NR', () => {
    expect(classifyCompound('NMN')).toBe('nmn_nr');
    expect(classifyCompound('Nicotinamide Riboside')).toBe('nmn_nr');
  });
  it('returns null for unknowns', () => {
    expect(classifyCompound('Pulmozyme XYZ')).toBeNull();
    expect(classifyCompound('')).toBeNull();
  });
});

describe('buildPointsFromRow', () => {
  it('produces 13 monthly points (M0..M12)', () => {
    const pts = buildPointsFromRow(oaOmega3, 60);
    expect(pts).toHaveLength(13);
    expect(pts[0].month).toBe(0);
    expect(pts[12].month).toBe(12);
  });

  it('M0 with-treatment ≈ baseline, M12 above baseline for active compound', () => {
    const baseline = 60;
    const pts = buildPointsFromRow(oaOmega3, baseline);
    expect(pts[0].withTreatment).toBeCloseTo(baseline, 0);
    expect(pts[12].withTreatment).toBeGreaterThan(baseline + 5);
  });

  it('reaches near plateau by ~M4 (week ~16) for OA omega-3', () => {
    const pts = buildPointsFromRow(oaOmega3, 60);
    const plateau = pts[12].withTreatment;
    const m4 = pts[4].withTreatment;
    // M4 should already capture >=70% of total improvement
    const totalDelta = plateau - 60;
    const m4Delta = m4 - 60;
    expect(m4Delta / Math.max(0.01, totalDelta)).toBeGreaterThan(0.7);
  });

  it('without-treatment decays monotonically when placebo_decline > 0', () => {
    const pts = buildPointsFromRow(oaOmega3, 70);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].withoutTreatment).toBeLessThanOrEqual(pts[i - 1].withoutTreatment + 0.01);
    }
    expect(pts[12].withoutTreatment).toBeLessThan(pts[0].withoutTreatment);
  });

  it('without-treatment is flat when placebo_decline = 0', () => {
    const flat = { ...oaOmega3, placebo_decline_pct_per_year: 0 };
    const pts = buildPointsFromRow(flat, 70);
    expect(pts[12].withoutTreatment).toBeCloseTo(pts[0].withoutTreatment, 1);
  });

  it('upperBand >= withTreatment >= lowerBand at every point', () => {
    const pts = buildPointsFromRow(oaOmega3, 55);
    for (const p of pts) {
      expect(p.upperBand).toBeGreaterThanOrEqual(p.withTreatment - 0.01);
      expect(p.lowerBand).toBeLessThanOrEqual(p.withTreatment + 0.01);
    }
  });

  it('confidence band widens with time', () => {
    const pts = buildPointsFromRow(oaOmega3, 55);
    const widthM1 = pts[1].upperBand - pts[1].lowerBand;
    const widthM12 = pts[12].upperBand - pts[12].lowerBand;
    expect(widthM12).toBeGreaterThan(widthM1);
  });

  it('respects [0, 100] bounds even with extreme baselines', () => {
    const high = buildPointsFromRow(oaOmega3, 95);
    expect(high[12].withTreatment).toBeLessThanOrEqual(100);
    const low = buildPointsFromRow(oaOmega3, 5);
    expect(low[12].withoutTreatment).toBeGreaterThanOrEqual(0);
  });
});

describe('pickBestCurve', () => {
  it('returns null on empty input', () => {
    expect(pickBestCurve([])).toBeNull();
  });
  it('prefers non-extrapolated over extrapolated', () => {
    const winner = pickBestCurve([senescenceNmn, oaOmega3]);
    expect(winner?.id).toBe('1');
  });
  it('breaks ties by higher SMD', () => {
    const a: CurveRow = { ...oaOmega3, id: 'a', effect_size_smd: 0.3 };
    const b: CurveRow = { ...oaOmega3, id: 'b', effect_size_smd: 0.7 };
    expect(pickBestCurve([a, b])?.id).toBe('b');
  });
});