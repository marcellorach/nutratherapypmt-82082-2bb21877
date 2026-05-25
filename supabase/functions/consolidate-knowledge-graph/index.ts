import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsolidationRequest {
  mode?: 'full' | 'incremental' | 'by_entity' | 'by_study';
  entityId?: string;
  studyId?: string;
  minConfidence?: number;
  minEvidenceCount?: number;
  async?: boolean;
}

function calculateAggregatedConfidence(triplets: any[]): number {
  if (triplets.length === 0) return 0;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const t of triplets) {
    const confidence = t.extraction_confidence || 0.5;
    const llmConfidence = t.llm_confidence || 0.5;
    const kgMatchScore = t.kg_match_score || 0;
    const weight = (llmConfidence + (kgMatchScore > 0 ? 0.3 : 0)) * (t.auto_approved ? 1.2 : 1);
    weightedSum += confidence * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function determineEvidenceLevel(evidenceCount: number, confidence: number): string {
  if (evidenceCount >= 5 && confidence >= 0.8) return 'high';
  if (evidenceCount >= 3 && confidence >= 0.6) return 'moderate';
  if (evidenceCount >= 2 && confidence >= 0.5) return 'low';
  return 'preliminary';
}

function aggregateDoseRanges(triplets: any[]): object | null {
  const ranges = triplets.filter(t => t.dose_range && typeof t.dose_range === 'object').map(t => t.dose_range);
  if (ranges.length === 0) return null;
  const merged: any = { min: null, max: null, unit: null, sources: [] };
  for (const r of ranges) {
    if (r.min !== undefined && (merged.min === null || r.min < merged.min)) merged.min = r.min;
    if (r.max !== undefined && (merged.max === null || r.max > merged.max)) merged.max = r.max;
    if (r.unit && !merged.unit) merged.unit = r.unit;
    if (r.value) merged.sources.push(r.value);
  }
  return merged.min !== null || merged.max !== null ? merged : null;
}

function aggregateSpecies(triplets: any[]): string[] {
  const set = new Set<string>();
  for (const t of triplets) {
    if (Array.isArray(t.species_context)) t.species_context.forEach((s: string) => set.add(s));
  }
  return Array.from(set);
}

function groupTriplets(triplets: any[]) {
  const groups = new Map<string, { triplets: any[]; source_name: string; target_name: string; predicate: string }>();
  for (const t of triplets) {
    const key = `${t.subject_type}:${(t.subject_name || '').toLowerCase()}:${t.predicate}:${t.object_type}:${(t.object_name || '').toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, { triplets: [], source_name: t.subject_name, target_name: t.object_name, predicate: t.predicate });
    groups.get(key)!.triplets.push(t);
  }
  return groups;
}

function getLayerForType(type: string): string {
  const map: Record<string, string> = {
    nutraceutical: 'layer_0_compound', drug: 'layer_0_compound', chemical_compound: 'layer_0_compound',
    pathway: 'layer_1_target', receptor: 'layer_1_target', enzyme: 'layer_1_target', gene_protein: 'layer_1_target',
    mechanism: 'layer_2_mechanism', signaling_cascade: 'layer_2_mechanism',
    biological_effect: 'layer_3_effect', side_effect: 'layer_3_effect',
    clinical_outcome: 'layer_4_outcome', condition: 'layer_4_outcome', disease: 'layer_4_outcome',
  };
  return map[(type || '').toLowerCase()] || 'layer_0_compound';
}

async function runConsolidation(supabase: any, request: ConsolidationRequest) {
  const { mode = 'incremental', entityId, studyId, minConfidence = 0.5, minEvidenceCount = 1 } = request;
  console.log(`[consolidate-knowledge-graph] Starting consolidation mode: ${mode}`);

  // Paginated fetch (bypass default 1000-row cap)
  const PAGE = 1000;
  const triplets: any[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('triplet_extractions')
      .select('*')
      .eq('curation_status', 'approved')
      .eq('hallucination_flag', false)
      .range(from, from + PAGE - 1);
    if (mode === 'by_study' && studyId) q = q.eq('study_id', studyId);
    else if (mode === 'by_entity' && entityId) q = q.or(`subject_id.eq.${entityId},object_id.eq.${entityId}`);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    triplets.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`[consolidate-knowledge-graph] Found ${triplets.length} approved triplets`);
  if (triplets.length === 0) return { processed: 0, created: 0, updated: 0, skipped: 0, edges_created: 0 };

  const groups = groupTriplets(triplets);
  console.log(`[consolidate-knowledge-graph] Grouped into ${groups.size} unique relationships`);

  // Pre-fetch ALL hierarchical_edges once and index by key — avoids per-group SELECT.
  const existingByKey = new Map<string, any>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('hierarchical_edges')
      .select('id, source_type, target_type, relationship, source_id, target_id, evidence_count, study_ids')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const e of data) {
      const k = `${e.source_type}:${(e.source_id || '').toLowerCase()}:${e.relationship}:${e.target_type}:${(e.target_id || '').toLowerCase()}`;
      existingByKey.set(k, e);
    }
    if (data.length < PAGE) break;
  }

  const toInsert: any[] = [];
  const toUpdate: { id: string; patch: any }[] = [];
  let skipped = 0;

  for (const [, group] of groups) {
    const { triplets: gt, predicate } = group;
    const aggregatedConfidence = calculateAggregatedConfidence(gt);
    const evidenceCount = gt.length;
    if (aggregatedConfidence < minConfidence || evidenceCount < minEvidenceCount) { skipped++; continue; }

    const studyIds = [...new Set(gt.map((t: any) => t.study_id).filter(Boolean))];
    const evidenceLevel = determineEvidenceLevel(evidenceCount, aggregatedConfidence);
    const doseRange = aggregateDoseRanges(gt);
    const speciesValidated = aggregateSpecies(gt);
    const first = gt[0];
    const sourceType = first.subject_type;
    const targetType = first.object_type;
    const sourceLayer = first.subject_layer || getLayerForType(sourceType);
    const targetLayer = first.object_layer || getLayerForType(targetType);
    const sourceId = first.subject_id || crypto.randomUUID();
    const targetId = first.object_id || crypto.randomUUID();
    const lookupKey = `${sourceType}:${(first.subject_id || '').toLowerCase()}:${predicate}:${targetType}:${(first.object_id || '').toLowerCase()}`;
    const existingEdge = existingByKey.get(lookupKey);

    const edgeData: any = {
      source_type: sourceType, source_layer: sourceLayer,
      target_type: targetType, target_layer: targetLayer,
      relationship: predicate,
      confidence: aggregatedConfidence,
      evidence_count: evidenceCount,
      evidence_level: evidenceLevel,
      study_ids: studyIds,
      dose_range: doseRange,
      species_validated: speciesValidated,
      triplet_id: first.id,
      updated_at: new Date().toISOString(),
    };

    if (existingEdge) {
      const mergedStudyIds = [...new Set([...(existingEdge.study_ids || []), ...studyIds])];
      toUpdate.push({
        id: existingEdge.id,
        patch: { ...edgeData, study_ids: mergedStudyIds, evidence_count: Math.max(evidenceCount, existingEdge.evidence_count || 0) },
      });
    } else {
      toInsert.push({ ...edgeData, source_id: sourceId, target_id: targetId, created_at: new Date().toISOString() });
    }
  }

  // Batched insert
  let created = 0;
  const BATCH = 500;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const slice = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('hierarchical_edges').insert(slice);
    if (error) console.error('[consolidate-knowledge-graph] insert batch error:', error);
    else created += slice.length;
  }
  // Parallel updates in chunks
  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += 25) {
    const chunk = toUpdate.slice(i, i + 25);
    const results = await Promise.all(chunk.map(u => supabase.from('hierarchical_edges').update(u.patch).eq('id', u.id)));
    for (const r of results) {
      if (r.error) console.error('[consolidate-knowledge-graph] update error:', r.error);
      else updated++;
    }
  }

  const stats = {
    totalTriplets: triplets.length,
    uniqueRelationships: groups.size,
    created,
    updated,
    skipped,
    edges_created: created,
  };
  console.log('[consolidate-knowledge-graph] Consolidation complete:', stats);
  return stats;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: ConsolidationRequest = await req.json().catch(() => ({}));

    // Default: run async in background to avoid 150s edge timeout.
    const runAsync = request.async !== false;
    if (runAsync) {
      // @ts-ignore EdgeRuntime is provided by Supabase runtime
      EdgeRuntime.waitUntil(
        runConsolidation(supabase, request).catch(err =>
          console.error('[consolidate-knowledge-graph] background error:', err)
        )
      );
      return new Response(JSON.stringify({ success: true, queued: true, message: 'Consolidation running in background' }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stats = await runConsolidation(supabase, request);
    return new Response(JSON.stringify({ success: true, stats, edges_created: stats.created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[consolidate-knowledge-graph] Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});