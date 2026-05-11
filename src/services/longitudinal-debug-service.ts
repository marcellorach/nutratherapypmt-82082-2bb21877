/**
 * Longitudinal Debug & Evaluation Service
 *
 * Three roles:
 *  1. auditPetLongitudinalIntegrity(petId?) — verifies that consultations,
 *     conditions/medications/exams and is_latest are consistent.
 *  2. fetchLongitudinalDebug(petId, condition, profile) — calls the
 *     hybrid-recommendation edge function with debug:true and returns
 *     which CURRENT_STATE / CLINICAL_TRAJECTORY / DIET_PROFILE blocks
 *     were used.
 *  3. compareWithVsWithoutHistory(...) — runs the inference twice
 *     (full longitudinal context vs. stripped) and diffs the outputs.
 */

import { supabase } from '@/integrations/supabase/client';
import { buildLongitudinalContext } from './hybrid-recommendation-service';

export interface PetIntegrityRow {
  pet_id: string;
  pet_name: string;
  is_demo: boolean;
  consultations: number;
  has_is_latest: boolean;
  multiple_is_latest: boolean;
  latest_consultation_date: string | null;
  conditions_total: number;
  conditions_linked: number;
  medications_total: number;
  medications_linked: number;
  exams_total: number;
  exams_linked: number;
  nutrition_current: number;
  ok: boolean;
  warnings: string[];
}

export async function auditPetLongitudinalIntegrity(petId?: string): Promise<PetIntegrityRow[]> {
  let q = (supabase as any)
    .from('pet_profiles')
    .select(`
      id, name, is_demo,
      pet_consultations(id, consultation_date, is_latest),
      pet_conditions(id, consultation_id),
      pet_medications(id, consultation_id),
      pet_exams(id, consultation_id),
      pet_nutrition(id, is_current)
    `);
  if (petId) q = q.eq('id', petId);
  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((p: any): PetIntegrityRow => {
    const consults: any[] = p.pet_consultations ?? [];
    const latestFlags = consults.filter((c) => c.is_latest);
    const sortedDates = consults
      .map((c) => c.consultation_date)
      .filter(Boolean)
      .sort();
    const latestDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : null;
    const conditions: any[] = p.pet_conditions ?? [];
    const medications: any[] = p.pet_medications ?? [];
    const exams: any[] = p.pet_exams ?? [];
    const nutritionCurrent = (p.pet_nutrition ?? []).filter((n: any) => n.is_current).length;

    const condLinked = conditions.filter((c) => c.consultation_id).length;
    const medLinked = medications.filter((m) => m.consultation_id).length;
    const examLinked = exams.filter((e) => e.consultation_id).length;

    const warnings: string[] = [];
    if (consults.length === 0) warnings.push('Sem consultas registradas');
    if (consults.length > 0 && latestFlags.length === 0) warnings.push('Nenhuma consulta marcada como is_latest');
    if (latestFlags.length > 1) warnings.push(`is_latest marcado em ${latestFlags.length} consultas (esperado 1)`);
    if (conditions.length && condLinked < conditions.length) warnings.push(`${conditions.length - condLinked} condições sem consultation_id`);
    if (medications.length && medLinked < medications.length) warnings.push(`${medications.length - medLinked} medicações sem consultation_id`);
    if (exams.length && examLinked < exams.length) warnings.push(`${exams.length - examLinked} exames sem consultation_id`);
    if (nutritionCurrent === 0) warnings.push('Nenhuma dieta atual registrada (is_current)');
    if (nutritionCurrent > 1) warnings.push(`${nutritionCurrent} dietas marcadas como atuais simultaneamente`);

    return {
      pet_id: p.id,
      pet_name: p.name,
      is_demo: !!p.is_demo,
      consultations: consults.length,
      has_is_latest: latestFlags.length === 1,
      multiple_is_latest: latestFlags.length > 1,
      latest_consultation_date: latestDate,
      conditions_total: conditions.length,
      conditions_linked: condLinked,
      medications_total: medications.length,
      medications_linked: medLinked,
      exams_total: exams.length,
      exams_linked: examLinked,
      nutrition_current: nutritionCurrent,
      ok: warnings.length === 0,
      warnings,
    };
  });
}

export interface LongitudinalDebugBlocks {
  disabled: boolean;
  hasCurrentState: boolean;
  hasClinicalTrajectory: boolean;
  hasDietProfile: boolean;
  trajectoryEntries: number;
  latestConsultationDate: string | null;
  activeConditions: string[];
  abnormalExams: string[];
  dietProducts: string[];
}

export interface RecommendationRun {
  nutraceuticals: Array<{ name: string; dosage?: string; condition?: string; mechanism?: string }>;
  rationale: string;
  precautions: string[];
  debug?: { longitudinal: LongitudinalDebugBlocks; renderedContextBlock: string };
}

async function callEdgeFunction(args: {
  petId: string;
  condition: string;
  petProfile: { species?: string; breed?: string; age?: number; weight?: number };
  disableLongitudinal: boolean;
}): Promise<RecommendationRun> {
  const longitudinal = args.disableLongitudinal ? undefined : await buildLongitudinalContext(args.petId);
  const { data, error } = await supabase.functions.invoke('hybrid-recommendation', {
    body: {
      mode: 'fallback',
      petProfile: args.petProfile,
      condition: args.condition,
      clinicalContext: longitudinal,
      disableLongitudinal: args.disableLongitudinal,
      debug: true,
    },
  });
  if (error) throw error;
  return data as RecommendationRun;
}

export async function fetchLongitudinalDebug(
  petId: string,
  condition: string,
  petProfile: { species?: string; breed?: string; age?: number; weight?: number }
): Promise<RecommendationRun> {
  return callEdgeFunction({ petId, condition, petProfile, disableLongitudinal: false });
}

export interface ComparisonReport {
  withHistory: RecommendationRun;
  withoutHistory: RecommendationRun;
  diff: {
    addedCompounds: string[];      // present with history, absent without
    removedCompounds: string[];    // present without history, absent with
    sharedCompounds: string[];
    abnormalFlagsConsidered: { withHistory: number; withoutHistory: number };
    nutritionalGapMentions: { withHistory: number; withoutHistory: number };
    rationaleDeltaChars: number;
    precautionsDelta: number;
  };
}

const NUTRITIONAL_GAP_KEYWORDS = [
  'omega-3', 'ômega-3', 'omega 3', 'lacuna', 'déficit', 'deficit',
  'gap', 'fósforo', 'cálcio', 'antioxid', 'restrição', 'dieta', 'ração',
];

function countMatches(text: string, keywords: string[]): number {
  const lc = (text || '').toLowerCase();
  return keywords.reduce((acc, k) => acc + (lc.includes(k.toLowerCase()) ? 1 : 0), 0);
}

function compoundKey(name?: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export async function compareWithVsWithoutHistory(
  petId: string,
  condition: string,
  petProfile: { species?: string; breed?: string; age?: number; weight?: number }
): Promise<ComparisonReport> {
  const [withHistory, withoutHistory] = await Promise.all([
    callEdgeFunction({ petId, condition, petProfile, disableLongitudinal: false }),
    callEdgeFunction({ petId, condition, petProfile, disableLongitudinal: true }),
  ]);

  const wKeys = new Map(withHistory.nutraceuticals.map((n) => [compoundKey(n.name), n.name] as const));
  const woKeys = new Map(withoutHistory.nutraceuticals.map((n) => [compoundKey(n.name), n.name] as const));
  const added: string[] = [];
  const shared: string[] = [];
  const removed: string[] = [];
  for (const [k, name] of wKeys) (woKeys.has(k) ? shared : added).push(name);
  for (const [k, name] of woKeys) if (!wKeys.has(k)) removed.push(name);

  const flagsW = withHistory.debug?.longitudinal.abnormalExams.length ?? 0;
  const flagsWo = 0; // by definition the without-history run has no exam debug context

  const gapW = countMatches(`${withHistory.rationale} ${withHistory.precautions.join(' ')}`, NUTRITIONAL_GAP_KEYWORDS);
  const gapWo = countMatches(`${withoutHistory.rationale} ${withoutHistory.precautions.join(' ')}`, NUTRITIONAL_GAP_KEYWORDS);

  return {
    withHistory,
    withoutHistory,
    diff: {
      addedCompounds: added.sort(),
      removedCompounds: removed.sort(),
      sharedCompounds: shared.sort(),
      abnormalFlagsConsidered: { withHistory: flagsW, withoutHistory: flagsWo },
      nutritionalGapMentions: { withHistory: gapW, withoutHistory: gapWo },
      rationaleDeltaChars: Math.abs((withHistory.rationale?.length ?? 0) - (withoutHistory.rationale?.length ?? 0)),
      precautionsDelta: Math.abs((withHistory.precautions?.length ?? 0) - (withoutHistory.precautions?.length ?? 0)),
    },
  };
}