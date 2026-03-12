import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface ClinicalContext {
  allConditions?: string[];
  predispositions?: string[];
  labAlerts?: string[];
  currentMedications?: string[];
  examSummary?: string[];
}

interface KGData {
  nutraceuticals: Array<{
    name: string;
    dosage: string;
    mechanism: string;
    evidenceLevel: string;
    condition?: string;
  }>;
  rationale: string;
  precautions: string[];
}

interface HybridRequest {
  mode: 'enrich' | 'fallback';
  petProfile: PetProfile;
  condition: string;
  kgData?: KGData;
  clinicalContext?: ClinicalContext;
}

function buildClinicalContextBlock(ctx?: ClinicalContext): string {
  if (!ctx) return '';
  
  const sections: string[] = [];
  
  if (ctx.allConditions?.length) {
    sections.push(`Active Conditions: ${ctx.allConditions.join(', ')}`);
  }
  if (ctx.predispositions?.length) {
    sections.push(`Breed Predispositions (undiagnosed risks):\n${ctx.predispositions.map(p => `  - ${p}`).join('\n')}`);
  }
  if (ctx.labAlerts?.length) {
    sections.push(`Abnormal Lab Results:\n${ctx.labAlerts.map(a => `  - ${a}`).join('\n')}`);
  }
  if (ctx.currentMedications?.length) {
    sections.push(`Current Medications: ${ctx.currentMedications.join(', ')}`);
  }
  if (ctx.examSummary?.length) {
    sections.push(`Recent Exams:\n${ctx.examSummary.map(e => `  - ${e}`).join('\n')}`);
  }
  
  return sections.length > 0 ? `\n\nPATIENT CLINICAL CONTEXT:\n${sections.join('\n\n')}` : '';
}

const SYSTEM_PROMPT_ENRICH = `You are a veterinary nutraceutical expert specializing in individualized geroprotective treatment.

You are enriching an existing Knowledge Graph recommendation with clinical context.

CRITICAL RULES FOR INDIVIDUALIZATION:
1. Analyze the patient's LAB RESULTS — adjust compound selection based on abnormalities
2. Consider CURRENT MEDICATIONS — avoid redundancy and flag interactions  
3. Factor in BREED PREDISPOSITIONS — preventive compounds for undiagnosed risks
4. Age-appropriate dosing — geriatric patients need adjusted doses
5. For each compound, specify WHICH CONDITION it targets (not generic)

Your enrichment MUST be specific to THIS patient. Do not give generic advice.
Respond in Portuguese (Brazilian).`;

const SYSTEM_PROMPT_FALLBACK = `You are a veterinary nutraceutical expert providing INDIVIDUALIZED recommendations.

CRITICAL: Our Knowledge Graph has LIMITED data for this case. You MUST be conservative.
However, you MUST use the patient's clinical context to differentiate your recommendation.

INDIVIDUALIZATION REQUIREMENTS:
1. Analyze abnormal lab values → recommend compounds that address those specific findings
2. Consider current medications → avoid interactions, avoid redundancy
3. Factor in breed predispositions → include preventive compounds
4. Each compound MUST specify which condition/finding it targets
5. Dosages must be adjusted for the patient's weight and age

Your response MUST follow this JSON structure:
{
  "nutraceuticals": [
    {
      "name": "string",
      "dosage": "string (weight-adjusted conservative dosage)",
      "mechanism": "string (why this compound for THIS patient)",
      "evidenceLevel": "AI-generated",
      "condition": "string (specific condition this targets)",
      "targetCondition": "string (same as condition)"
    }
  ],
  "rationale": "string (patient-specific reasoning)",
  "precautions": ["array of patient-specific precautions"]
}

Guidelines:
- Recommend only well-established nutraceuticals
- Use conservative dosages adjusted for patient weight
- Always include precautions specific to this patient's medications/conditions
- Respond in Portuguese (Brazilian)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, petProfile, condition, kgData, clinicalContext }: HybridRequest = await req.json();
    
    console.log('Hybrid recommendation request:', { mode, condition, petProfile, hasContext: !!clinicalContext });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const contextBlock = buildClinicalContextBlock(clinicalContext);
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

Primary Condition: ${condition}
${contextBlock}

Existing KG Recommendation:
${kgData?.nutraceuticals?.map(n => `- ${n.name}: ${n.dosage} (${n.mechanism}) [targets: ${n.condition || condition}]`).join('\n') || 'None'}

Existing Rationale: ${kgData?.rationale || 'None'}

IMPORTANT: Based on this patient's SPECIFIC lab results, medications, and breed risks:
1. Which of the KG-recommended compounds are MOST relevant for this patient? Why?
2. Are there compounds that should be ADDED based on the lab abnormalities?
3. Are there any PRECAUTIONS specific to this patient's current medications?
4. Suggest monitoring parameters based on the lab findings.

For each recommended compound, specify which condition/finding it targets.
Keep response to 3-5 focused paragraphs.`;

    } else {
      systemPrompt = SYSTEM_PROMPT_FALLBACK;
      userPrompt = `
Pet Profile:
- Species: ${petProfile.species || 'Unknown'}
- Breed: ${petProfile.breed || 'Unknown'}
- Age: ${petProfile.age ? `${petProfile.age} years` : 'Unknown'}
- Weight: ${petProfile.weight ? `${petProfile.weight} kg` : 'Unknown'}

Target Condition: ${condition}
${contextBlock}

Generate an INDIVIDUALIZED nutraceutical recommendation for THIS specific patient.

CRITICAL REQUIREMENTS:
1. Each compound must target a SPECIFIC condition or lab finding from this patient
2. Dosages must be calculated for this patient's weight (${petProfile.weight || '?'} kg)
3. Do NOT recommend compounds that interact with current medications
4. Include breed-specific considerations
5. Our Knowledge Graph has INSUFFICIENT data — be conservative

Return your response as valid JSON following the structure specified.`;
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
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit exceeded. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    console.log('AI response received:', content.substring(0, 300));

    if (mode === 'enrich') {
      // Try to parse structured JSON from enrich mode too
      // The LLM may return structured recommendations or free text
      try {
        let jsonContent = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonContent = jsonMatch[1];
        
        const parsed = JSON.parse(jsonContent);
        if (parsed.nutraceuticals && Array.isArray(parsed.nutraceuticals)) {
          // Merge KG compounds with LLM-enriched ones
          const enrichedNutraceuticals = [
            ...(kgData?.nutraceuticals || []).map((n: any) => ({
              ...n,
              evidenceLevel: n.evidenceLevel || 'KG-backed',
              condition: n.condition || condition,
            })),
            ...parsed.nutraceuticals.filter((n: any) => {
              const existingNames = (kgData?.nutraceuticals || []).map((k: any) => k.name?.toLowerCase());
              return !existingNames.includes(n.name?.toLowerCase());
            }).map((n: any) => ({
              ...n,
              evidenceLevel: 'AI-enriched',
              condition: n.condition || n.targetCondition || condition,
            })),
          ];
          return new Response(JSON.stringify({
            nutraceuticals: enrichedNutraceuticals,
            rationale: parsed.rationale || kgData?.rationale || `Recomendação enriquecida por IA para ${condition}.`,
            precautions: [...(kgData?.precautions || []), ...(parsed.precautions || [])],
            enrichment: content,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (_) {
        // Not JSON — treat as text enrichment, but still return structured payload
      }

      // Fallback: return KG compounds + text enrichment
      return new Response(JSON.stringify({
        nutraceuticals: (kgData?.nutraceuticals || []).map((n: any) => ({
          ...n,
          evidenceLevel: n.evidenceLevel || 'KG-backed',
          condition: n.condition || condition,
        })),
        rationale: `${kgData?.rationale || ''}\n\nConsiderações adicionais: ${content}`,
        precautions: [...(kgData?.precautions || []), 'Alguns dados foram enriquecidos por IA - verificar com veterinário'],
        enrichment: content,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse JSON response for fallback mode
    try {
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonContent = jsonMatch[1];
      
      const parsed = JSON.parse(jsonContent);
      const result = {
        nutraceuticals: (parsed.nutraceuticals || []).map((n: any) => ({
          ...n,
          condition: n.condition || n.targetCondition || condition,
          targetCondition: n.targetCondition || n.condition || condition,
        })),
        rationale: parsed.rationale || 'Recomendação gerada por IA com base em contexto clínico individualizado.',
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
      return new Response(JSON.stringify({
        nutraceuticals: [],
        rationale: content || 'Não foi possível gerar uma recomendação estruturada. Consulte um veterinário.',
        precautions: ['Esta recomendação requer validação por veterinário', 'Iniciar com doses conservadoras']
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
