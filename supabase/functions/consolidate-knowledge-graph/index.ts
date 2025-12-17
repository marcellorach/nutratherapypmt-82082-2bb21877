import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsolidationRequest {
  mode: 'full' | 'incremental' | 'by_entity' | 'by_study';
  entityId?: string;
  studyId?: string;
  minConfidence?: number;
  minEvidenceCount?: number;
}

interface ConsolidatedEdge {
  source_id: string;
  source_type: string;
  source_layer: string;
  target_id: string;
  target_type: string;
  target_layer: string;
  relationship: string;
  aggregated_confidence: number;
  evidence_count: number;
  study_ids: string[];
  evidence_level: string;
  dose_range?: object;
  species_validated: string[];
}

interface TripletGroup {
  key: string;
  triplets: any[];
  source_name: string;
  target_name: string;
  predicate: string;
}

// Calculate aggregated confidence using weighted average
function calculateAggregatedConfidence(triplets: any[]): number {
  if (triplets.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const triplet of triplets) {
    const confidence = triplet.extraction_confidence || 0.5;
    const llmConfidence = triplet.llm_confidence || 0.5;
    const kgMatchScore = triplet.kg_match_score || 0;
    
    // Weight by LLM confidence and KG match score
    const weight = (llmConfidence + (kgMatchScore > 0 ? 0.3 : 0)) * (triplet.auto_approved ? 1.2 : 1);
    
    weightedSum += confidence * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Determine evidence level based on study count and confidence
function determineEvidenceLevel(evidenceCount: number, confidence: number): string {
  if (evidenceCount >= 5 && confidence >= 0.8) return 'high';
  if (evidenceCount >= 3 && confidence >= 0.6) return 'moderate';
  if (evidenceCount >= 2 && confidence >= 0.5) return 'low';
  return 'preliminary';
}

// Aggregate dose ranges from multiple triplets
function aggregateDoseRanges(triplets: any[]): object | null {
  const ranges = triplets
    .filter(t => t.dose_range && typeof t.dose_range === 'object')
    .map(t => t.dose_range);
  
  if (ranges.length === 0) return null;
  
  // Merge dose ranges
  const merged: any = {
    min: null,
    max: null,
    unit: null,
    sources: []
  };
  
  for (const range of ranges) {
    if (range.min !== undefined && (merged.min === null || range.min < merged.min)) {
      merged.min = range.min;
    }
    if (range.max !== undefined && (merged.max === null || range.max > merged.max)) {
      merged.max = range.max;
    }
    if (range.unit && !merged.unit) {
      merged.unit = range.unit;
    }
    if (range.value) {
      merged.sources.push(range.value);
    }
  }
  
  return merged.min !== null || merged.max !== null ? merged : null;
}

// Aggregate species from triplets
function aggregateSpecies(triplets: any[]): string[] {
  const speciesSet = new Set<string>();
  
  for (const triplet of triplets) {
    if (triplet.species_context && Array.isArray(triplet.species_context)) {
      triplet.species_context.forEach((s: string) => speciesSet.add(s));
    }
  }
  
  return Array.from(speciesSet);
}

// Group triplets by relationship key
function groupTriplets(triplets: any[]): Map<string, TripletGroup> {
  const groups = new Map<string, TripletGroup>();
  
  for (const triplet of triplets) {
    // Create a normalized key for grouping
    const key = `${triplet.subject_type}:${triplet.subject_name.toLowerCase()}:${triplet.predicate}:${triplet.object_type}:${triplet.object_name.toLowerCase()}`;
    
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        triplets: [],
        source_name: triplet.subject_name,
        target_name: triplet.object_name,
        predicate: triplet.predicate
      });
    }
    
    groups.get(key)!.triplets.push(triplet);
  }
  
  return groups;
}

// Map entity type to layer
function getLayerForType(type: string): string {
  const typeToLayer: Record<string, string> = {
    'nutraceutical': 'layer_0_compound',
    'drug': 'layer_0_compound',
    'chemical_compound': 'layer_0_compound',
    'pathway': 'layer_1_target',
    'receptor': 'layer_1_target',
    'enzyme': 'layer_1_target',
    'gene_protein': 'layer_1_target',
    'mechanism': 'layer_2_mechanism',
    'signaling_cascade': 'layer_2_mechanism',
    'biological_effect': 'layer_3_effect',
    'side_effect': 'layer_3_effect',
    'clinical_outcome': 'layer_4_outcome',
    'condition': 'layer_4_outcome',
    'disease': 'layer_4_outcome'
  };
  
  return typeToLayer[type.toLowerCase()] || 'layer_0_compound';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: ConsolidationRequest = await req.json();
    const { 
      mode = 'incremental', 
      entityId, 
      studyId,
      minConfidence = 0.5,
      minEvidenceCount = 1
    } = request;

    console.log(`[consolidate-knowledge-graph] Starting consolidation mode: ${mode}`);

    // Build query for triplet extractions
    let query = supabase
      .from('triplet_extractions')
      .select('*')
      .eq('curation_status', 'approved')
      .eq('hallucination_flag', false);

    // Apply filters based on mode
    if (mode === 'by_study' && studyId) {
      query = query.eq('study_id', studyId);
    } else if (mode === 'by_entity' && entityId) {
      query = query.or(`subject_id.eq.${entityId},object_id.eq.${entityId}`);
    }

    const { data: triplets, error: tripletError } = await query;

    if (tripletError) {
      console.error('[consolidate-knowledge-graph] Error fetching triplets:', tripletError);
      throw tripletError;
    }

    console.log(`[consolidate-knowledge-graph] Found ${triplets?.length || 0} approved triplets`);

    if (!triplets || triplets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No approved triplets to consolidate',
        stats: { processed: 0, created: 0, updated: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group triplets by relationship
    const groups = groupTriplets(triplets);
    console.log(`[consolidate-knowledge-graph] Grouped into ${groups.size} unique relationships`);

    // Process each group and create/update hierarchical edges
    const consolidatedEdges: ConsolidatedEdge[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [key, group] of groups) {
      const { triplets: groupTriplets, source_name, target_name, predicate } = group;
      
      // Calculate aggregated metrics
      const aggregatedConfidence = calculateAggregatedConfidence(groupTriplets);
      const evidenceCount = groupTriplets.length;
      
      // Apply filters
      if (aggregatedConfidence < minConfidence || evidenceCount < minEvidenceCount) {
        skipped++;
        continue;
      }

      const studyIds = [...new Set(groupTriplets.map(t => t.study_id).filter(Boolean))];
      const evidenceLevel = determineEvidenceLevel(evidenceCount, aggregatedConfidence);
      const doseRange = aggregateDoseRanges(groupTriplets);
      const speciesValidated = aggregateSpecies(groupTriplets);

      // Get source and target info from first triplet
      const firstTriplet = groupTriplets[0];
      const sourceType = firstTriplet.subject_type;
      const targetType = firstTriplet.object_type;
      const sourceLayer = firstTriplet.subject_layer || getLayerForType(sourceType);
      const targetLayer = firstTriplet.object_layer || getLayerForType(targetType);

      // Check if edge already exists
      const { data: existingEdge } = await supabase
        .from('hierarchical_edges')
        .select('id, evidence_count, study_ids')
        .eq('source_type', sourceType)
        .eq('target_type', targetType)
        .eq('relationship', predicate)
        .ilike('source_id', `%${source_name.toLowerCase().substring(0, 10)}%`)
        .ilike('target_id', `%${target_name.toLowerCase().substring(0, 10)}%`)
        .maybeSingle();

      const edgeData = {
        source_type: sourceType,
        source_layer: sourceLayer,
        target_type: targetType,
        target_layer: targetLayer,
        relationship: predicate,
        confidence: aggregatedConfidence,
        evidence_count: evidenceCount,
        evidence_level: evidenceLevel,
        study_ids: studyIds,
        dose_range: doseRange,
        species_validated: speciesValidated,
        triplet_id: firstTriplet.id,
        updated_at: new Date().toISOString()
      };

      if (existingEdge) {
        // Update existing edge with merged data
        const mergedStudyIds = [...new Set([...(existingEdge.study_ids || []), ...studyIds])];
        
        const { error: updateError } = await supabase
          .from('hierarchical_edges')
          .update({
            ...edgeData,
            study_ids: mergedStudyIds,
            evidence_count: Math.max(evidenceCount, existingEdge.evidence_count || 0)
          })
          .eq('id', existingEdge.id);

        if (updateError) {
          console.error(`[consolidate-knowledge-graph] Error updating edge:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Create new edge - need to generate proper source_id and target_id
        const sourceId = firstTriplet.subject_id || crypto.randomUUID();
        const targetId = firstTriplet.object_id || crypto.randomUUID();

        const { error: insertError } = await supabase
          .from('hierarchical_edges')
          .insert({
            ...edgeData,
            source_id: sourceId,
            target_id: targetId,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`[consolidate-knowledge-graph] Error inserting edge:`, insertError);
        } else {
          created++;
        }
      }

      consolidatedEdges.push({
        source_id: firstTriplet.subject_id || '',
        source_type: sourceType,
        source_layer: sourceLayer,
        target_id: firstTriplet.object_id || '',
        target_type: targetType,
        target_layer: targetLayer,
        relationship: predicate,
        aggregated_confidence: aggregatedConfidence,
        evidence_count: evidenceCount,
        study_ids: studyIds,
        evidence_level: evidenceLevel,
        dose_range: doseRange || undefined,
        species_validated: speciesValidated
      });
    }

    // Generate meta-graph statistics
    const stats = {
      totalTriplets: triplets.length,
      uniqueRelationships: groups.size,
      created,
      updated,
      skipped,
      byEvidenceLevel: {
        high: consolidatedEdges.filter(e => e.evidence_level === 'high').length,
        moderate: consolidatedEdges.filter(e => e.evidence_level === 'moderate').length,
        low: consolidatedEdges.filter(e => e.evidence_level === 'low').length,
        preliminary: consolidatedEdges.filter(e => e.evidence_level === 'preliminary').length
      },
      avgConfidence: consolidatedEdges.length > 0 
        ? consolidatedEdges.reduce((sum, e) => sum + e.aggregated_confidence, 0) / consolidatedEdges.length 
        : 0,
      avgEvidenceCount: consolidatedEdges.length > 0
        ? consolidatedEdges.reduce((sum, e) => sum + e.evidence_count, 0) / consolidatedEdges.length
        : 0
    };

    console.log(`[consolidate-knowledge-graph] Consolidation complete:`, stats);

    return new Response(JSON.stringify({
      success: true,
      message: `Consolidated ${groups.size} relationships from ${triplets.length} triplets`,
      stats,
      edges: consolidatedEdges.slice(0, 50) // Return first 50 for preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[consolidate-knowledge-graph] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
