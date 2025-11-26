import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripletRequest {
  studyId: string;
}

/**
 * Edge Function para gerar triplets estruturados a partir de estudos processados
 * usando Lovable AI (Gemini 2.5 Flash)
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId }: TripletRequest = await req.json();

    if (!studyId) {
      return new Response(
        JSON.stringify({ error: 'studyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do estudo processado
    const { data: study, error: studyError } = await supabase
      .from('processed_studies')
      .select('id, title, analysis_data, full_text_content')
      .eq('id', studyId)
      .single();

    if (studyError || !study) {
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar contexto para extração de triplets
    const analysisData = study.analysis_data || {};
    const extractedNutraceuticals = analysisData.extractedNutraceuticals || [];
    const extractedConditions = analysisData.extractedConditions || [];
    const extractedMechanisms = analysisData.extractedMechanisms || [];
    const extractedEffects = analysisData.extractedEffects || [];

    // Prompt para o modelo gerar triplets estruturados
    const systemPrompt = `You are a scientific knowledge extraction expert. Your task is to generate structured triplets (Subject, Predicate, Object) from scientific study data.

Rules:
1. Extract only factual relationships explicitly stated or strongly implied
2. Use standardized predicates: TREATS, PREVENTS, REDUCES, INCREASES, CAUSES, INHIBITS, ACTIVATES, MODULATES
3. Each triplet must have: subject_type, subject_name, predicate, object_type, object_name
4. Provide confidence scores (0-1) for: llm_confidence, kg_match_score, extraction_confidence
5. Entity types: Nutraceutical, Condition, Mechanism, Effect, Outcome

Format your response as valid JSON array of triplets.`;

    const userPrompt = `Extract knowledge triplets from this study:

Title: ${study.title}

Extracted Entities:
- Nutraceuticals: ${extractedNutraceuticals.map((n: any) => n.name).join(', ')}
- Conditions: ${extractedConditions.map((c: any) => c.name).join(', ')}
- Mechanisms: ${extractedMechanisms.map((m: any) => m.name).join(', ')}
- Effects: ${extractedEffects.map((e: any) => e.name).join(', ')}

Generate structured triplets representing the relationships between these entities.`;

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`Lovable AI request failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const tripletContent = aiData.choices[0].message.content;
    
    // Parse JSON response
    let triplets = [];
    try {
      const parsed = JSON.parse(tripletContent);
      triplets = Array.isArray(parsed.triplets) ? parsed.triplets : [parsed];
    } catch (e) {
      console.error('Failed to parse AI response:', tripletContent);
      throw new Error('Invalid AI response format');
    }

    // Inserir triplets no banco de dados
    const tripletsToInsert = triplets.map((t: any) => ({
      study_id: studyId,
      subject_type: t.subject_type || 'Unknown',
      subject_name: t.subject_name,
      subject_id: null, // Será preenchido pelo matching posterior
      predicate: t.predicate,
      object_type: t.object_type || 'Unknown',
      object_name: t.object_name,
      object_id: null,
      llm_confidence: t.llm_confidence || 0.7,
      kg_match_score: t.kg_match_score || 0.5,
      extraction_confidence: t.extraction_confidence || ((t.llm_confidence + t.kg_match_score) / 2),
      curation_status: (t.extraction_confidence || 0.7) >= 0.9 ? 'approved' : 'pending',
      auto_approved: (t.extraction_confidence || 0.7) >= 0.9,
      synced_to_neo4j: false
    }));

    const { data: insertedTriplets, error: insertError } = await supabase
      .from('triplet_extractions')
      .insert(tripletsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`Generated ${insertedTriplets?.length || 0} triplets from study ${studyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        studyId,
        triplets: insertedTriplets,
        count: insertedTriplets?.length || 0,
        autoApproved: insertedTriplets?.filter((t: any) => t.auto_approved).length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-triplets:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
