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
    const { data, error } = await supabase.functions.invoke('hybrid-recommendation', {
      body: {
        mode: 'enrich',
        kgData,
        petProfile: params.petProfile,
        condition: params.targetCondition
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
    const { data, error } = await supabase.functions.invoke('hybrid-recommendation', {
      body: {
        mode: 'fallback',
        petProfile: params.petProfile,
        condition: params.targetCondition
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
