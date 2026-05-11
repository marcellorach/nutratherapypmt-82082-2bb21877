/**
 * Hybrid Recommendation Service
 * 
 * Orchestrates recommendations based on confidence levels:
 * - High/Medium: Use only KG data
 * - Low: Use KG data enriched by LLM with warning
 * - Insufficient: Full LLM fallback with strong disclaimer
 */

import { supabase } from '@/integrations/supabase/client';
import {
  RecommendationConfidence,
  HybridRecommendationResult,
  RecommendationSource,
  DisclaimerType,
  ConfidenceCalculationParams
} from '@/types/recommendation-confidence';
import { computeRecommendationConfidence } from './recommendation-confidence-service';

interface NutraceuticalRecommendation {
  name: string;
  dosage: string;
  mechanism: string;
  evidenceLevel: string;
}

interface KGRecommendation {
  nutraceuticals: NutraceuticalRecommendation[];
  rationale: string;
  precautions: string[];
}

/**
 * Builds the longitudinal clinical context (CURRENT_STATE / CLINICAL_TRAJECTORY
 * / DIET_PROFILE) for the MedGraphRAG prompt by querying pet_consultations,
 * the linked conditions/medications/exams, and pet_nutrition.
 *
 * Latest consultation has weight 1.0; previous ones are summarized with
 * weight 0.4. Returns undefined when petId is not provided.
 */
export async function buildLongitudinalContext(petId?: string) {
  if (!petId) return undefined;
  try {
    const [{ data: consults }, { data: nutrition }] = await Promise.all([
      (supabase as any)
        .from('pet_consultations')
        .select('id, consultation_date, chief_complaint, assessment, plan, weight_kg_at_visit, body_condition_score, is_latest')
        .eq('pet_id', petId)
        .order('consultation_date', { ascending: false }),
      (supabase as any)
        .from('pet_nutrition')
        .select('id, diet_type, daily_amount_g, meals_per_day, restrictions, notes, is_current, pet_nutrition_items(raw_brand_text, raw_product_text, share_percent)')
        .eq('pet_id', petId)
        .eq('is_current', true)
        .maybeSingle(),
    ]);

    if (!consults?.length && !nutrition) return undefined;

    // Pull conditions/meds/exams keyed by consultation_id in batch
    const consultIds = (consults || []).map((c: any) => c.id);
    const [condRes, medRes, examRes] = await Promise.all([
      consultIds.length
        ? (supabase as any).from('pet_conditions').select('consultation_id, condition_name, severity, status').in('consultation_id', consultIds)
        : Promise.resolve({ data: [] }),
      consultIds.length
        ? (supabase as any).from('pet_medications').select('consultation_id, medication_name, dosage, frequency, status').in('consultation_id', consultIds)
        : Promise.resolve({ data: [] }),
      consultIds.length
        ? (supabase as any).from('pet_exams').select('consultation_id, exam_type, flags_abnormal, results').in('consultation_id', consultIds)
        : Promise.resolve({ data: [] }),
    ]);

    const byConsult = <T extends { consultation_id?: string | null }>(arr: T[] | null | undefined) =>
      (arr || []).reduce<Record<string, T[]>>((acc, row) => {
        const k = row.consultation_id || '_';
        (acc[k] ||= []).push(row);
        return acc;
      }, {});
    const condMap = byConsult(condRes.data);
    const medMap = byConsult(medRes.data);
    const examMap = byConsult(examRes.data);

    const latest = (consults || []).find((c: any) => c.is_latest) || (consults || [])[0];
    let latestConsultation;
    if (latest) {
      const condList = (condMap[latest.id] || []).filter((c: any) => c.status === 'active' || c.status === 'monitoring');
      const medList = (medMap[latest.id] || []).filter((m: any) => !m.status || m.status === 'active');
      const examList = examMap[latest.id] || [];
      latestConsultation = {
        date: latest.consultation_date,
        chief_complaint: latest.chief_complaint,
        assessment: latest.assessment,
        plan: latest.plan,
        weight_kg: latest.weight_kg_at_visit,
        bcs: latest.body_condition_score,
        activeConditions: condList.map((c: any) => `${c.condition_name} (${c.severity})`),
        activeMedications: medList.map((m: any) => `${m.medication_name} ${m.dosage} ${m.frequency}`),
        abnormalExams: examList
          .filter((e: any) => e.flags_abnormal?.length)
          .map((e: any) => `${e.exam_type}: ${(e.flags_abnormal || []).join(', ')}`),
      };
    }

    const trajectory = (consults || [])
      .filter((c: any) => c.id !== latest?.id)
      .slice(0, 6)
      .map((c: any) => {
        const conds = (condMap[c.id] || []).map((x: any) => `${x.condition_name}(${x.status})`);
        const meds = (medMap[c.id] || []).map((x: any) => `${x.medication_name} ${x.dosage}`);
        const exams = (examMap[c.id] || [])
          .filter((e: any) => e.flags_abnormal?.length)
          .map((e: any) => `${e.exam_type}: ${(e.flags_abnormal || []).join(',')}`);
        const daysAgo = Math.round((Date.now() - new Date(c.consultation_date).getTime()) / 86400000);
        return {
          date: c.consultation_date,
          daysAgo,
          summary: c.assessment || c.chief_complaint || '(no summary)',
          conditionsChanged: conds,
          medicationsChanged: meds,
          keyExamFindings: exams,
        };
      });

    let dietProfile;
    if (nutrition) {
      const items = (nutrition.pet_nutrition_items || []).map((i: any) =>
        `${i.raw_brand_text || '?'} - ${i.raw_product_text || '?'} (${i.share_percent || 100}%)`);
      dietProfile = {
        diet_type: nutrition.diet_type,
        daily_amount_g: nutrition.daily_amount_g,
        meals_per_day: nutrition.meals_per_day,
        restrictions: nutrition.restrictions,
        products: items,
        notes: nutrition.notes,
      };
    }

    return { latestConsultation, clinicalTrajectory: trajectory, dietProfile };
  } catch (err) {
    console.warn('buildLongitudinalContext failed', err);
    return undefined;
  }
}

/**
 * Get recommendations from Knowledge Graph only
 */
async function getKGRecommendation(
  params: ConfidenceCalculationParams
): Promise<KGRecommendation> {
  const { targetCondition, petProfile } = params;

  try {
    // Query triplets for nutraceuticals that treat this condition
    const { data: triplets, error } = await supabase
      .from('triplet_extractions')
      .select(`
        id,
        subject_name,
        subject_type,
        predicate,
        object_name,
        extraction_confidence,
        evidence_level,
        dose_range
      `)
      .or(`object_name.ilike.%${targetCondition}%`)
      .in('predicate', ['TREATS', 'AMELIORATES', 'PREVENTS', 'SUPPORTS', 'MODULATES'])
      .eq('curation_status', 'approved')
      .order('extraction_confidence', { ascending: false })
      .limit(10);

    if (error) throw error;

    const nutraceuticals: NutraceuticalRecommendation[] = (triplets || [])
      .filter(t => t.subject_type?.toLowerCase().includes('nutraceutical') || 
                   t.subject_type?.toLowerCase().includes('compound'))
      .map(t => {
        const doseRange = t.dose_range as { min?: string; max?: string; unit?: string } | null;
        return {
          name: t.subject_name,
          dosage: doseRange ? 
            `${doseRange.min || '?'}-${doseRange.max || '?'} ${doseRange.unit || ''}`.trim() : 
            'Consultar veterinário',
          mechanism: `${t.predicate} ${t.object_name}`,
          evidenceLevel: t.evidence_level || 'unknown'
        };
      });

    // Get contraindications
    const precautions: string[] = [];
    if (petProfile.age && petProfile.age < 1) {
      precautions.push('Paciente jovem: ajustar dosagem');
    }
    if (petProfile.age && petProfile.age > 10) {
      precautions.push('Paciente geriátrico: monitorar função hepática e renal');
    }

    return {
      nutraceuticals,
      rationale: `Recomendação baseada em ${nutraceuticals.length} nutracêuticos com evidência no Knowledge Graph para ${targetCondition}.`,
      precautions
    };
  } catch (error) {
    console.error('Error getting KG recommendation:', error);
    return {
      nutraceuticals: [],
      rationale: 'Erro ao consultar Knowledge Graph.',
      precautions: []
    };
  }
}

/**
 * Get LLM enrichment for low-confidence recommendations
 */
async function getLLMEnrichment(
  kgData: KGRecommendation,
  params: ConfidenceCalculationParams
): Promise<string> {
  try {
    const longitudinal = await buildLongitudinalContext(params.petId);
    const { data, error } = await supabase.functions.invoke('hybrid-recommendation', {
      body: {
        mode: 'enrich',
        kgData,
        petProfile: params.petProfile,
        condition: params.targetCondition,
        clinicalContext: longitudinal,
      }
    });

    if (error) throw error;
    return data?.enrichment || '';
  } catch (error) {
    console.error('Error getting LLM enrichment:', error);
    return '';
  }
}

/**
 * Get full LLM recommendation when KG has insufficient data
 */
async function getLLMRecommendation(
  params: ConfidenceCalculationParams
): Promise<KGRecommendation> {
  try {
    const longitudinal = await buildLongitudinalContext(params.petId);
    const { data, error } = await supabase.functions.invoke('hybrid-recommendation', {
      body: {
        mode: 'fallback',
        petProfile: params.petProfile,
        condition: params.targetCondition,
        clinicalContext: longitudinal,
      }
    });

    if (error) throw error;

    return {
      nutraceuticals: data?.nutraceuticals || [],
      rationale: data?.rationale || 'Recomendação gerada por IA com base em conhecimento geral.',
      precautions: data?.precautions || [
        'Esta recomendação requer validação por veterinário',
        'Iniciar com doses conservadoras',
        'Monitorar reações de perto'
      ]
    };
  } catch (error) {
    console.error('Error getting LLM recommendation:', error);
    return {
      nutraceuticals: [],
      rationale: 'Erro ao gerar recomendação. Por favor, consulte um veterinário.',
      precautions: ['Consultar veterinário antes de qualquer suplementação']
    };
  }
}

/**
 * Merge KG data with LLM enrichment
 */
function mergeRecommendations(
  kgData: KGRecommendation,
  llmEnrichment: string
): KGRecommendation {
  return {
    ...kgData,
    rationale: `${kgData.rationale}\n\nConsiderações adicionais: ${llmEnrichment}`,
    precautions: [
      ...kgData.precautions,
      'Alguns dados foram enriquecidos por IA - verificar com veterinário'
    ]
  };
}

/**
 * Determine recommendation source based on confidence
 */
function determineSource(confidence: RecommendationConfidence): RecommendationSource {
  if (confidence.confidenceLevel === 'high' || confidence.confidenceLevel === 'medium') {
    return 'knowledge_graph';
  }
  if (confidence.confidenceLevel === 'low') {
    return 'hybrid';
  }
  return 'llm_fallback';
}

/**
 * Determine disclaimer type based on source
 */
function determineDisclaimer(source: RecommendationSource): DisclaimerType {
  if (source === 'knowledge_graph') return 'none';
  if (source === 'hybrid') return 'low_confidence';
  return 'no_kg_data';
}

/**
 * Log recommendation to database
 */
async function logRecommendation(
  params: ConfidenceCalculationParams,
  result: HybridRecommendationResult,
  tripletIds: string[],
  studyIds: string[]
): Promise<void> {
  try {
    await supabase.from('recommendation_logs').insert({
      condition_id: params.conditionId,
      confidence_overall: result.confidence.overall,
      confidence_level: result.confidence.confidenceLevel,
      kg_coverage_score: result.confidence.kgCoverage.score,
      evidence_quality_score: result.confidence.evidenceQuality.score,
      data_freshness_score: result.confidence.dataFreshness.score,
      recommendation_source: result.source,
      triplets_used: tripletIds,
      studies_referenced: studyIds,
      recommendation_data: result.recommendation,
      disclaimer_shown: result.disclaimer,
      warnings: result.confidence.warnings,
      rationale: result.confidence.rationale
    });
  } catch (error) {
    console.error('Error logging recommendation:', error);
  }
}

/**
 * Main function to get hybrid recommendation
 */
export async function getHybridRecommendation(
  params: ConfidenceCalculationParams
): Promise<HybridRecommendationResult> {
  // 1. Calculate confidence
  const { confidence, triplets, studies } = await computeRecommendationConfidence(params);
  
  // 2. Determine source and get recommendation
  const source = determineSource(confidence);
  let recommendation: KGRecommendation;
  let llmEnrichment: string | undefined;

  if (source === 'knowledge_graph') {
    // Use only KG data
    recommendation = await getKGRecommendation(params);
  } else if (source === 'hybrid') {
    // Use KG + LLM enrichment
    const kgData = await getKGRecommendation(params);
    llmEnrichment = await getLLMEnrichment(kgData, params);
    recommendation = mergeRecommendations(kgData, llmEnrichment);
  } else {
    // Full LLM fallback
    recommendation = await getLLMRecommendation(params);
    llmEnrichment = recommendation.rationale;
  }

  const result: HybridRecommendationResult = {
    source,
    confidence,
    recommendation,
    disclaimer: determineDisclaimer(source),
    llmEnrichment
  };

  // 3. Log recommendation
  await logRecommendation(
    params,
    result,
    triplets.map(t => t.id),
    studies.map(s => s.id)
  );

  return result;
}

/**
 * Hook-friendly function for React components
 */
export function useHybridRecommendation() {
  const getRecommendation = async (params: ConfidenceCalculationParams) => {
    return getHybridRecommendation(params);
  };

  const calculateConfidence = async (params: ConfidenceCalculationParams) => {
    return computeRecommendationConfidence(params);
  };

  return {
    getRecommendation,
    calculateConfidence
  };
}
