/**
 * Nutrition Gap Timeline
 * -----------------------------------------------------------------------------
 * Reconstrói a evolução longitudinal dos gaps nutricionais do pet ao longo de
 * todos os snapshots históricos de `pet_nutrition`. Usa o `analyzeNutritionGaps`
 * existente para cada snapshot, garantindo a mesma metodologia FEDIAF/AAFCO.
 *
 * Política No-Mock: se um snapshot não tem produtos linkados em
 * `pet_food_nutrition`, ele é incluído na timeline apenas como ponto
 * "sem dados", nunca com valores simulados.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  analyzeNutritionGaps,
  inferLifeStage,
  type PetNutritionContext,
  type NutrientGap,
} from './nutrition-gap-analyzer';

export interface GapTimelinePoint {
  snapshotId: string;
  date: string; // ISO date (started_at || created_at)
  dietType: string | null;
  productLabel: string | null;
  hasData: boolean;
  deficientCount: number;
  excessCount: number;
  adequateCount: number;
  gaps: NutrientGap[];
}

type Ctx = Omit<PetNutritionContext, 'life_stage' | 'nutritionId'>;

export async function getNutritionGapTimeline(ctx: Ctx): Promise<GapTimelinePoint[]> {
  // 1. lista todos os snapshots históricos do pet
  const { data: snapshots } = await (supabase as any)
    .from('pet_nutrition')
    .select('id, diet_type, started_at, created_at')
    .eq('pet_id', ctx.petId)
    .order('created_at', { ascending: true });

  if (!snapshots?.length) return [];

  // 2. label do primeiro produto de cada snapshot (apenas para tooltip)
  const ids = snapshots.map((s: any) => s.id);
  const { data: items } = await (supabase as any)
    .from('pet_nutrition_items')
    .select('nutrition_id, raw_brand_text, raw_product_text, share_percent')
    .in('nutrition_id', ids);
  const labelByNutrition = new Map<string, string>();
  for (const it of items ?? []) {
    if (labelByNutrition.has(it.nutrition_id)) continue;
    const txt = [it.raw_brand_text, it.raw_product_text].filter(Boolean).join(' — ');
    if (txt) labelByNutrition.set(it.nutrition_id, txt);
  }

  // 3. para cada snapshot, roda analisador
  const life_stage = inferLifeStage(ctx.age_years, ctx.breed_size ?? null);
  const points: GapTimelinePoint[] = [];
  for (const s of snapshots) {
    const res = await analyzeNutritionGaps({
      ...ctx,
      life_stage,
      nutritionId: s.id,
    } as PetNutritionContext);
    const def = res.gaps.filter((g) => g.status === 'deficient').length;
    const exc = res.gaps.filter((g) => g.status === 'excess').length;
    const adq = res.gaps.filter((g) => g.status === 'adequate').length;
    points.push({
      snapshotId: s.id,
      date: s.started_at ?? s.created_at,
      dietType: s.diet_type ?? null,
      productLabel: labelByNutrition.get(s.id) ?? null,
      hasData: res.has_data && !res.warnings.includes('no_linked_products'),
      deficientCount: def,
      excessCount: exc,
      adequateCount: adq,
      gaps: res.gaps,
    });
  }
  return points;
}
