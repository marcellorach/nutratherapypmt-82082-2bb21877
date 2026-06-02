import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

/**
 * Buckets de abstain — desambiguam a CAUSA da abstenção para medição
 * antes/depois da migração para tool_choice (Card #5, migração #2).
 *
 *   - `clinical_signal_insufficient` (HONESTA): texto vazio/curto OU o modelo,
 *     com schema fechado, declarou `abstain:true`. Esta é a única abstenção
 *     que DEVE existir em regime — corresponde a "não dá para dizer nada com
 *     responsabilidade". Card #4 preservado.
 *   - `model_unavailable` (INFRA): chave/Gateway indisponível, 5xx. Não é
 *     falta de sinal — é falha de provedor. Antes do Card #4, este caminho
 *     fabricava entidades silenciosamente.
 *   - `model_response_invalid` (PARSE/SCHEMA): resposta vazia, sem tool_call,
 *     ou argumentos malformados. Com `tool_choice` forçado, este bucket DEVE
 *     cair a ~0 — é o termômetro do sucesso desta migração.
 */
type AbstainReason =
  | 'clinical_signal_insufficient'
  | 'model_unavailable'
  | 'model_response_invalid';

const EMPTY_ENTITIES = {
  conditions: [] as unknown[],
  medications: [] as unknown[],
  symptoms: [] as unknown[],
  examResults: [] as unknown[],
  biomarkers: [] as unknown[],
};

function abstainResponse(
  reason: AbstainReason,
  detail: string,
  status = 200,
  latencyMs?: number,
) {
  // Telemetria não-bloqueante — viabiliza ANTES/DEPOIS via grep no log.
  // (logPromptUsage atual não tem coluna validation_status; usamos
  // success=false + error="abstain:<reason>" como proxy de bucket.)
  logPromptUsage({
    prompt_key: 'extract_pet_clinical_data',
    function_name: 'extract-pet-clinical-data',
    model: 'google/gemini-2.5-flash',
    latency_ms: latencyMs ?? null,
    success: false,
    error: `abstain:${reason}`,
  });
  console.warn(
    `extract-pet-clinical-data abstain reason=${reason} detail=${JSON.stringify(detail)}`,
  );
  return new Response(
    JSON.stringify({
      abstain: true,
      abstain_reason: reason,
      abstain_detail: detail,
      source: 'llm_fallback',
      disclaimer: 'no_kg_data',
      ...EMPTY_ENTITIES,
    }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

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

CALL THE TOOL "extract_clinical_entities". Use empty arrays for categories with no entities.
Be precise with medical terminology. Prefer standardized condition names when possible.

ABSTAIN RULE (rede de segurança — Card #4 preservada):
- Se o texto não tem QUALQUER sinal clínico extraível (ex.: cumprimento, pergunta genérica,
  ruído, sem condição/sintoma/medicação/exame/biomarcador), responda com
  abstain=true, abstain_reason="clinical_signal_insufficient", abstain_detail=<por quê>,
  e as 5 listas vazias. NÃO invente entidades por viés de completude.

CLINICAL LANGUAGE LAYER (mandatory):
- The veterinarian writes in TRADITIONAL clinical language (e.g., "OA moderada bilateral", "ALT elevada", "perda de massa muscular", "Carprofen 2 mg/kg BID").
- DO NOT introduce geroscience terminology (senescence, inflammaging, NAD+, autophagy, mitochondrial dysfunction, hallmarks of aging, senolytics, geroprotector) into the extracted entities. Geroscience interpretation is the responsibility of downstream system layers, never attributed to the vet.
- Extract findings exactly as documented; normalize naming only within traditional veterinary nomenclature.`;

// Card #5 (migração #2): tool fechado substitui responseMimeType=json_object.
// GUARDRAIL — schema MANTÉM abstain + abstain_reason (rede do Card #4).
// abstain=true com listas vazias é resposta VÁLIDA do tool, não erro de parse.
const EXTRACT_CLINICAL_TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_clinical_entities',
    description:
      'Extrai entidades clínicas estruturadas (condições, medicações, sintomas, exames, biomarcadores) de texto clínico canino. Use abstain=true quando o texto não tiver sinal clínico extraível.',
    parameters: {
      type: 'object',
      properties: {
        abstain: {
          type: 'boolean',
          description:
            'true quando o texto NÃO tem sinal clínico extraível (apenas conversa/ruído). Nesse caso, as 5 listas DEVEM estar vazias e abstain_reason DEVE ser preenchido.',
        },
        abstain_reason: {
          type: ['string', 'null'],
          enum: ['clinical_signal_insufficient', null],
          description: 'Obrigatório quando abstain=true.',
        },
        abstain_detail: {
          type: ['string', 'null'],
          description: 'Frase curta explicando por que o texto não tem sinal.',
        },
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              severity: {
                type: ['string', 'null'],
                enum: ['mild', 'moderate', 'severe', null],
              },
              details: { type: ['string', 'null'] },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        medications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dosage: { type: ['string', 'null'] },
              type: { type: ['string', 'null'] },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        symptoms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: ['string', 'null'] },
              frequency: { type: ['string', 'null'] },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        examResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              findings: { type: ['string', 'null'] },
            },
            required: ['type'],
            additionalProperties: false,
          },
        },
        biomarkers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: ['number', 'string', 'null'] },
              unit: { type: ['string', 'null'] },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
      },
      required: [
        'abstain',
        'conditions',
        'medications',
        'symptoms',
        'examResults',
        'biomarkers',
      ],
      additionalProperties: false,
    },
  },
};

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
    // `simpleExtraction` rule-based, que silenciosamente fabricava entidades.
    const trimmed = clinicalText.trim();
    if (trimmed.length < 12) {
      return abstainResponse(
        'clinical_signal_insufficient',
        'Texto clínico muito curto para extração responsável.',
      );
    }

    if (!LOVABLE_API_KEY) {
      return abstainResponse(
        'model_unavailable',
        'Lovable AI Gateway indisponível (chave ausente).',
        503,
      );
    }

    const promptTemplate = await fetchSystemPrompt('extract_pet_clinical_data', SYSTEM_PROMPT_FALLBACK);
    const systemPrompt = promptTemplate
      .replace('{{breed}}', existingProfile?.breed || 'Unknown')
      .replace('{{age}}', String(existingProfile?.age || 'Unknown'));

    const model = 'google/gemini-2.5-flash';
    const t0 = Date.now();
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Clinical text:\n"${clinicalText}"` },
        ],
        tools: [EXTRACT_CLINICAL_TOOL],
        tool_choice: {
          type: 'function',
          function: { name: 'extract_clinical_entities' },
        },
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('Lovable Gateway error:', aiRes.status, errText.slice(0, 200));
      return abstainResponse(
        'model_unavailable',
        `Falha do Gateway (${aiRes.status}).`,
        502,
        Date.now() - t0,
      );
    }

    const aiJson = await aiRes.json();
    const msg = aiJson.choices?.[0]?.message ?? {};
    const toolCall = Array.isArray(msg.tool_calls) ? msg.tool_calls[0] : null;
    const rawArgs = toolCall?.function?.arguments;

    if (!rawArgs) {
      // tool_choice forçado deveria garantir tool_call — chegar aqui é raro.
      return abstainResponse(
        'model_response_invalid',
        'Modelo não retornou tool_call apesar de tool_choice forçado.',
        502,
        Date.now() - t0,
      );
    }

    let parsed: any;
    try {
      parsed = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
    } catch (e) {
      return abstainResponse(
        'model_response_invalid',
        `Argumentos do tool não parsearam: ${(e as Error).message}`,
        502,
        Date.now() - t0,
      );
    }

    // GUARDRAIL Card #4: se o modelo decidiu abstain via tool, respeitar.
    if (parsed.abstain === true) {
      return abstainResponse(
        'clinical_signal_insufficient',
        parsed.abstain_detail || 'Modelo declarou ausência de sinal clínico.',
        200,
        Date.now() - t0,
      );
    }

    logPromptUsage({
      prompt_key: 'extract_pet_clinical_data',
      function_name: 'extract-pet-clinical-data',
      model,
      latency_ms: Date.now() - t0,
      tokens_in: aiJson?.usage?.prompt_tokens ?? null,
      tokens_out: aiJson?.usage?.completion_tokens ?? null,
      success: true,
    });

    return new Response(
      JSON.stringify({
        abstain: false,
        source: 'llm_fallback',
        disclaimer: 'none',
        conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
        examResults: Array.isArray(parsed.examResults) ? parsed.examResults : [],
        biomarkers: Array.isArray(parsed.biomarkers) ? parsed.biomarkers : [],
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
