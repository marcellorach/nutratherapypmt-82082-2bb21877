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

    // Buscar prompts configuráveis do banco de dados
    const { data: systemPromptConfig } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'prompt_triplet_extraction_system')
      .single();

    const { data: userPromptConfig } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'prompt_triplet_extraction_user')
      .single();

    // Default prompts caso não existam no banco
    const DEFAULT_SYSTEM_PROMPT = `You are a scientific knowledge extraction expert specialized in veterinary nutraceuticals. Your task is to generate structured triplets (Subject, Predicate, Object) from scientific study data.

Rules:
1. Extract only factual relationships explicitly stated or strongly implied in the study
2. Use standardized predicates: TREATS, PREVENTS, REDUCES, INCREASES, CAUSES, INHIBITS, ACTIVATES, MODULATES
3. Each triplet must have: subject_type, subject_name, predicate, object_type, object_name
4. Provide confidence scores (0-1) for: llm_confidence
5. Entity types: Nutraceutical, Condition, Mechanism, Effect, Outcome
6. subject_name and object_name must be precise, standardized terms (avoid synonyms)

Format your response as valid JSON array of triplets.`;

    const DEFAULT_USER_PROMPT = `Extract knowledge triplets from this study:

Title: {{TITLE}}

Extracted Entities:
- Nutraceuticals: {{NUTRACEUTICALS}}
- Conditions: {{CONDITIONS}}
- Mechanisms: {{MECHANISMS}}
- Effects: {{EFFECTS}}

Generate structured triplets representing the relationships between these entities. Focus on therapeutic relationships (TREATS, PREVENTS, REDUCES) and mechanistic relationships (ACTIVATES, INHIBITS, MODULATES).`;

    const systemPrompt = systemPromptConfig?.config_value || DEFAULT_SYSTEM_PROMPT;
    let userPrompt = userPromptConfig?.config_value || DEFAULT_USER_PROMPT;

    // Substituir variáveis no prompt do usuário
    userPrompt = userPrompt
      .replace('{{TITLE}}', study.title || 'N/A')
      .replace('{{NUTRACEUTICALS}}', extractedNutraceuticals.map((n: any) => n.name).join(', ') || 'None')
      .replace('{{CONDITIONS}}', extractedConditions.map((c: any) => c.name).join(', ') || 'None')
      .replace('{{MECHANISMS}}', extractedMechanisms.map((m: any) => m.name).join(', ') || 'None')
      .replace('{{EFFECTS}}', extractedEffects.map((e: any) => e.name).join(', ') || 'None');

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
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

    // Calcular KG Match Score real verificando se entidades existem no banco
    const tripletsWithScores = await Promise.all(triplets.map(async (t: any) => {
      let subjectMatchScore = 0;
      let objectMatchScore = 0;

      // Verificar se subject_name existe em nutraceuticals
      if (t.subject_type === 'Nutraceutical' && t.subject_name) {
        const { data: nutriMatch } = await supabase
          .from('nutraceuticals')
          .select('id, name, name_en')
          .or(`name.ilike.%${t.subject_name}%,name_en.ilike.%${t.subject_name}%`)
          .limit(1)
          .single();
        
        if (nutriMatch) {
          subjectMatchScore = 1.0;
          t.subject_id = nutriMatch.id;
        }
      }

      // Verificar se object_name existe em health_conditions
      if (t.object_type === 'Condition' && t.object_name) {
        const { data: condMatch } = await supabase
          .from('health_conditions')
          .select('id, name, name_en')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        
        if (condMatch) {
          objectMatchScore = 1.0;
          t.object_id = condMatch.id;
        }
      }

      const kgMatchScore = (subjectMatchScore + objectMatchScore) / 2;
      const extractionConfidence = ((t.llm_confidence || 0.7) + kgMatchScore) / 2;

      return {
        study_id: studyId,
        subject_type: t.subject_type || 'Unknown',
        subject_name: t.subject_name,
        subject_id: t.subject_id || null,
        predicate: t.predicate,
        object_type: t.object_type || 'Unknown',
        object_name: t.object_name,
        object_id: t.object_id || null,
        llm_confidence: t.llm_confidence || 0.7,
        kg_match_score: kgMatchScore,
        extraction_confidence: extractionConfidence,
        curation_status: extractionConfidence >= 0.9 ? 'approved' : 'pending',
        auto_approved: extractionConfidence >= 0.9,
        synced_to_neo4j: false
      };
    }));

    const { data: insertedTriplets, error: insertError } = await supabase
      .from('triplet_extractions')
      .insert(tripletsWithScores)
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
