/**
 * Nutrition Gap Analyzer
 * -----------------------------------------------------------------------------
 * Compara o perfil nutricional ponderado da dieta atual do pet (com base em
 * `pet_food_nutrition` + share_percent dos `pet_nutrition_items`) contra os
 * mínimos/alvos das diretrizes internacionais (FEDIAF 2024 e AAFCO 2016) em
 * base de matéria seca (DM, dry matter) e ajustados por:
 *   - life_stage  (puppy / adult / senior)
 *   - peso vivo   (RER + MER factor)
 *   - condições clínicas atuais (OA, DRC, hepatopatia, obesidade, diabetes)
 *
 * Retorna uma lista de "deltas" (déficits/excessos) com justificativa textual
 * referenciando a fonte. NÃO altera dados — apenas analisa.
 *
 * Fontes:
 *  - FEDIAF Nutritional Guidelines for Complete and Complementary Pet Food for
 *    Cats and Dogs (2024). Tabela 2 — minimum recommended levels for adult dogs
 *    em base DM, energia de referência 3500 kcal/kg DM.
 *  - AAFCO Dog Food Nutrient Profiles (2016).
 *  - Bauer JJE. JAVMA 2011 (EPA+DHA em osteoartrite canina).
 *  - Roush JK et al. JAVMA 2010 (omega-3 em OA canina).
 *  - Polzin DJ. Vet Clin North Am 2011 (DRC: P ≤ 0.5% DM).
 *  - Center SA. Vet Clin North Am 2017 (hepatopatia: cobre restrito).
 */

import { supabase } from '@/integrations/supabase/client';

export type LifeStage = 'puppy' | 'adult' | 'senior';

export interface BreedPredispositionInput {
  condition_id?: string;
  condition_name: string;
  condition_name_en?: string | null;
  risk_factor: number;
  evidence_grade: 'high' | 'moderate' | 'low' | string;
}

export interface PetNutritionContext {
  petId: string;
  species: 'dog' | 'cat';
  weight_kg: number;
  age_years: number | null;
  life_stage: LifeStage;
  breed_size?: 'small' | 'medium' | 'large' | 'giant' | null;
  breed_name?: string | null;
  /** Nomes (PT ou EN) das condições ativas — usados para casar regras clínicas. */
  active_conditions: string[];
  /** Predisposições raciais (vindas de `breed_predispositions`). Opcional. */
  breed_predispositions?: BreedPredispositionInput[];
  /** Quando fornecido, força o analisador a usar este snapshot de `pet_nutrition`
   *  em vez do `is_current=true`. Necessário para análise histórica (timeline). */
  nutritionId?: string;
}

export interface NutrientTarget {
  /** Identificador interno do nutriente. */
  key: string;
  /** Rótulo exibido ao usuário. */
  label_pt: string;
  label_en: string;
  /** Unidade do alvo. */
  unit: '% DM' | 'g/1000kcal' | 'mg/kg DM' | 'ratio' | 'kcal/dia';
  /** Valor mínimo recomendado. */
  min?: number;
  /** Valor máximo aceitável (para nutrientes com teto). */
  max?: number;
  /** Justificativa + fonte. */
  rationale_pt: string;
  rationale_en: string;
  source: string;
}

export interface NutrientObserved {
  key: string;
  /** Valor calculado a partir da ração atual. */
  value: number | null;
}

export type GapStatus = 'deficient' | 'adequate' | 'excess' | 'unknown';

export interface NutrientGap {
  key: string;
  label_pt: string;
  label_en: string;
  unit: string;
  observed: number | null;
  target_min?: number;
  target_max?: number;
  status: GapStatus;
  /** Quão longe do alvo (negativo = déficit, positivo = excesso). */
  delta_pct?: number;
  rationale_pt: string;
  rationale_en: string;
  source: string;
}

export interface NutritionAnalysisResult {
  has_data: boolean;
  /** Receita-padrão FEDIAF 3500 kcal/kg DM. */
  reference_energy_kcal_per_kg_dm: number;
  /** RER + MER esperado para o pet. */
  daily_kcal_target: number;
  /** Energia da dieta atual ponderada (kcal/kg as-fed). */
  current_kcal_per_kg: number | null;
  /** Quantidade diária consumida (g) declarada pelo tutor. */
  current_daily_g: number | null;
  /** kcal/dia consumidos calculados. */
  current_daily_kcal: number | null;
  observed: Record<string, number | null>;
  targets: NutrientTarget[];
  gaps: NutrientGap[];
  /** Avisos qualitativos não numéricos (ex.: "dieta sem AAFCO statement"). */
  warnings: string[];
  /** Recomendações preventivas baseadas em predisposições raciais. */
  breed_recommendations: BreedNutritionRecommendation[];
}

export interface BreedNutritionRecommendation {
  condition_name: string;
  condition_name_en?: string | null;
  risk_factor: number;
  evidence_grade: string;
  /** Já presente nas condições ativas do pet? (para evitar duplicação visual) */
  already_active: boolean;
  /** Alvos nutricionais recomendados para esta condição. */
  targets: NutrientTarget[];
  /** Gaps observados quando comparados à dieta atual (mesmo formato de `gaps`). */
  gaps: NutrientGap[];
}

// -----------------------------------------------------------------------------
// 1. Alvos base — FEDIAF 2024 cães adultos, em % DM (energia de referência
//    3500 kcal/kg DM). Para puppies/seniors aplicamos modificadores adiante.
// -----------------------------------------------------------------------------
const FEDIAF_DOG_ADULT: NutrientTarget[] = [
  {
    key: 'protein_pct',
    label_pt: 'Proteína bruta',
    label_en: 'Crude protein',
    unit: '% DM',
    min: 18,
    rationale_pt: 'Mínimo FEDIAF para cães adultos é 18% PB em matéria seca (energia 3500 kcal/kg DM).',
    rationale_en: 'FEDIAF minimum for adult dogs is 18% crude protein on dry matter basis.',
    source: 'FEDIAF 2024 — Table II',
  },
  {
    key: 'fat_pct',
    label_pt: 'Gordura bruta',
    label_en: 'Crude fat',
    unit: '% DM',
    min: 5.5,
    rationale_pt: 'FEDIAF: mínimo 5,5% de gordura em DM para fornecer ácidos graxos essenciais e energia.',
    rationale_en: 'FEDIAF minimum 5.5% fat (DM) to supply essential fatty acids and energy.',
    source: 'FEDIAF 2024 — Table II',
  },
  {
    key: 'calcium_pct',
    label_pt: 'Cálcio',
    label_en: 'Calcium',
    unit: '% DM',
    min: 0.5,
    max: 2.5,
    rationale_pt: 'FEDIAF cães adultos: 0,5–2,5% Ca em DM. Excesso compete com Zn/Cu.',
    rationale_en: 'FEDIAF adult dogs: 0.5–2.5% Ca on DM basis. Excess interferes with Zn/Cu absorption.',
    source: 'FEDIAF 2024 — Table II',
  },
  {
    key: 'phosphorus_pct',
    label_pt: 'Fósforo',
    label_en: 'Phosphorus',
    unit: '% DM',
    min: 0.4,
    max: 1.6,
    rationale_pt: 'FEDIAF cães adultos: 0,4–1,6% P em DM.',
    rationale_en: 'FEDIAF adult dogs: 0.4–1.6% P on DM basis.',
    source: 'FEDIAF 2024 — Table II',
  },
  {
    key: 'ca_p_ratio',
    label_pt: 'Razão Ca:P',
    label_en: 'Ca:P ratio',
    unit: 'ratio',
    min: 1.0,
    max: 2.0,
    rationale_pt: 'Razão Ca:P recomendada 1:1 a 2:1 para cães adultos (FEDIAF/AAFCO).',
    rationale_en: 'Recommended Ca:P ratio 1:1 to 2:1 for adult dogs (FEDIAF/AAFCO).',
    source: 'FEDIAF 2024 / AAFCO 2016',
  },
  {
    key: 'epa_dha_pct',
    label_pt: 'EPA + DHA',
    label_en: 'EPA + DHA',
    unit: '% DM',
    min: 0.05,
    rationale_pt: 'FEDIAF cães adultos: mínimo combinado de EPA+DHA = 0,05% DM (~0,14 g/1000 kcal).',
    rationale_en: 'FEDIAF adult dogs: minimum combined EPA+DHA = 0.05% DM (~0.14 g/1000 kcal).',
    source: 'FEDIAF 2024 — Table II',
  },
];

// -----------------------------------------------------------------------------
// 2. Modificadores por condição clínica (somam/sobrescrevem mins/maxs).
// -----------------------------------------------------------------------------
interface ConditionRule {
  /** Padrões (PT/EN) que casam com o nome da condição. Lower-case substring. */
  match: string[];
  override: NutrientTarget[];
}

const CONDITION_RULES: ConditionRule[] = [
  // Osteoartrite / displasia
  {
    match: ['osteoart', 'arthritis', 'displasia', 'dysplasia', 'articular'],
    override: [
      {
        key: 'epa_dha_pct',
        label_pt: 'EPA + DHA (alvo OA)',
        label_en: 'EPA + DHA (OA target)',
        unit: '% DM',
        min: 0.35,
        rationale_pt: 'Em osteoartrite canina, ensaios clínicos (Roush 2010; Bauer 2011) mostram benefício com 0,35–0,6 g/100 g DM de EPA+DHA — ~7× o mínimo FEDIAF.',
        rationale_en: 'In canine OA, clinical trials (Roush 2010; Bauer 2011) show benefit with 0.35–0.6% DM EPA+DHA — ~7× FEDIAF minimum.',
        source: 'Roush JAVMA 2010; Bauer JAVMA 2011',
      },
      {
        key: 'glucosamine_mg_per_kg',
        label_pt: 'Glucosamina',
        label_en: 'Glucosamine',
        unit: 'mg/kg DM',
        min: 800,
        rationale_pt: 'Dietas terapêuticas para mobilidade (Hill\'s j/d, Royal Canin Mobility) entregam ≥ 800 mg/kg de glucosamina.',
        rationale_en: 'Mobility prescription diets (Hill\'s j/d, Royal Canin Mobility) deliver ≥ 800 mg/kg glucosamine.',
        source: 'Hill\'s j/d label; Royal Canin Mobility label',
      },
    ],
  },
  // Doença renal crônica (DRC)
  {
    match: ['renal', 'kidney', 'drc', 'ckd', 'rim'],
    override: [
      {
        key: 'phosphorus_pct',
        label_pt: 'Fósforo (DRC)',
        label_en: 'Phosphorus (CKD)',
        unit: '% DM',
        max: 0.5,
        rationale_pt: 'IRIS/Polzin: em DRC estágio ≥ 2, restringir P para ≤ 0,5% DM atrasa progressão e reduz mineralização extra-óssea.',
        rationale_en: 'IRIS/Polzin: in CKD stage ≥ 2, restrict P to ≤ 0.5% DM to slow progression and reduce extra-osseous mineralization.',
        source: 'Polzin Vet Clin NA 2011; IRIS Guidelines',
      },
      {
        key: 'protein_pct',
        label_pt: 'Proteína (DRC)',
        label_en: 'Protein (CKD)',
        unit: '% DM',
        min: 14,
        max: 22,
        rationale_pt: 'Dieta renal canina: 14–22% PB DM (alta qualidade) reduz produção de uremia mantendo massa muscular.',
        rationale_en: 'Canine renal diet: 14–22% CP DM (high biological value) lowers uremia while preserving lean mass.',
        source: 'Hill\'s k/d / Royal Canin Renal labels',
      },
    ],
  },
  // Hepatopatia
  {
    match: ['hepat', 'liver', 'hepático', 'hepatic'],
    override: [
      {
        key: 'protein_pct',
        label_pt: 'Proteína (hepático)',
        label_en: 'Protein (hepatic)',
        unit: '% DM',
        min: 16,
        max: 22,
        rationale_pt: 'Dieta hepática canina restringe proteína moderadamente (16–22% DM) com fontes de alta digestibilidade para reduzir amônia portal.',
        rationale_en: 'Canine hepatic diet moderates protein (16–22% DM) using highly digestible sources to lower portal ammonia.',
        source: 'Center Vet Clin NA 2017; Hill\'s l/d label',
      },
    ],
  },
  // Obesidade / sobrepeso
  {
    match: ['obesi', 'overweight', 'sobrepeso'],
    override: [
      {
        key: 'fat_pct',
        label_pt: 'Gordura (controle de peso)',
        label_en: 'Fat (weight control)',
        unit: '% DM',
        max: 10,
        rationale_pt: 'Dietas de redução de peso canina mantêm gordura ≤ 10% DM e densidade energética baixa (< 3400 kcal/kg).',
        rationale_en: 'Canine weight-loss diets keep fat ≤ 10% DM and energy density low (< 3400 kcal/kg).',
        source: 'Hill\'s Metabolic / Royal Canin Satiety labels',
      },
    ],
  },
  // Diabetes
  {
    match: ['diabet'],
    override: [
      {
        key: 'fiber_pct',
        label_pt: 'Fibra bruta (diabético)',
        label_en: 'Crude fiber (diabetic)',
        unit: '% DM',
        min: 7,
        rationale_pt: 'Dieta diabética canina: fibra ≥ 7% DM melhora controle glicêmico pós-prandial.',
        rationale_en: 'Canine diabetic diet: fiber ≥ 7% DM improves postprandial glycemic control.',
        source: 'Hill\'s w/d label; Royal Canin Diabetic',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 3. Cálculo de necessidade energética (RER + MER).
// -----------------------------------------------------------------------------
function dailyKcalTarget(weight_kg: number, life_stage: LifeStage, hasObesity: boolean): number {
  const RER = 70 * Math.pow(Math.max(weight_kg, 0.1), 0.75);
  let factor: number;
  if (life_stage === 'puppy') factor = 2.5;
  else if (life_stage === 'senior') factor = 1.4;
  else factor = 1.6; // adult, neutered ~1.6
  if (hasObesity) factor = 1.0; // weight loss = RER only
  return Math.round(RER * factor);
}

function inferLifeStage(age_years: number | null, breed_size?: PetNutritionContext['breed_size']): LifeStage {
  if (age_years == null) return 'adult';
  if (age_years < 1) return 'puppy';
  // Senior threshold by size (FEDIAF guidance)
  const seniorAge =
    breed_size === 'giant' ? 6 :
    breed_size === 'large' ? 7 :
    breed_size === 'medium' ? 8 : 9;
  return age_years >= seniorAge ? 'senior' : 'adult';
}

// -----------------------------------------------------------------------------
// 4. Resolve alvos finais aplicando overrides clínicos por chave.
// -----------------------------------------------------------------------------
function resolveTargets(ctx: PetNutritionContext): NutrientTarget[] {
  const byKey = new Map<string, NutrientTarget>();
  for (const t of FEDIAF_DOG_ADULT) byKey.set(t.key, { ...t });

  // Puppy: protein min sobe para 22.5% (FEDIAF growth)
  if (ctx.life_stage === 'puppy') {
    byKey.set('protein_pct', {
      ...byKey.get('protein_pct')!,
      min: 22.5,
      label_pt: 'Proteína bruta (filhote)',
      label_en: 'Crude protein (puppy)',
      rationale_pt: 'FEDIAF growth: filhotes precisam de mínimo 22,5% PB DM (energia 3500 kcal/kg DM).',
      rationale_en: 'FEDIAF growth: puppies require minimum 22.5% CP DM (3500 kcal/kg DM reference).',
    });
  }

  const lcConditions = ctx.active_conditions.map((c) => c.toLowerCase());
  for (const rule of CONDITION_RULES) {
    const hit = rule.match.some((m) => lcConditions.some((c) => c.includes(m)));
    if (!hit) continue;
    for (const o of rule.override) byKey.set(o.key, { ...o });
  }
  return Array.from(byKey.values());
}

/** Retorna a regra clínica que casa com um nome de condição (PT/EN), ou null. */
function findRuleForCondition(name: string): ConditionRule | null {
  const lc = name.toLowerCase();
  for (const rule of CONDITION_RULES) {
    if (rule.match.some((m) => lc.includes(m))) return rule;
  }
  return null;
}

/**
 * Para cada predisposição racial, encontra a regra clínica correspondente e
 * deriva alvos nutricionais preventivos + gaps observados na dieta atual.
 */
function buildBreedRecommendations(
  predispositions: BreedPredispositionInput[] | undefined,
  active_conditions: string[],
  observed: Record<string, number | null>,
): BreedNutritionRecommendation[] {
  if (!predispositions || predispositions.length === 0) return [];
  const lcActive = active_conditions.map((c) => c.toLowerCase());
  const out: BreedNutritionRecommendation[] = [];
  for (const p of predispositions) {
    const rule =
      findRuleForCondition(p.condition_name) ||
      (p.condition_name_en ? findRuleForCondition(p.condition_name_en) : null);
    if (!rule) continue; // sem regra nutricional aplicável
    const already_active = rule.match.some((m) => lcActive.some((c) => c.includes(m)));
    const targets = rule.override.map((t) => ({ ...t }));
    const gaps: NutrientGap[] = targets.map((t) => {
      const obs = observed[t.key] ?? null;
      let status: GapStatus = 'unknown';
      let delta_pct: number | undefined;
      if (obs != null) {
        if (t.min != null && obs < t.min) {
          status = 'deficient';
          delta_pct = Number((((obs - t.min) / t.min) * 100).toFixed(1));
        } else if (t.max != null && obs > t.max) {
          status = 'excess';
          delta_pct = Number((((obs - t.max) / t.max) * 100).toFixed(1));
        } else {
          status = 'adequate';
          delta_pct = 0;
        }
      }
      return {
        key: t.key,
        label_pt: t.label_pt,
        label_en: t.label_en,
        unit: t.unit,
        observed: obs,
        target_min: t.min,
        target_max: t.max,
        status,
        delta_pct,
        rationale_pt: t.rationale_pt,
        rationale_en: t.rationale_en,
        source: t.source,
      };
    });
    out.push({
      condition_name: p.condition_name,
      condition_name_en: p.condition_name_en,
      risk_factor: p.risk_factor,
      evidence_grade: p.evidence_grade,
      already_active,
      targets,
      gaps,
    });
  }
  // Ordena por: déficit > sem dado > adequado, e dentro disso por risk_factor desc
  const score = (r: BreedNutritionRecommendation) =>
    r.gaps.some((g) => g.status === 'deficient' || g.status === 'excess') ? 2 :
    r.gaps.some((g) => g.status === 'unknown') ? 1 : 0;
  return out.sort((a, b) => score(b) - score(a) || b.risk_factor - a.risk_factor);
}

// -----------------------------------------------------------------------------
// 5. Conversão as-fed → DM. moisture_pct opcional; padrão 10% (kibble seco).
// -----------------------------------------------------------------------------
function toDM(value_pct: number | null, moisture_pct: number | null): number | null {
  if (value_pct == null) return null;
  const moist = moisture_pct ?? 10;
  const dm_fraction = (100 - moist) / 100;
  if (dm_fraction <= 0) return null;
  return Number((value_pct / dm_fraction).toFixed(3));
}

// -----------------------------------------------------------------------------
// 6. Análise principal.
// -----------------------------------------------------------------------------
export async function analyzeNutritionGaps(ctx: PetNutritionContext): Promise<NutritionAnalysisResult> {
  const reference_energy_kcal_per_kg_dm = 3500;
  const hasObesity = ctx.active_conditions.some((c) => /obesi|overweight|sobrepeso/i.test(c));
  const daily_kcal_target = dailyKcalTarget(ctx.weight_kg, ctx.life_stage, hasObesity);
  const targets = resolveTargets(ctx);

  // 6.1 — busca dieta atual
  const { data: nutritions } = await (supabase as any)
    .from('pet_nutrition')
    .select('id, daily_amount_g, is_current')
    .eq('pet_id', ctx.petId)
    .order('created_at', { ascending: false });
  const current = (nutritions ?? []).find((n: any) => n.is_current) ?? (nutritions ?? [])[0];

  if (!current) {
    return {
      has_data: false,
      reference_energy_kcal_per_kg_dm,
      daily_kcal_target,
      current_kcal_per_kg: null,
      current_daily_g: null,
      current_daily_kcal: null,
      observed: {},
      targets,
      gaps: [],
      warnings: ['no_current_nutrition'],
      breed_recommendations: buildBreedRecommendations(ctx.breed_predispositions, ctx.active_conditions, {}),
    };
  }

  const { data: items } = await (supabase as any)
    .from('pet_nutrition_items')
    .select('id, share_percent, product_id')
    .eq('nutrition_id', current.id);

  const linked = (items ?? []).filter((it: any) => !!it.product_id);
  const warnings: string[] = [];
  if (linked.length === 0) warnings.push('no_linked_products');

  // 6.2 — busca composição nutricional dos produtos linkados (revisão mais recente)
  const productIds = linked.map((it: any) => it.product_id);
  let nutritionByProduct = new Map<string, any>();
  if (productIds.length > 0) {
    const { data: nutriRows } = await (supabase as any)
      .from('pet_food_nutrition')
      .select('*')
      .in('product_id', productIds)
      .order('revision', { ascending: false });
    for (const row of nutriRows ?? []) {
      if (!nutritionByProduct.has(row.product_id)) nutritionByProduct.set(row.product_id, row);
    }
  }

  // 6.3 — pondera nutrientes por share_percent (default igual se ausente)
  const totalShare = linked.reduce((s: number, it: any) => s + (Number(it.share_percent) || 0), 0);
  const useEqual = totalShare === 0;
  const equalShare = linked.length > 0 ? 100 / linked.length : 0;

  const nutrientKeys = [
    'protein_pct', 'fat_pct', 'fiber_pct', 'moisture_pct', 'calcium_pct',
    'phosphorus_pct', 'omega3_pct', 'omega6_pct', 'epa_dha_pct',
    'glucosamine_mg_per_kg', 'kcal_per_kg',
  ];

  const observedAsFed: Record<string, number | null> = {};
  for (const k of nutrientKeys) {
    let weightedSum = 0;
    let weightUsed = 0;
    for (const it of linked) {
      const row = nutritionByProduct.get(it.product_id);
      if (!row || row[k] == null) continue;
      const w = useEqual ? equalShare : (Number(it.share_percent) || 0);
      if (w <= 0) continue;
      weightedSum += Number(row[k]) * w;
      weightUsed += w;
    }
    observedAsFed[k] = weightUsed > 0 ? Number((weightedSum / weightUsed).toFixed(3)) : null;
  }

  // 6.4 — converte para DM (exceto kcal e razões)
  const moisture = observedAsFed.moisture_pct ?? 10;
  const observed: Record<string, number | null> = {};
  for (const k of nutrientKeys) {
    if (k === 'kcal_per_kg' || k === 'moisture_pct') {
      observed[k] = observedAsFed[k];
    } else if (k === 'glucosamine_mg_per_kg') {
      observed[k] = observedAsFed[k]; // já é mg/kg
    } else {
      observed[k] = toDM(observedAsFed[k], moisture);
    }
  }
  // Ca:P ratio
  if (observed.calcium_pct != null && observed.phosphorus_pct && observed.phosphorus_pct > 0) {
    observed.ca_p_ratio = Number((observed.calcium_pct / observed.phosphorus_pct).toFixed(2));
  } else {
    observed.ca_p_ratio = null;
  }

  const current_kcal_per_kg = observedAsFed.kcal_per_kg ?? null;
  const current_daily_g = current.daily_amount_g != null ? Number(current.daily_amount_g) : null;
  const current_daily_kcal =
    current_kcal_per_kg != null && current_daily_g != null
      ? Math.round((current_kcal_per_kg * current_daily_g) / 1000)
      : null;

  // 6.5 — calcula gaps
  const gaps: NutrientGap[] = targets.map((t) => {
    const obs = observed[t.key] ?? null;
    let status: GapStatus = 'unknown';
    let delta_pct: number | undefined;
    if (obs == null) {
      status = 'unknown';
    } else {
      if (t.min != null && obs < t.min) {
        status = 'deficient';
        delta_pct = Number((((obs - t.min) / t.min) * 100).toFixed(1));
      } else if (t.max != null && obs > t.max) {
        status = 'excess';
        delta_pct = Number((((obs - t.max) / t.max) * 100).toFixed(1));
      } else {
        status = 'adequate';
        delta_pct = 0;
      }
    }
    return {
      key: t.key,
      label_pt: t.label_pt,
      label_en: t.label_en,
      unit: t.unit,
      observed: obs,
      target_min: t.min,
      target_max: t.max,
      status,
      delta_pct,
      rationale_pt: t.rationale_pt,
      rationale_en: t.rationale_en,
      source: t.source,
    };
  });

  // 6.6 — energia
  if (current_daily_kcal != null) {
    const ratio = current_daily_kcal / daily_kcal_target;
    if (ratio < 0.85) warnings.push('underfeeding');
    else if (ratio > 1.15) warnings.push('overfeeding');
  }

  return {
    has_data: linked.length > 0 && Object.values(observed).some((v) => v != null),
    reference_energy_kcal_per_kg_dm,
    daily_kcal_target,
    current_kcal_per_kg,
    current_daily_g,
    current_daily_kcal,
    observed,
    targets,
    gaps,
    warnings,
    breed_recommendations: buildBreedRecommendations(ctx.breed_predispositions, ctx.active_conditions, observed),
  };
}

export { inferLifeStage };
