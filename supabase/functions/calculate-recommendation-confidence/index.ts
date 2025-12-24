import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evidence level scores
const EVIDENCE_LEVEL_SCORES: Record<string, number> = {
  'level_1a': 1.0,
  'level_1b': 0.95,
  'level_2a': 0.8,
  'level_2b': 0.75,
  'level_3a': 0.6,
  'level_3b': 0.55,
  'level_4': 0.4,
  'level_5': 0.2,
  'observational': 0.5,
  'in_vitro': 0.3,
  'theoretical': 0.1,
  'unknown': 0.3
};

interface PetProfile {
  species?: string;
  breed?: string;
  age?: number;
  weight?: number;
}

interface ConfidenceRequest {
  petProfile: PetProfile;
  targetCondition: string;
  conditionId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { petProfile, targetCondition, conditionId }: ConfidenceRequest = await req.json();

    console.log('Calculating confidence for:', { targetCondition, petProfile });

    // 1. Query relevant triplets
    const { data: triplets, error: tripletError } = await supabase
      .from('triplet_extractions')
      .select(`
        id,
        subject_name,
        subject_type,
        predicate,
        object_name,
        extraction_confidence,
        evidence_level,
        species_context,
        study_id,
        dose_range
      `)
      .or(`object_name.ilike.%${targetCondition}%,subject_name.ilike.%${targetCondition}%`)
      .eq('curation_status', 'approved');

    if (tripletError) throw tripletError;

    const approvedTriplets = triplets || [];
    const uniqueStudyIds = [...new Set(approvedTriplets.map(t => t.study_id).filter(Boolean))] as string[];

    // 2. Calculate KG Coverage
    let speciesMatch: 'exact' | 'close' | 'distant' | 'none' = 'none';
    if (petProfile.species) {
      const speciesLower = petProfile.species.toLowerCase();
      const hasExactMatch = approvedTriplets.some(t => 
        t.species_context?.some((s: string) => s.toLowerCase() === speciesLower)
      );
      const hasCloseMatch = approvedTriplets.some(t =>
        t.species_context?.some((s: string) => 
          ['dog', 'cat', 'canine', 'feline'].includes(s.toLowerCase()) &&
          ['dog', 'cat', 'canine', 'feline'].includes(speciesLower)
        )
      );
      
      if (hasExactMatch) speciesMatch = 'exact';
      else if (hasCloseMatch) speciesMatch = 'close';
      else if (approvedTriplets.some(t => t.species_context?.length > 0)) speciesMatch = 'distant';
    }

    const directRelationships = approvedTriplets.filter(t =>
      ['TREATS', 'AMELIORATES', 'PREVENTS', 'SUPPORTS'].includes(t.predicate?.toUpperCase() || '')
    ).length;

    const kgCoverageScore = 
      Math.min(approvedTriplets.length / 10, 1) * 0.3 +
      Math.min(uniqueStudyIds.length / 5, 1) * 0.25 +
      (speciesMatch === 'exact' ? 0.25 : speciesMatch === 'close' ? 0.15 : speciesMatch === 'distant' ? 0.08 : 0) +
      Math.min(directRelationships / 3, 1) * 0.2;

    // 3. Calculate Evidence Quality
    const evidenceLevels = approvedTriplets.map(t => t.evidence_level).filter(Boolean);
    let highestScore = 0;
    let highestLevel = 'unknown';
    
    for (const level of evidenceLevels) {
      const normalized = level.toLowerCase().replace(/\s+/g, '_');
      const score = EVIDENCE_LEVEL_SCORES[normalized] || 0.3;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = level;
      }
    }

    const hasRCT = evidenceLevels.some(l => l.toLowerCase().includes('rct') || l.toLowerCase().includes('randomized'));
    const hasMetaAnalysis = evidenceLevels.some(l => l.toLowerCase().includes('meta') || l.toLowerCase().includes('systematic'));
    
    const confidences = approvedTriplets
      .map(t => t.extraction_confidence)
      .filter((c): c is number => c !== null && c !== undefined);
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;

    const replicationCount = Math.min(Math.floor(uniqueStudyIds.length / 2), 5);

    const evidenceQualityScore = 
      highestScore * 0.4 +
      Math.min(replicationCount / 3, 1) * 0.25 +
      (hasMetaAnalysis ? 0.2 : hasRCT ? 0.1 : 0) +
      avgConfidence * 0.15;

    // 4. Calculate Data Freshness
    let freshnessScore = 0.3;
    let mostRecentYear = 0;
    let medianYear = 0;
    let recentStudiesCount = 0;

    if (uniqueStudyIds.length > 0) {
      const { data: studies } = await supabase
        .from('processed_studies')
        .select('year')
        .in('id', uniqueStudyIds);

      const years = (studies || [])
        .map(s => s.year)
        .filter((y): y is number => y !== null && y > 1900)
        .sort((a, b) => b - a);

      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        mostRecentYear = years[0];
        medianYear = years[Math.floor(years.length / 2)];
        recentStudiesCount = years.filter(y => currentYear - y <= 5).length;

        freshnessScore = 
          Math.max(0, 1 - (currentYear - mostRecentYear) / 20) * 0.5 +
          Math.min(recentStudiesCount / 3, 1) * 0.3 +
          Math.max(0, 1 - (currentYear - medianYear) / 30) * 0.2;
      }
    }

    // 5. Calculate Overall Score
    const overallScore = 
      kgCoverageScore * 0.4 +
      evidenceQualityScore * 0.4 +
      freshnessScore * 0.2;

    // 6. Determine Confidence Level
    let confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
    if (overallScore >= 0.7) confidenceLevel = 'high';
    else if (overallScore >= 0.5) confidenceLevel = 'medium';
    else if (overallScore >= 0.3) confidenceLevel = 'low';
    else confidenceLevel = 'insufficient';

    // 7. Generate Warnings
    const warnings: string[] = [];
    if (approvedTriplets.length === 0) {
      warnings.push('Nenhum dado encontrado no Knowledge Graph para esta condição');
    } else if (approvedTriplets.length < 3) {
      warnings.push('Poucos dados disponíveis no Knowledge Graph');
    }
    if (speciesMatch === 'none') {
      warnings.push('Sem dados específicos para esta espécie');
    } else if (speciesMatch === 'distant') {
      warnings.push('Dados extrapolados de espécies distantes');
    }
    if (evidenceQualityScore < 0.3) {
      warnings.push('Evidência científica limitada');
    }
    const currentYear = new Date().getFullYear();
    if (mostRecentYear && currentYear - mostRecentYear > 10) {
      warnings.push('Dados podem estar desatualizados (estudos > 10 anos)');
    }

    // 8. Generate Rationale
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

    if (directRelationships > 0) {
      rationale += `${directRelationships} relações diretas nutracêutico-condição encontradas. `;
    }
    if (hasMetaAnalysis) {
      rationale += 'Suportado por meta-análises. ';
    } else if (hasRCT) {
      rationale += 'Suportado por ensaios clínicos randomizados. ';
    }
    if (replicationCount > 1) {
      rationale += `Achados replicados em ${replicationCount} estudos independentes.`;
    }

    const response = {
      confidence: {
        overall: overallScore,
        kgCoverage: {
          score: kgCoverageScore,
          tripletCount: approvedTriplets.length,
          studyCount: uniqueStudyIds.length,
          speciesMatch,
          breedSpecific: false,
          directRelationships,
          multiHopPaths: approvedTriplets.length - directRelationships
        },
        evidenceQuality: {
          score: evidenceQualityScore,
          highestEvidenceLevel: highestLevel,
          studyTypesFound: [
            ...(hasMetaAnalysis ? ['meta_analysis'] : []),
            ...(hasRCT ? ['rct'] : [])
          ],
          averageStudyQuality: avgConfidence,
          replicationCount,
          hasRCT,
          hasMetaAnalysis
        },
        dataFreshness: {
          score: freshnessScore,
          mostRecentStudyYear: mostRecentYear,
          medianStudyYear: medianYear,
          recentStudiesCount
        },
        confidenceLevel,
        requiresLlmFallback: confidenceLevel === 'insufficient',
        humanReviewRecommended: confidenceLevel === 'low' || confidenceLevel === 'insufficient',
        rationale,
        warnings
      },
      triplets: approvedTriplets.map(t => ({
        id: t.id,
        subject: t.subject_name,
        predicate: t.predicate,
        object: t.object_name,
        confidence: t.extraction_confidence || 0,
        evidenceLevel: t.evidence_level || 'unknown',
        studyId: t.study_id
      })),
      studyIds: uniqueStudyIds
    };

    console.log('Confidence calculation complete:', { 
      overallScore, 
      confidenceLevel, 
      tripletCount: approvedTriplets.length 
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calculating recommendation confidence:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
