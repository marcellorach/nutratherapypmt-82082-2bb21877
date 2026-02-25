import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    // 4. Call LLM to extract evidence_level, intensity, and rationale
    const prompt = `You are a scientific evidence analyst. Given the following text excerpt from a study and a specific biological relationship, determine:

1. **evidence_level**: The type of study evidence. Must be one of: "meta_analysis", "rct", "cohort", "case_control", "case_report", "in_vitro", "in_vivo", "expert_opinion"
2. **intensity**: The strength of the observed effect on a scale of 0.0 to 1.0 (0.0 = no effect, 0.5 = moderate, 1.0 = complete resolution)
3. **confidence_rationale**: A brief explanation (1-2 sentences) of why you assigned these values

## Relationship to analyze:
- Subject: ${triplet.subject_name} (${triplet.subject_type})
- Predicate: ${triplet.predicate}
- Object: ${triplet.object_name} (${triplet.object_type})

## Source text:
${contextText.substring(0, 3000)}

Return your analysis using the provided tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "enrich_triplet",
            description: "Provide enriched metadata for the triplet",
            parameters: {
              type: "object",
              properties: {
                evidence_level: { 
                  type: "string", 
                  enum: ["meta_analysis", "rct", "cohort", "case_control", "case_report", "in_vitro", "in_vivo", "expert_opinion"]
                },
                intensity: { type: "number", description: "Effect strength 0.0-1.0" },
                confidence_rationale: { type: "string", description: "Brief explanation of the assessment" }
              },
              required: ["evidence_level", "intensity", "confidence_rationale"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "enrich_triplet" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const enrichment = JSON.parse(toolCall.function.arguments);
    console.log(`✨ Enrichment result:`, enrichment);

    // 5. Update the triplet
    const updateData: Record<string, any> = {};
    if (enrichment.evidence_level) updateData.evidence_level = enrichment.evidence_level;
    if (enrichment.intensity !== undefined) updateData.intensity = enrichment.intensity;
    if (enrichment.confidence_rationale) updateData.confidence_rationale = enrichment.confidence_rationale;
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
      confidence_rationale: enrichment.confidence_rationale
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
