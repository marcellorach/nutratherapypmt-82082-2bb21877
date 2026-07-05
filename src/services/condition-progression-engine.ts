/**
 * Sprint 1 — Calibrated Condition Progression Engine
 *
 * Thin I/O wrapper. Pure math + types live in
 * `condition-progression-engine.pure.ts` (Node-safe, no Supabase import).
 * This file only adds the SELECT against `condition_response_curves`.
 * All pure exports are re-exported here so existing consumers keep working
 * with unchanged import paths.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  buildPointsFromRow,
  classifyCompound,
  emptyBaselineOnly,
  pickBestCurve,
  type CalibratedCurve,
  type CurveRow,
} from './condition-progression-engine.pure';

// Re-export the entire pure surface so existing consumers keep working with
// the same import path (`@/services/condition-progression-engine`).
export * from './condition-progression-engine.pure';

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