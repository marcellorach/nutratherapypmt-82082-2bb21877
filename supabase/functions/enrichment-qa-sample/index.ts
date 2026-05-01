import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generates a stratified QA batch:
 *  - draws ~50 approved triplets currently missing intensity/evidence_level
 *  - splits across high/med/low original extraction_confidence buckets
 *  - enriches each via enrich-triplet
 *  - saves AI output into enrichment_qa_samples for human review
 *
 * Body: { sampleSize?: number (default 50) }
 * Returns: { batch_id, total, enriched, failed }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let body: any = {};
  try { body = await req.json(); } catch {}
  const sampleSize = Math.min(Math.max(Number(body.sampleSize) || 50, 10), 200);
  const perBucket = Math.ceil(sampleSize / 3);
  const batchId = crypto.randomUUID();

  // Stratified sampling by extraction_confidence
  const buckets = [
    { name: 'high', min: 0.75, max: 1.01 },
    { name: 'medium', min: 0.45, max: 0.75 },
    { name: 'low', min: 0, max: 0.45 },
  ];

  const sampleIds: string[] = [];
  for (const b of buckets) {
    const { data } = await supabase
      .from('triplet_extractions')
      .select('id')
      .eq('curation_status', 'approved')
      .or('intensity.is.null,evidence_level.is.null,confidence_rationale.is.null')
      .gte('extraction_confidence', b.min)
      .lt('extraction_confidence', b.max)
      .limit(perBucket * 4); // oversample then shuffle
    if (data) {
      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, perBucket);
      sampleIds.push(...shuffled.map(t => t.id));
    }
  }

  console.log(`🧪 QA batch ${batchId}: ${sampleIds.length} triplets across 3 strata`);

  let enriched = 0;
  let failed = 0;
  const enrichUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enrich-triplet`;
  const auth = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;

  for (let i = 0; i < sampleIds.length; i += 5) {
    const batch = sampleIds.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(async (tripletId) => {
      const r = await fetch(enrichUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ tripletId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.enriched) return { tripletId, ok: false, j };

      // Re-read the now-enriched triplet
      const { data: t } = await supabase
        .from('triplet_extractions')
        .select('intensity, evidence_level, confidence_rationale, enrichment_confidence')
        .eq('id', tripletId)
        .single();

      await supabase.from('enrichment_qa_samples').insert({
        triplet_id: tripletId,
        batch_id: batchId,
        ai_evidence_level: t?.evidence_level,
        ai_intensity: t?.intensity,
        ai_confidence: t?.enrichment_confidence,
        ai_rationale: t?.confidence_rationale,
      });
      return { tripletId, ok: true };
    }));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.ok) enriched++;
      else failed++;
    }
    if (i + 5 < sampleIds.length) await new Promise(res => setTimeout(res, 800));
  }

  return new Response(JSON.stringify({
    ok: true, batch_id: batchId, total: sampleIds.length, enriched, failed,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});