import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Backfill enrichment (intensity + evidence_level + confidence_rationale)
 * for approved triplets that are missing those fields.
 *
 * Body params (all optional):
 *   limit         max triplets to process this run (default 4000)
 *   batchSize     parallel calls per batch (default 8)
 *   batchDelayMs  pause between batches in ms (default 800)
 *   tripletId     enrich just one triplet (used by post-approval hook)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: any = {};
  try { body = await req.json(); } catch { /* GET / empty body OK */ }

  const limit = Math.min(Math.max(Number(body.limit) || 4000, 1), 10000);
  const batchSize = Math.min(Math.max(Number(body.batchSize) || 8, 1), 20);
  const batchDelayMs = Math.max(Number(body.batchDelayMs) ?? 800, 0);
  const singleId: string | undefined = body.tripletId;

  // Single-triplet mode (post-approval hook)
  if (singleId) {
    const result = await enrichOne(supabase, singleId);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Bulk backfill mode
  const { data: targets, error } = await supabase
    .from('triplet_extractions')
    .select('id')
    .eq('curation_status', 'approved')
    .or('intensity.is.null,evidence_level.is.null,confidence_rationale.is.null')
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const ids = (targets ?? []).map(t => t.id);
  console.log(`🧪 Backfill: ${ids.length} triplets to enrich (limit=${limit}, batch=${batchSize}, delay=${batchDelayMs}ms)`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(id => enrichOne(supabase, id)));
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.enriched) enriched++;
        else if (r.value.skipped) skipped++;
        else { failed++; if (r.value.error && errors.length < 10) errors.push(r.value.error); }
      } else {
        failed++;
        if (errors.length < 10) errors.push(String(r.reason));
      }
    }
    if (i + batchSize < ids.length && batchDelayMs > 0) {
      await new Promise(res => setTimeout(res, batchDelayMs));
    }
    if ((i / batchSize) % 10 === 0) {
      console.log(`  …progress ${i + batch.length}/${ids.length} (ok=${enriched} skip=${skipped} fail=${failed})`);
    }
  }

  // Log usage summary
  await supabase.from('api_usage_logs').insert({
    api_provider: 'lovable_ai',
    model: 'google/gemini-2.5-flash',
    operation: 'triplet_enrichment_backfill',
    metadata: { total: ids.length, enriched, skipped, failed, errors: errors.slice(0, 5) }
  });

  return new Response(JSON.stringify({
    ok: true, total: ids.length, enriched, skipped, failed, errors: errors.slice(0, 5)
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

/** Calls enrich-triplet for a single triplet via internal HTTP. Returns a small result object. */
async function enrichOne(supabase: any, tripletId: string): Promise<{ enriched?: boolean; skipped?: boolean; error?: string }> {
  try {
    // Quick guard: skip if already complete
    const { data: t } = await supabase
      .from('triplet_extractions')
      .select('intensity, evidence_level, confidence_rationale')
      .eq('id', tripletId)
      .single();
    if (t && t.intensity != null && t.evidence_level && t.confidence_rationale) {
      return { skipped: true };
    }

    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enrich-triplet`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ tripletId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: `HTTP ${res.status}: ${json?.error ?? 'unknown'}` };
    if (json.enriched) return { enriched: true };
    return { skipped: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}