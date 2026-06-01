import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAXONOMY_CATEGORIES = [
  { key: 'nutraceuticals', description: 'Natural compounds, supplements, vitamins, minerals, herbal extracts' },
  { key: 'drugs', description: 'Pharmaceutical compounds' },
  { key: 'enzymes', description: 'Proteins that catalyze reactions (catalase, kinases, etc.)' },
  { key: 'receptors', description: 'Membrane/nuclear proteins that bind ligands (PPAR, GPCRs, etc.)' },
  { key: 'genes_proteins', description: 'Growth factors, cytokines, transcription factors' },
  { key: 'pathways', description: 'Signaling cascades (NF-κB, MAPK, mTOR, etc.)' },
  { key: 'mechanisms', description: 'Molecular actions (phosphorylation, receptor agonism, etc.)' },
  { key: 'biological_processes', description: 'Cellular functions (autophagy, apoptosis, etc.)' },
  { key: 'conditions', description: 'Diseases and clinical outcomes' },
  { key: 'cells', description: 'Cell types (macrophages, neurons, etc.)' },
  { key: 'cell_components', description: 'Subcellular structures (mitochondria, ER, etc.)' },
  { key: 'species', description: 'Animal species' },
  { key: 'breeds', description: 'Specific breeds' },
  { key: 'age_groups', description: 'Life stages (puppy, adult, senior, etc.)' },
];

const PERSONA_FALLBACK = `You are a biomedical ontology expert. Your task is to classify entity names into the most appropriate taxonomy category.

Rules:
1. Choose the MOST specific and accurate category for each entity
2. Provide a confidence score between 0 and 1
3. Include brief reasoning for your classification
4. Suggest alternative categories if applicable
5. If unsure, use lower confidence and suggest alternatives`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entities, context = "veterinary nutraceutical research" } = await req.json();

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return new Response(
        JSON.stringify({ error: "entities array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("❌ LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Analyzing ${entities.length} entities for taxonomy classification`);

    const categoryDescriptions = TAXONOMY_CATEGORIES.map(c => `- ${c.key}: ${c.description}`).join('\n');

    const persona = await fetchSystemPrompt('suggest_taxonomy_terms', PERSONA_FALLBACK);
    const systemPrompt = `${persona}

Domain context: ${context}.

Available categories:
${categoryDescriptions}`;

    const userPrompt = `Classify these biomedical entities into taxonomy categories:

${entities.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')}

For each entity, determine the most appropriate category from the available taxonomy.`;

    const model = "google/gemini-2.5-flash";
    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_entities",
              description: "Return taxonomy classifications for biomedical entities",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        entity: { type: "string", description: "Original entity name" },
                        suggested_category: { 
                          type: "string", 
                          enum: TAXONOMY_CATEGORIES.map(c => c.key),
                          description: "Most appropriate taxonomy category" 
                        },
                        confidence: { 
                          type: "number", 
                          minimum: 0, 
                          maximum: 1,
                          description: "Confidence score 0-1" 
                        },
                        reasoning: { type: "string", description: "Brief explanation for classification" },
                        alternative_categories: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Other possible categories"
                        }
                      },
                      required: ["entity", "suggested_category", "confidence", "reasoning"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_entities" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ AI Gateway error:", response.status, errorText);
      await logPromptUsage({
        prompt_key: 'suggest_taxonomy_terms',
        function_name: 'suggest-taxonomy-terms',
        model,
        latency_ms: Date.now() - t0,
        success: false,
        error: `HTTP ${response.status}`,
      });

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI classification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("✅ AI response received");

    // Extract tool call results
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "classify_entities") {
      console.error("❌ Invalid tool call response:", data);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`✅ Classified ${result.suggestions?.length || 0} entities`);

    await logPromptUsage({
      prompt_key: 'suggest_taxonomy_terms',
      function_name: 'suggest-taxonomy-terms',
      model,
      latency_ms: Date.now() - t0,
      tokens_in: data?.usage?.prompt_tokens,
      tokens_out: data?.usage?.completion_tokens,
      success: true,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions: result.suggestions,
        model,
        processed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error in suggest-taxonomy-terms:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
