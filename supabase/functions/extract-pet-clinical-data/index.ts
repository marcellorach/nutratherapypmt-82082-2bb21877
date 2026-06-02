import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT_FALLBACK = `You are a veterinary clinical data extraction assistant. Extract structured medical entities from clinical text about canine patients.

Given a clinical description, extract:
1. **conditions**: Diagnosed conditions or diseases (name, severity if mentioned: mild/moderate/severe, any additional details like laterality)
2. **medications**: Medications being taken (name, dosage if mentioned, type/class)
3. **symptoms**: Clinical symptoms observed (name, duration if mentioned, frequency)
4. **examResults**: Exam or test results (type of exam, findings/results)
5. **biomarkers**: Lab values or biomarkers (name, value, unit)

Context about the patient:
- Species: Canine
- Breed: {{breed}}
- Age: {{age}} years

Return a JSON object with these 5 arrays. If a category has no entities, return an empty array.
Be precise with medical terminology. Prefer standardized condition names when possible.

CLINICAL LANGUAGE LAYER (mandatory):
- The veterinarian writes in TRADITIONAL clinical language (e.g., "OA moderada bilateral", "ALT elevada", "perda de massa muscular", "Carprofen 2 mg/kg BID").
- DO NOT introduce geroscience terminology (senescence, inflammaging, NAD+, autophagy, mitochondrial dysfunction, hallmarks of aging, senolytics, geroprotector) into the extracted entities. Geroscience interpretation is the responsibility of downstream system layers, never attributed to the vet.
- Extract findings exactly as documented; normalize naming only within traditional veterinary nomenclature.

Always respond with valid JSON only, no additional text.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { petId, clinicalText, existingProfile } = await req.json();

    if (!clinicalText || typeof clinicalText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'clinicalText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Pré-flight de abstenção (Card #3/#4) ────────────────────────────
    // abstain por falta de sinal clínico de entrada — substitui o antigo
    // `simpleExtraction` rule-based, que silenciosamente fabricava entidades
    // marcando confiança como se fosse extração real.
    const trimmed = clinicalText.trim();
    if (trimmed.length < 12) {
      console.warn('extract-pet-clinical-data abstaining: clinical_signal_insufficient (text too short)');
      return new Response(JSON.stringify({
        abstain: true,
        abstain_reason: 'clinical_signal_insufficient',
        abstain_detail: 'Texto clínico muito curto para extração responsável.',
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        conditions: [], medications: [], symptoms: [], examResults: [], biomarkers: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const promptTemplate = await fetchSystemPrompt('extract_pet_clinical_data', SYSTEM_PROMPT_FALLBACK);
    const systemPrompt = promptTemplate
      .replace('{{breed}}', existingProfile?.breed || 'Unknown')
      .replace('{{age}}', String(existingProfile?.age || 'Unknown'));

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      // Card #4: removido `simpleExtraction` (regex rule-based) — substituído
      // por abstain explícito. Antes, a ausência da chave fazia o sistema
      // fabricar entidades silenciosamente.
      console.error('extract-pet-clinical-data: GEMINI_API_KEY missing — abstaining');
      return new Response(JSON.stringify({
        abstain: true,
        abstain_reason: 'clinical_signal_insufficient',
        abstain_detail: 'Modelo de extração indisponível (chave ausente).',
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        conditions: [], medications: [], symptoms: [], examResults: [], biomarkers: [],
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nClinical text:\n"${clinicalText}"` }] }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({
        abstain: true,
        abstain_reason: 'clinical_signal_insufficient',
        abstain_detail: `Falha do modelo de extração (${response.status}).`,
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        conditions: [], medications: [], symptoms: [], examResults: [], biomarkers: [],
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({
        abstain: true,
        abstain_reason: 'clinical_signal_insufficient',
        abstain_detail: 'Resposta vazia do modelo de extração.',
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        conditions: [], medications: [], symptoms: [], examResults: [], biomarkers: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        return new Response(JSON.stringify({
          abstain: true,
          abstain_reason: 'clinical_signal_insufficient',
          abstain_detail: 'Resposta do modelo não pôde ser parseada como JSON.',
          source: 'llm_fallback',
          disclaimer: 'no_kg_data',
          conditions: [], medications: [], symptoms: [], examResults: [], biomarkers: [],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(
      JSON.stringify({
        abstain: false,
        source: 'llm_fallback',
        disclaimer: 'none',
        conditions: parsed.conditions || [],
        medications: parsed.medications || [],
        symptoms: parsed.symptoms || [],
        examResults: parsed.examResults || [],
        biomarkers: parsed.biomarkers || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-pet-clinical-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
