/**
 * Sprint 1 — Calibrated Condition Progression Engine
 *
 * Replaces ad-hoc sigmoid heuristic with parametric curves anchored in real
 * meta-analyses and RCTs (table `condition_response_curves`). When no curve
 * matches, returns `calibrated: false` so the UI can render only the baseline
 * and a transparency notice — never invents a sigmoid.
 */
import { supabase } from '@/integrations/supabase/client';

export interface CurveCitation {
  pmid?: string;
  doi?: string;
  title: string;
  year?: number;
  journal?: string;
}

export interface CurveRow {
  id: string;
  condition_canonical: string;
  compound_class: string;
  time_to_effect_weeks: number;
  peak_effect_pct: number;
  plateau_week: number;
  placebo_decline_pct_per_year: number;
  effect_size_smd: number | null;
  confidence_band_pct: number;
  citations: CurveCitation[];
  extrapolated_from_human: boolean;
  notes?: string | null;
}

export interface CalibratedCurve {
  monthlyPoints: Array<{
    month: number;
    withTreatment: number;
    withoutTreatment: number;
    upperBand: number;
    lowerBand: number;
  }>;
  calibrated: boolean;
  extrapolated: boolean;
  citations: CurveCitation[];
  matchedCompoundClass?: string;
  notes?: string;
}

/**
 * Map free-text compound names → canonical compound_class buckets used in
 * `condition_response_curves`. Dictionary-driven; extend over time.
 */
const COMPOUND_CLASS_DICTIONARY: Array<{ pattern: RegExp; cls: string }> = [
  { pattern: /omega[\s-]?3|epa|dha|fish\s*oil|krill/i, cls: 'omega_3' },
  { pattern: /glucosamin|chondroitin|condroitin|glucosamina/i, cls: 'glucosamine_chondroitin' },
  { pattern: /pcso[-\s]?524|green[\s-]?lipped\s*mussel|mexilh.o.+verde/i, cls: 'green_lipped_mussel' },
  { pattern: /curcumin|c.rcuma|turmeric/i, cls: 'curcumin' },
  { pattern: /\bnmn\b|\bnr\b|nicotinamide\s*(mono|ribo)|nad\+?\s*precursor/i, cls: 'nmn_nr' },
];

export function classifyCompound(name: string): string | null {
  if (!name) return null;
  for (const { pattern, cls } of COMPOUND_CLASS_DICTIONARY) {
    if (pattern.test(name)) return cls;
  }
  return null;
}

/**
 * Pure curve builder. Given a row + baseline severity (0–100), produce 13
 * monthly points (M0..M12). Exported separately to keep it unit-testable
 * without hitting the database.
 */
export function buildPointsFromRow(row: CurveRow, baseline: number) {
  const baselineClamped = Math.max(0, Math.min(100, baseline));
  const peakWeeks = row.plateau_week;
  const t50Weeks = row.time_to_effect_weeks; // 50% of peak reached around here
  const k = 4 / Math.max(1, peakWeeks - t50Weeks); // logistic steepness
  const maxRoom = Math.max(0, 100 - baselineClamped);
  const peakDelta = Math.min(maxRoom, (row.peak_effect_pct / 100) * 100);
  const decayPerWeek = row.placebo_decline_pct_per_year / 52;

  const points = [];
  for (let m = 0; m <= 12; m++) {
    const weeks = m * 4.345;
    const sigmoid = 1 / (1 + Math.exp(-k * (weeks - t50Weeks)));
    const withTreatment = Math.min(100, baselineClamped + peakDelta * sigmoid);
    const withoutTreatment = Math.max(0, baselineClamped - decayPerWeek * weeks * (baselineClamped / 100) * 100 / 100);
    // Confidence band widens slightly with time to be visually honest
    const band = row.confidence_band_pct * (0.6 + 0.05 * m);
    const upperBand = Math.min(100, withTreatment + band);
    const lowerBand = Math.max(0, withTreatment - band);
    points.push({
      month: m,
      withTreatment: round1(withTreatment),
      withoutTreatment: round1(withoutTreatment),
      upperBand: round1(upperBand),
      lowerBand: round1(lowerBand),
    });
  }
  return points;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function emptyBaselineOnly(baseline: number): CalibratedCurve {
  const baselineClamped = Math.max(0, Math.min(100, baseline));
  return {
    monthlyPoints: Array.from({ length: 13 }, (_, m) => ({
      month: m,
      withTreatment: baselineClamped,
      withoutTreatment: baselineClamped,
      upperBand: baselineClamped,
      lowerBand: baselineClamped,
    })),
    calibrated: false,
    extrapolated: false,
    citations: [],
  };
}

/**
 * Pick the best calibrated curve from a candidate set.
 * Priority: non-extrapolated rows over extrapolated; higher SMD wins ties.
 */
export function pickBestCurve(rows: CurveRow[]): CurveRow | null {
  if (!rows || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    if (a.extrapolated_from_human !== b.extrapolated_from_human) {
      return a.extrapolated_from_human ? 1 : -1;
    }
    return (b.effect_size_smd ?? 0) - (a.effect_size_smd ?? 0);
  });
  return sorted[0];
}

/**
 * Public: build a calibrated curve for a condition × set of compounds.
 * Returns `calibrated: false` (baseline only) when nothing matches.
 */
export async function buildCalibratedCurve(
  conditionCanonical: string,
  compoundNames: string[],
  baseline: number,
): Promise<CalibratedCurve> {
  if (!conditionCanonical) return emptyBaselineOnly(baseline);

  const compoundClasses = Array.from(
    new Set(compoundNames.map(classifyCompound).filter(Boolean) as string[]),
  );
  if (compoundClasses.length === 0) return emptyBaselineOnly(baseline);

  const { data, error } = await (supabase as any)
    .from('condition_response_curves')
    .select('*')
    .eq('condition_canonical', conditionCanonical)
    .in('compound_class', compoundClasses);

  if (error || !data || data.length === 0) return emptyBaselineOnly(baseline);

  const best = pickBestCurve(data as CurveRow[]);
  if (!best) return emptyBaselineOnly(baseline);

  return {
    monthlyPoints: buildPointsFromRow(best, baseline),
    calibrated: true,
    extrapolated: best.extrapolated_from_human,
    citations: best.citations || [],
    matchedCompoundClass: best.compound_class,
    notes: best.notes ?? undefined,
  };
}