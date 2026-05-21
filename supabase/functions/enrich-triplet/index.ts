import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callAITask } from "../_shared/ai-task-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripletId } = await req.json();
    if (!tripletId) {
      return new Response(JSON.stringify({ error: 'tripletId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // 1. Fetch the triplet
    const { data: triplet, error: tripletError } = await supabase
      .from('triplet_extractions')
      .select('*')
      .eq('id', tripletId)
      .single();

    if (tripletError || !triplet) {
      return new Response(JSON.stringify({ error: 'Triplet not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch relevant chunks from study_embeddings
    let contextText = '';
    if (triplet.study_id) {
      const { data: chunks } = await supabase
        .from('study_embeddings')
        .select('chunk_text, chunk_index')
        .eq('study_id', triplet.study_id)
        .or(`chunk_text.ilike.%${triplet.subject_name}%,chunk_text.ilike.%${triplet.object_name}%`)
        .limit(3);

      if (chunks && chunks.length > 0) {
        contextText = chunks.map(c => c.chunk_text).join('\n\n');
      }
    }

    // 3. If no chunks, try full_text_content
    if (!contextText && triplet.study_id) {
      const { data: study } = await supabase
        .from('processed_studies')
        .select('full_text_content, title')
        .eq('id', triplet.study_id)
        .single();

      if (study?.full_text_content) {
        // Extract a relevant portion around the subject/object names
        const text = study.full_text_content;
        const idx = text.toLowerCase().indexOf(triplet.subject_name.toLowerCase());
        if (idx >= 0) {
          const start = Math.max(0, idx - 500);
          const end = Math.min(text.length, idx + 1500);
          contextText = text.substring(start, end);
        } else {
          contextText = text.substring(0, 2000);
        }
      }
    }

    if (!contextText) {
      return new Response(JSON.stringify({ 
        error: 'No source text available for enrichment',
        enriched: false 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Guard-rail #1: excerpt too short to support a reliable judgment
    if (contextText.trim().length < 80) {
      await supabase.from('triplet_extractions').update({
        enrichment_source: 'none',
        enrichment_needs_review: true,
        enrichment_at: new Date().toISOString(),
      }).eq('id', tripletId);
      return new Response(JSON.stringify({
        enriched: false,
        skipped_reason: 'source_excerpt_too_short',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Call LLM to extract evidence_level, intensity, and rationale
    const VALID_EVIDENCE_LEVELS = [
      "meta_analysis", "rct", "cohort", "case_control", "case_report",
      "in_vivo", "animal_study", "in_vitro", "expert_opinion"
    ];

    const prompt = `You are a scientific evidence analyst grading a single biological relationship extracted from a study.

## Relationship to analyze
- Subject: ${triplet.subject_name} (${triplet.subject_type})
- Predicate: ${triplet.predicate}
- Object: ${triplet.object_name} (${triplet.object_type})

## Source text (verbatim from the study)
${contextText.substring(0, 3000)}

## Your task — return THREE fields via the tool call:

### 1. evidence_level — pick the BEST fit from this list:
- "meta_analysis" — systematic review pooling multiple RCTs/cohorts
- "rct" — randomized controlled trial in the target species (dogs preferred)
- "cohort" — prospective/retrospective cohort observational study
- "case_control" — case-control observational study
- "case_report" — single or small case series
- "in_vivo" — controlled experimental study in live animals (dogs, rats, mice) WITHOUT randomization/control of an RCT
- "animal_study" — synonym of in_vivo when species/design is unclear; use only if "in_vivo" doesn't fit
- "in_vitro" — cell culture / isolated tissue / biochemical assay only
- "expert_opinion" — narrative review, textbook, guideline without primary data

### 2. intensity — 0.0 to 1.0, ANCHORED in the magnitude actually reported:
- 0.0–0.15 — no effect, non-significant trend, or NEGATIVE result ("did not differ", "p>0.05", "no improvement")
- 0.15–0.35 — small effect (≤20% change in marker, weak correlation r<0.3, modest symptomatic relief)
- 0.35–0.6 — moderate effect (20–50% change, clear clinical improvement, r=0.3–0.6)
- 0.6–0.85 — strong effect (>50% change, robust remission, r>0.6, dose-response confirmed)
- 0.85–1.0 — near-complete or complete resolution / cure / >80% improvement
- If the text describes the relationship but does NOT quantify magnitude, default to 0.4 and say so in the rationale.
- CRITICAL: if the result was null/negative ("no significant effect", "failed to improve"), intensity MUST be ≤ 0.15 even if the relationship is named.

### 3. confidence_rationale — exactly this format, ≤2 sentences then a literal quote:
"<one sentence justifying evidence_level + intensity>. Source excerpt: \"<verbatim quote from the source text, ≤300 chars, that supports the judgment>\""

If you cannot find a verbatim supporting quote, return intensity ≤ 0.2 and write: 'Source excerpt: not found in provided text.'`;

    const tools = [{
      type: "function",
      function: {
        name: "enrich_triplet",
        description: "Provide enriched metadata for the triplet",
        parameters: {
          type: "object",
          properties: {
            evidence_level: {
              type: "string",
              enum: ["meta_analysis", "rct", "cohort", "case_control", "case_report", "in_vivo", "animal_study", "in_vitro", "expert_opinion"]
            },
            intensity: { type: "number", description: "Effect strength 0.0-1.0" },
            confidence_rationale: { type: "string", description: "1-2 sentences ending with a literal Source excerpt quote from the text" },
            self_confidence: { type: "number", description: "Your self-confidence in this judgment, 0.0 to 1.0." },
            source_quote: { type: "string", description: "Verbatim quote ≤300 chars from source text or empty." }
          },
          required: ["evidence_level", "intensity", "confidence_rationale", "self_confidence", "source_quote"]
        }
      }
    }];

    const routerResult = await callAITask('triplet_enrichment', {
      caller: 'enrich-triplet',
      messages: [{ role: 'user', content: prompt }],
      tools,
      tool_choice: { type: 'function', function: { name: 'enrich_triplet' } },
      fallback: { model_id: 'google/gemini-2.5-flash' },
    });
    const toolCall = routerResult.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const enrichment = JSON.parse(toolCall.function.arguments);
    console.log(`✨ Enrichment result:`, enrichment);

    // Guard-rail #2: verify the AI's quote actually exists in the source text (substring match, normalized)
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const quote = String(enrichment.source_quote || '').trim();
    const quoteFound = quote.length >= 20 && norm(contextText).includes(norm(quote.substring(0, Math.min(quote.length, 200))));
    const selfConfidence = Number(enrichment.self_confidence ?? 0);

    // Decide provenance + review flag
    let enrichmentSource: 'llm' | 'llm_low_confidence' = 'llm';
    let needsReview = false;
    if (!quoteFound || selfConfidence < 0.5) {
      enrichmentSource = 'llm_low_confidence';
      needsReview = true;
    }

    // 5. Update the triplet
    const updateData: Record<string, any> = {};
    if (enrichment.evidence_level && VALID_EVIDENCE_LEVELS.includes(enrichment.evidence_level)) {
      // Map animal_study -> in_vivo for storage (canonical)
      updateData.evidence_level = enrichment.evidence_level === 'animal_study' ? 'in_vivo' : enrichment.evidence_level;
    } else if (enrichment.evidence_level) {
      updateData.evidence_level = 'expert_opinion';
    }
    if (enrichment.intensity !== undefined) updateData.intensity = Math.max(0, Math.min(1, enrichment.intensity));
    if (enrichment.confidence_rationale) updateData.confidence_rationale = enrichment.confidence_rationale;
    updateData.enrichment_source = enrichmentSource;
    updateData.enrichment_confidence = Math.max(0, Math.min(1, selfConfidence));
    updateData.enrichment_needs_review = needsReview;
    updateData.enrichment_at = new Date().toISOString();
    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('triplet_extractions')
      .update(updateData)
      .eq('id', tripletId);

    if (updateError) {
      console.error('Error updating triplet:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      enriched: true,
      evidence_level: enrichment.evidence_level,
      intensity: enrichment.intensity,
      confidence_rationale: enrichment.confidence_rationale,
      enrichment_source: enrichmentSource,
      self_confidence: selfConfidence,
      quote_found: quoteFound,
      needs_review: needsReview,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('enrich-triplet error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
