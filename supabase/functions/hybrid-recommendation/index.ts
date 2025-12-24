import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PetProfile {
  species?: string;
  breed?: string;
  age?: number;
  weight?: number;
}

interface KGData {
  nutraceuticals: Array<{
    name: string;
    dosage: string;
    mechanism: string;
    evidenceLevel: string;
  }>;
  rationale: string;
  precautions: string[];
}

interface HybridRequest {
  mode: 'enrich' | 'fallback';
  petProfile: PetProfile;
  condition: string;
  kgData?: KGData;
}

const SYSTEM_PROMPT_ENRICH = `You are a veterinary nutraceutical expert. You are enriching an existing recommendation with additional context.

Your role is to:
1. Add clinical considerations the Knowledge Graph may have missed
2. Suggest monitoring parameters
3. Note potential interactions

Keep your response concise and focused. Do not contradict the existing recommendation.
Respond in Portuguese (Brazilian).`;

const SYSTEM_PROMPT_FALLBACK = `You are a veterinary nutraceutical expert providing recommendations with LIMITED DATA.

CRITICAL: Our Knowledge Graph does NOT have sufficient data for this specific case.
You MUST be conservative and emphasize the need for veterinary oversight.

Your response MUST follow this JSON structure:
{
  "nutraceuticals": [
    {
      "name": "string",
      "dosage": "string (conservative dosage)",
      "mechanism": "string",
      "evidenceLevel": "AI-generated"
    }
  ],
  "rationale": "string (explain your reasoning)",
  "precautions": ["array of precautions"]
}

Guidelines:
- Recommend only well-established nutraceuticals
- Use conservative dosages
- Always include precautions
- Respond in Portuguese (Brazilian)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, petProfile, condition, kgData }: HybridRequest = await req.json();
    
    console.log('Hybrid recommendation request:', { mode, condition, petProfile });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'enrich') {
      systemPrompt = SYSTEM_PROMPT_ENRICH;
      userPrompt = `
Pet Profile:
- Species: ${petProfile.species || 'Unknown'}
- Breed: ${petProfile.breed || 'Unknown'}
- Age: ${petProfile.age ? `${petProfile.age} years` : 'Unknown'}
- Weight: ${petProfile.weight ? `${petProfile.weight} kg` : 'Unknown'}

Condition: ${condition}

Existing KG Recommendation:
${kgData?.nutraceuticals?.map(n => `- ${n.name}: ${n.dosage} (${n.mechanism})`).join('\n') || 'None'}

Existing Rationale: ${kgData?.rationale || 'None'}

Please provide additional clinical considerations and monitoring recommendations (2-3 sentences max).`;

    } else {
      systemPrompt = SYSTEM_PROMPT_FALLBACK;
      userPrompt = `
Pet Profile:
- Species: ${petProfile.species || 'Unknown'}
- Breed: ${petProfile.breed || 'Unknown'}
- Age: ${petProfile.age ? `${petProfile.age} years` : 'Unknown'}
- Weight: ${petProfile.weight ? `${petProfile.weight} kg` : 'Unknown'}

Target Condition: ${condition}

Generate a nutraceutical recommendation. Remember:
1. Our Knowledge Graph has INSUFFICIENT data for this case
2. Be conservative with dosages
3. Include precautions
4. Recommend veterinary consultation

Return your response as valid JSON.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        temperature: 0.3, // Low temperature for more consistent outputs
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Usage limit exceeded. Please add credits.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    console.log('AI response received:', content.substring(0, 200));

    if (mode === 'enrich') {
      return new Response(JSON.stringify({ enrichment: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse JSON response for fallback mode
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonContent);
      
      // Ensure required fields exist
      const result = {
        nutraceuticals: parsed.nutraceuticals || [],
        rationale: parsed.rationale || 'Recomendação gerada por IA com base em conhecimento geral.',
        precautions: parsed.precautions || [
          'Esta recomendação requer validação por veterinário',
          'Iniciar com doses conservadoras',
          'Monitorar reações de perto'
        ]
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Return a safe fallback
      return new Response(JSON.stringify({
        nutraceuticals: [],
        rationale: content || 'Não foi possível gerar uma recomendação estruturada. Consulte um veterinário.',
        precautions: [
          'Esta recomendação requer validação por veterinário',
          'Iniciar com doses conservadoras',
          'Monitorar reações de perto'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in hybrid recommendation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      nutraceuticals: [],
      rationale: 'Erro ao gerar recomendação. Por favor, consulte um veterinário.',
      precautions: ['Consultar veterinário antes de qualquer suplementação']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
