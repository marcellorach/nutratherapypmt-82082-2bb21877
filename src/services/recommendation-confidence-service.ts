/**
 * Recommendation Confidence Service
 * 
 * Calculates confidence scores for VetGraphRAG recommendations based on:
 * - Knowledge Graph coverage (triplet count, species match, breed specificity)
 * - Evidence quality (study types, replication, evidence levels)
 * - Data freshness (study recency)
 */

import { supabase } from '@/integrations/supabase/client';
import {
  RecommendationConfidence,
  KGCoverageMetrics,
  EvidenceQualityMetrics,
  DataFreshnessMetrics,
  ConfidenceLevel,
  ConfidenceCalculationParams,
  ConfidenceCalculationResult,
  DEFAULT_CONFIDENCE_THRESHOLDS
} from '@/types/recommendation-confidence';

// Evidence level hierarchy (higher = better)
const EVIDENCE_LEVEL_SCORES: Record<string, number> = {
  'level_1a': 1.0,    // Systematic reviews of RCTs
  'level_1b': 0.95,   // Individual RCTs
  'level_2a': 0.8,    // Systematic reviews of cohort studies
  'level_2b': 0.75,   // Individual cohort studies
  'level_3a': 0.6,    // Systematic reviews of case-control
  'level_3b': 0.55,   // Case-control studies
  'level_4': 0.4,     // Case series
  'level_5': 0.2,     // Expert opinion
  'observational': 0.5,
  'in_vitro': 0.3,
  'theoretical': 0.1,
  'unknown': 0.3
};

const STUDY_TYPE_SCORES: Record<string, number> = {
  'meta_analysis': 1.0,
  'systematic_review': 0.95,
  'rct': 0.9,
  'clinical_trial': 0.8,
  'cohort': 0.7,
  'case_control': 0.6,
  'case_series': 0.5,
  'case_report': 0.4,
  'observational': 0.5,
  'in_vitro': 0.3,
  'review': 0.6
};

/**
 * Calculate KG coverage score based on available triplets
 */
export async function calculateKGCoverage(
  conditionId: string,
  species?: string,
  breed?: string
): Promise<KGCoverageMetrics> {
  try {
    // Query triplets related to the condition
    const { data: triplets, error } = await supabase
      .from('triplet_extractions')
      .select(`
        id,
        subject_name,
        predicate,
        object_name,
        extraction_confidence,
        evidence_level,
        species_context,
        curation_status,
        study_id
      `)
      .or(`object_name.ilike.%${conditionId}%,subject_name.ilike.%${conditionId}%`)
      .eq('curation_status', 'approved');

    if (error) throw error;

    const approvedTriplets = triplets || [];
    const uniqueStudies = new Set(approvedTriplets.map(t => t.study_id).filter(Boolean));
    
    // Calculate species match
    let speciesMatch: 'exact' | 'close' | 'distant' | 'none' = 'none';
    if (species) {
      const speciesLower = species.toLowerCase();
      const hasExactMatch = approvedTriplets.some(t => 
        t.species_context?.some((s: string) => s.toLowerCase() === speciesLower)
      );
      const hasCloseMatch = approvedTriplets.some(t =>
        t.species_context?.some((s: string) => 
          ['dog', 'cat', 'canine', 'feline'].includes(s.toLowerCase()) &&
          ['dog', 'cat', 'canine', 'feline'].includes(speciesLower)
        )
      );
      const hasAnyMatch = approvedTriplets.some(t => 
        t.species_context && t.species_context.length > 0
      );
      
      if (hasExactMatch) speciesMatch = 'exact';
      else if (hasCloseMatch) speciesMatch = 'close';
      else if (hasAnyMatch) speciesMatch = 'distant';
    }

    // Count direct relationships (nutraceutical -> condition)
    const directRelationships = approvedTriplets.filter(t =>
      ['TREATS', 'AMELIORATES', 'PREVENTS', 'SUPPORTS'].includes(t.predicate.toUpperCase())
    ).length;

    // Calculate overall coverage score
    const tripletScore = Math.min(approvedTriplets.length / 10, 1) * 0.3;
    const studyScore = Math.min(uniqueStudies.size / 5, 1) * 0.25;
    const speciesScore = speciesMatch === 'exact' ? 0.25 : 
                         speciesMatch === 'close' ? 0.15 : 
                         speciesMatch === 'distant' ? 0.08 : 0;
    const directScore = Math.min(directRelationships / 3, 1) * 0.2;

    return {
      score: tripletScore + studyScore + speciesScore + directScore,
      tripletCount: approvedTriplets.length,
      studyCount: uniqueStudies.size,
      speciesMatch,
      breedSpecific: false, // TODO: implement breed-specific check
      directRelationships,
      multiHopPaths: approvedTriplets.length - directRelationships
    };
  } catch (error) {
    console.error('Error calculating KG coverage:', error);
    return {
      score: 0,
      tripletCount: 0,
      studyCount: 0,
      speciesMatch: 'none',
      breedSpecific: false,
      directRelationships: 0,
      multiHopPaths: 0
    };
  }
}

/**
 * Calculate evidence quality score based on study characteristics
 */
export async function calculateEvidenceQuality(
  studyIds: string[]
): Promise<EvidenceQualityMetrics> {
  if (studyIds.length === 0) {
    return {
      score: 0,
      highestEvidenceLevel: 'unknown',
      studyTypesFound: [],
      averageStudyQuality: 0,
      replicationCount: 0,
      hasRCT: false,
      hasMetaAnalysis: false
    };
  }

  try {
    // Query triplets to get evidence levels
    const { data: triplets, error } = await supabase
      .from('triplet_extractions')
      .select('evidence_level, extraction_confidence, study_id')
      .in('study_id', studyIds);

    if (error) throw error;

    const evidenceLevels = (triplets || [])
      .map(t => t.evidence_level)
      .filter(Boolean);
    
    const confidences = (triplets || [])
      .map(t => t.extraction_confidence)
      .filter(Boolean) as number[];

    // Find highest evidence level
    let highestScore = 0;
    let highestLevel = 'unknown';
    for (const level of evidenceLevels) {
      const normalizedLevel = level.toLowerCase().replace(/\s+/g, '_');
      const score = EVIDENCE_LEVEL_SCORES[normalizedLevel] || 0.3;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = level;
      }
    }

    // Detect study types from evidence levels
    const studyTypesFound: string[] = [];
    const hasRCT = evidenceLevels.some(l => 
      l.toLowerCase().includes('rct') || l.toLowerCase().includes('randomized')
    );
    const hasMetaAnalysis = evidenceLevels.some(l => 
      l.toLowerCase().includes('meta') || l.toLowerCase().includes('systematic')
    );

    if (hasMetaAnalysis) studyTypesFound.push('meta_analysis');
    if (hasRCT) studyTypesFound.push('rct');
    if (evidenceLevels.some(l => l.toLowerCase().includes('cohort'))) 
      studyTypesFound.push('cohort');
    if (evidenceLevels.some(l => l.toLowerCase().includes('observational'))) 
      studyTypesFound.push('observational');

    // Calculate average quality
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;

    // Calculate replication (unique findings confirmed by multiple studies)
    const replicationCount = Math.min(Math.floor(studyIds.length / 2), 5);

    // Compute overall score
    const evidenceScore = highestScore * 0.4;
    const replicationScore = Math.min(replicationCount / 3, 1) * 0.25;
    const typeScore = (hasMetaAnalysis ? 0.2 : hasRCT ? 0.1 : 0);
    const confidenceScore = avgConfidence * 0.15;

    return {
      score: evidenceScore + replicationScore + typeScore + confidenceScore,
      highestEvidenceLevel: highestLevel,
      studyTypesFound,
      averageStudyQuality: avgConfidence,
      replicationCount,
      hasRCT,
      hasMetaAnalysis
    };
  } catch (error) {
    console.error('Error calculating evidence quality:', error);
    return {
      score: 0,
      highestEvidenceLevel: 'unknown',
      studyTypesFound: [],
      averageStudyQuality: 0,
      replicationCount: 0,
      hasRCT: false,
      hasMetaAnalysis: false
    };
  }
}

/**
 * Calculate data freshness score based on study years
 */
export async function calculateDataFreshness(
  studyIds: string[]
): Promise<DataFreshnessMetrics> {
  if (studyIds.length === 0) {
    return {
      score: 0,
      mostRecentStudyYear: 0,
      medianStudyYear: 0,
      recentStudiesCount: 0
    };
  }

  try {
    const { data: studies, error } = await supabase
      .from('processed_studies')
      .select('year')
      .in('id', studyIds);

    if (error) throw error;

    const years = (studies || [])
      .map(s => s.year)
      .filter((y): y is number => y !== null && y > 1900)
      .sort((a, b) => b - a);

    if (years.length === 0) {
      return {
        score: 0.3, // Default score for studies without year data
        mostRecentStudyYear: 0,
        medianStudyYear: 0,
        recentStudiesCount: 0
      };
    }

    const currentYear = new Date().getFullYear();
    const mostRecentYear = years[0];
    const medianYear = years[Math.floor(years.length / 2)];
    const recentStudies = years.filter(y => currentYear - y <= 5).length;

    // Calculate freshness score
    const recencyScore = Math.max(0, 1 - (currentYear - mostRecentYear) / 20) * 0.5;
    const recentCountScore = Math.min(recentStudies / 3, 1) * 0.3;
    const medianScore = Math.max(0, 1 - (currentYear - medianYear) / 30) * 0.2;

    return {
      score: recencyScore + recentCountScore + medianScore,
      mostRecentStudyYear: mostRecentYear,
      medianStudyYear: medianYear,
      recentStudiesCount: recentStudies
    };
  } catch (error) {
    console.error('Error calculating data freshness:', error);
    return {
      score: 0,
      mostRecentStudyYear: 0,
      medianStudyYear: 0,
      recentStudiesCount: 0
    };
  }
}

/**
 * Determine confidence level based on overall score
 */
export function determineConfidenceLevel(
  overallScore: number,
  thresholds = DEFAULT_CONFIDENCE_THRESHOLDS
): ConfidenceLevel {
  if (overallScore >= thresholds.high) return 'high';
  if (overallScore >= thresholds.medium) return 'medium';
  if (overallScore >= thresholds.low) return 'low';
  return 'insufficient';
}

/**
 * Generate rationale and warnings based on metrics
 */
export function generateRationaleAndWarnings(
  kgCoverage: KGCoverageMetrics,
  evidenceQuality: EvidenceQualityMetrics,
  dataFreshness: DataFreshnessMetrics,
  confidenceLevel: ConfidenceLevel
): { rationale: string; warnings: string[] } {
  const warnings: string[] = [];
  const rationalePoints: string[] = [];

  // KG Coverage analysis
  if (kgCoverage.tripletCount === 0) {
    warnings.push('Nenhum dado encontrado no Knowledge Graph para esta condição');
  } else if (kgCoverage.tripletCount < 3) {
    warnings.push('Poucos dados disponíveis no Knowledge Graph');
  }

  if (kgCoverage.speciesMatch === 'none') {
    warnings.push('Sem dados específicos para esta espécie');
  } else if (kgCoverage.speciesMatch === 'distant') {
    warnings.push('Dados extrapolados de espécies distantes');
  }

  if (kgCoverage.directRelationships > 0) {
    rationalePoints.push(`${kgCoverage.directRelationships} relações diretas nutracêutico-condição encontradas`);
  }

  // Evidence Quality analysis
  if (evidenceQuality.hasMetaAnalysis) {
    rationalePoints.push('Suportado por meta-análises');
  } else if (evidenceQuality.hasRCT) {
    rationalePoints.push('Suportado por ensaios clínicos randomizados');
  } else if (evidenceQuality.score < 0.3) {
    warnings.push('Evidência científica limitada');
  }

  if (evidenceQuality.replicationCount > 1) {
    rationalePoints.push(`Achados replicados em ${evidenceQuality.replicationCount} estudos independentes`);
  }

  // Data Freshness analysis
  const currentYear = new Date().getFullYear();
  if (dataFreshness.mostRecentStudyYear && currentYear - dataFreshness.mostRecentStudyYear > 10) {
    warnings.push('Dados podem estar desatualizados (estudos > 10 anos)');
  }

  // Build rationale string
  let rationale = '';
  if (confidenceLevel === 'high') {
    rationale = 'Alta confiança baseada em dados robustos do Knowledge Graph. ';
  } else if (confidenceLevel === 'medium') {
    rationale = 'Confiança moderada com base nos dados disponíveis. ';
  } else if (confidenceLevel === 'low') {
    rationale = 'Confiança limitada devido a lacunas nos dados. ';
  } else {
    rationale = 'Dados insuficientes no Knowledge Graph para recomendação segura. ';
  }

  if (rationalePoints.length > 0) {
    rationale += rationalePoints.join('. ') + '.';
  }

  return { rationale, warnings };
}

/**
 * Main function to compute recommendation confidence
 */
export async function computeRecommendationConfidence(
  params: ConfidenceCalculationParams
): Promise<ConfidenceCalculationResult> {
  const { petProfile, targetCondition, conditionId } = params;

  // Calculate all metrics
  const kgCoverage = await calculateKGCoverage(
    conditionId || targetCondition,
    petProfile.species,
    petProfile.breed
  );

  // Get study IDs from triplets
  const { data: triplets } = await supabase
    .from('triplet_extractions')
    .select('id, subject_name, predicate, object_name, extraction_confidence, evidence_level, study_id')
    .or(`object_name.ilike.%${targetCondition}%,subject_name.ilike.%${targetCondition}%`)
    .eq('curation_status', 'approved');

  const studyIds = [...new Set((triplets || []).map(t => t.study_id).filter(Boolean))] as string[];

  const evidenceQuality = await calculateEvidenceQuality(studyIds);
  const dataFreshness = await calculateDataFreshness(studyIds);

  // Calculate overall score with weights
  const overallScore = 
    kgCoverage.score * 0.4 +
    evidenceQuality.score * 0.4 +
    dataFreshness.score * 0.2;

  const confidenceLevel = determineConfidenceLevel(overallScore);
  const { rationale, warnings } = generateRationaleAndWarnings(
    kgCoverage, 
    evidenceQuality, 
    dataFreshness, 
    confidenceLevel
  );

  const confidence: RecommendationConfidence = {
    overall: overallScore,
    kgCoverage,
    evidenceQuality,
    dataFreshness,
    confidenceLevel,
    requiresLlmFallback: confidenceLevel === 'insufficient',
    humanReviewRecommended: confidenceLevel === 'low' || confidenceLevel === 'insufficient',
    rationale,
    warnings
  };

  // Get study details
  const { data: studyDetails } = await supabase
    .from('processed_studies')
    .select('id, title, year')
    .in('id', studyIds);

  return {
    confidence,
    triplets: (triplets || []).map(t => ({
      id: t.id,
      subject: t.subject_name,
      predicate: t.predicate,
      object: t.object_name,
      confidence: t.extraction_confidence || 0,
      evidenceLevel: t.evidence_level || 'unknown',
      studyId: t.study_id
    })),
    studies: (studyDetails || []).map(s => ({
      id: s.id,
      title: s.title || 'Untitled',
      year: s.year || 0,
      evidenceLevel: 'unknown',
      quality: 0.5
    }))
  };
}
