import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

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
  // Longitudinal MedGraphRAG context (added phase 6):
  // CURRENT_STATE drives the inference (weight 1.0). CLINICAL_TRAJECTORY
  // gives the model history awareness (weight 0.4). DIET_PROFILE supports
  // nutritional gap-analysis.
  latestConsultation?: {
    date?: string;
    chief_complaint?: string;
    assessment?: string;
    plan?: string;
    weight_kg?: number;
    bcs?: number;
    activeConditions?: string[];
    activeMedications?: string[];
    abnormalExams?: string[];
  };
  clinicalTrajectory?: Array<{
    date?: string;
    daysAgo?: number;
    summary: string;
    conditionsChanged?: string[];
    medicationsChanged?: string[];
    keyExamFindings?: string[];
  }>;
  dietProfile?: {
    diet_type?: string;
    daily_amount_g?: number;
    meals_per_day?: number;
    restrictions?: string[];
    products?: string[];
    macroSummary?: string;
    notes?: string;
    /** Quantitative nutritional gaps computed by the frontend
     *  `nutrition-gap-analyzer` (FEDIAF/AAFCO baseline vs. current diet).
     *  Only non-adequate entries should be sent. */
    gaps?: Array<{
      key: string;
      label: string;
      unit: string;
      status: 'deficient' | 'excess';
      observed: number | null;
      target_min?: number | null;
      target_max?: number | null;
      delta_pct?: number | null;
      rationale?: string;
      source?: string;
    }>;
  };
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
  /** Strip the longitudinal blocks (CURRENT_STATE / CLINICAL_TRAJECTORY / DIET_PROFILE)
   *  from the prompt — used by the with-vs-without comparison evaluator. */
  disableLongitudinal?: boolean;
  /** Returns the rendered prompt + which longitudinal blocks were active. */
  debug?: boolean;
}

function buildClinicalContextBlock(ctx?: ClinicalContext): string {
  if (!ctx) return '';
  
  const sections: string[] = [];

  // Longitudinal blocks first — these dominate inference weighting.
  if (ctx.latestConsultation) {
    const lc = ctx.latestConsultation;
    const lines: string[] = [
      `[WEIGHT: 1.0 — primary signal for inference]`,
      lc.date ? `Date: ${lc.date}` : '',
      lc.chief_complaint ? `Chief complaint: ${lc.chief_complaint}` : '',
      lc.assessment ? `Assessment: ${lc.assessment}` : '',
      lc.plan ? `Plan: ${lc.plan}` : '',
      lc.weight_kg ? `Weight at visit: ${lc.weight_kg} kg` : '',
      lc.bcs ? `Body Condition Score: ${lc.bcs}/9` : '',
      lc.activeConditions?.length ? `Active conditions: ${lc.activeConditions.join(', ')}` : '',
      lc.activeMedications?.length ? `Active medications: ${lc.activeMedications.join(', ')}` : '',
      lc.abnormalExams?.length ? `Abnormal exam findings:\n${lc.abnormalExams.map(e => `  - ${e}`).join('\n')}` : '',
    ].filter(Boolean);
    sections.push(`CURRENT_STATE (latest consultation):\n${lines.join('\n')}`);
  }

  if (ctx.clinicalTrajectory?.length) {
    const lines = ctx.clinicalTrajectory.map(t => {
      const parts = [
        `${t.daysAgo ? `${t.daysAgo}d ago` : (t.date || 'past')}: ${t.summary}`,
      ];
      if (t.conditionsChanged?.length) parts.push(`    conditions: ${t.conditionsChanged.join(', ')}`);
      if (t.medicationsChanged?.length) parts.push(`    meds: ${t.medicationsChanged.join(', ')}`);
      if (t.keyExamFindings?.length) parts.push(`    exams: ${t.keyExamFindings.join('; ')}`);
      return parts.join('\n');
    }).join('\n  - ');
    sections.push(`CLINICAL_TRAJECTORY [WEIGHT: 0.4 — context for progression, response-to-therapy and recidive risk; do NOT re-recommend therapies that already failed]:\n  - ${lines}`);
  }

  if (ctx.dietProfile) {
    const dp = ctx.dietProfile;
    const dlines = [
      dp.diet_type ? `Type: ${dp.diet_type}` : '',
      dp.daily_amount_g ? `Daily amount: ${dp.daily_amount_g}g in ${dp.meals_per_day || '?'} meals` : '',
      dp.products?.length ? `Products: ${dp.products.map((p: any) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') {
          const brand = p.brand || p.raw_brand_text || '';
          const name = p.name || p.product || p.raw_product_text || '';
          const share = p.share_percent != null ? ` (${p.share_percent}%)` : '';
          return `${brand} ${name}${share}`.trim() || JSON.stringify(p);
        }
        return String(p);
      }).join(' + ')}` : '',
      dp.restrictions?.length ? `Restrictions: ${dp.restrictions.join(', ')}` : '',
      dp.macroSummary ? `Nutrition snapshot: ${dp.macroSummary}` : '',
      dp.notes ? `Notes: ${dp.notes}` : '',
    ].filter(Boolean).join('\n');
    sections.push(`DIET_PROFILE [use for nutritional gap-analysis: omega-3 deficit, mineral imbalances, prescription-diet compatibility]:\n${dlines}`);

    if (dp.gaps?.length) {
      const gapLines = dp.gaps.map((g) => {
        const tgt = [
          g.target_min != null ? `≥${g.target_min}` : '',
          g.target_max != null ? `≤${g.target_max}` : '',
        ].filter(Boolean).join(' / ') || '—';
        const delta = g.delta_pct != null ? ` (${g.delta_pct > 0 ? '+' : ''}${g.delta_pct}%)` : '';
        const why = g.rationale ? ` — ${g.rationale}` : '';
        const src = g.source ? ` [${g.source}]` : '';
        return `  - ${g.label} [${g.status.toUpperCase()}]: observed ${g.observed ?? '—'} ${g.unit}, target ${tgt} ${g.unit}${delta}${why}${src}`;
      }).join('\n');
      sections.push(
        `NUTRITION_GAPS [WEIGHT: 0.8 — quantitative deficiencies/excesses computed from current diet vs. FEDIAF/AAFCO baseline. PRIORITIZE compounds that close these specific gaps; do NOT propose redundant nutrients already adequate in the diet]:\n${gapLines}`
      );
    }
  }

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

// Fallbacks verbatim — usados apenas se o registro de prompts (DB + manifesto) estiver inacessível.
const SYSTEM_PROMPT_ENRICH_FALLBACK = `You are a veterinary nutraceutical expert specializing in individualized geroprotective treatment.

You are enriching an existing Knowledge Graph recommendation with clinical context.

CLINICAL LANGUAGE vs. GEROSCIENCE LAYER (mandatory):
- The veterinarian's notes (assessment / conduct / chief complaint) are written in TRADITIONAL clinical language (e.g., "OA moderada", "ALT elevada", "perda de massa muscular"). NEVER assume the vet reasoned about senescence, inflammaging, NAD+, autophagy or hallmarks of aging.
- Geroscience interpretation (cellular senescence, inflammaging, mitochondrial dysfunction, NAD+ depletion, autophagy, hallmarks of aging, senolytics, geroprotectors) is the SYSTEM's responsibility.
- In your "rationale" you MUST explicitly bridge: clinical finding (vet) → geroscience hallmark/pathway (system inference) → recommended compound. Prefix any geroscience-derived reasoning with "[Inferência de gerociência — gerada pelo sistema]".
- Each compound's "mechanism" field should also follow this bridge when the rationale is geroscience-based.

CRITICAL RULES FOR INDIVIDUALIZATION:
1. Analyze the patient's LAB RESULTS — adjust compound selection based on abnormalities
2. Consider CURRENT MEDICATIONS — avoid redundancy and flag interactions  
3. Factor in BREED PREDISPOSITIONS — preventive compounds for undiagnosed risks
4. Age-appropriate dosing — geriatric patients need adjusted doses
5. For each compound, specify WHICH CONDITION it targets (not generic)
6. MAXIMUM 8 COMPOUNDS — select only the most effective and synergistic ones. Prioritize compounds that:
   a) Address the most critical lab abnormalities
   b) Have synergistic effects with each other
   c) Cover the most important conditions
   d) Have the strongest evidence base

Your enrichment MUST be specific to THIS patient. Do not give generic advice.

LONGITUDINAL REASONING (when CURRENT_STATE / CLINICAL_TRAJECTORY / DIET_PROFILE / NUTRITION_GAPS blocks are present):
- The CURRENT_STATE block (latest consultation) carries weight 1.0 and IS the primary clinical picture.
- The CLINICAL_TRAJECTORY block carries weight 0.4. Use it ONLY to:
  (a) detect conditions that are progressing vs. stable vs. resolved,
  (b) avoid recommending therapies that historically failed for this patient,
  (c) detect cumulative drug exposures (e.g., chronic furosemide → renal stress).
- Do NOT treat conditions only present in past consultations as if they were active now.
- The DIET_PROFILE drives nutritional gap-analysis: prefer omega-3, antioxidants or restrictions consistent with the current diet.
- The NUTRITION_GAPS block (weight 0.8) is QUANTITATIVE and authoritative for diet-derived deficiencies/excesses. For every DEFICIENT nutrient listed there, your top compound choices MUST include at least one that closes that gap (e.g., EPA+DHA deficit → marine omega-3; calcium deficit → bioavailable calcium source; chondroitin deficit + active OA → glucosamine/chondroitin). Do NOT recommend nutrients already ADEQUATE/EXCESS in the diet. Mention the closed gap explicitly in that compound's "mechanism".

IMPORTANT: Return your response as valid JSON with this structure:
{
  "nutraceuticals": [
    {
      "name": "string",
      "dosage": "string (weight-adjusted dosage)",
      "mechanism": "string (why this compound for THIS patient)",
      "evidenceLevel": "AI-enriched",
      "condition": "string (specific condition this targets)",
      "closes_gaps": ["array of EXACT nutrient labels from NUTRITION_GAPS block that this compound closes — e.g. ['EPA+DHA','Calcium']. Use [] when the compound does not close any quantitative diet gap."]
    }
  ],
  "rationale": "string (patient-specific reasoning)",
  "precautions": ["array of patient-specific precautions"]
}

Respond in Portuguese (Brazilian).`;

const SYSTEM_PROMPT_FALLBACK_VERBATIM = `You are a veterinary nutraceutical expert providing INDIVIDUALIZED recommendations.

CRITICAL: Our Knowledge Graph has LIMITED data for this case. You MUST be conservative.
However, you MUST use the patient's clinical context to differentiate your recommendation.

CLINICAL LANGUAGE vs. GEROSCIENCE LAYER (mandatory):
- Vet input arrives in TRADITIONAL clinical language. Do not attribute geroscience reasoning (senescence, inflammaging, NAD+, autophagy, hallmarks of aging, senolytics) to the veterinarian.
- Geroscience mapping is the SYSTEM's responsibility. In "rationale", explicitly bridge: clinical finding → geroscience hallmark/pathway → compound, prefixed with "[Inferência de gerociência — gerada pelo sistema]".

INDIVIDUALIZATION REQUIREMENTS:
1. Analyze abnormal lab values → recommend compounds that address those specific findings
2. Consider current medications → avoid interactions, avoid redundancy
3. Factor in breed predispositions → include preventive compounds
4. Each compound MUST specify which condition/finding it targets
5. Dosages must be adjusted for the patient's weight and age
6. MAXIMUM 8 COMPOUNDS — select only the top compounds by efficacy, synergy, and relevance to this patient's specific clinical picture

LONGITUDINAL REASONING (when CURRENT_STATE / CLINICAL_TRAJECTORY / DIET_PROFILE / NUTRITION_GAPS blocks are present):
- CURRENT_STATE is the dominant signal (weight 1.0). CLINICAL_TRAJECTORY is context only (weight 0.4).
- Conditions only in past consultations must NOT drive new active therapy.
- Avoid re-introducing therapies the trajectory shows already failed.
- Cross-check the DIET_PROFILE for nutritional gaps before recommending a redundant nutrient.
- The NUTRITION_GAPS block (weight 0.8) is QUANTITATIVE: prioritize compounds that close each DEFICIENT entry and skip nutrients already ADEQUATE/EXCESS. Cite the gap closed in the compound's "mechanism".

Your response MUST follow this JSON structure:
{
  "nutraceuticals": [
    {
      "name": "string",
      "dosage": "string (weight-adjusted conservative dosage)",
      "mechanism": "string (why this compound for THIS patient)",
      "evidenceLevel": "AI-generated",
      "condition": "string (specific condition this targets)",
      "targetCondition": "string (same as condition)",
      "closes_gaps": ["array of EXACT nutrient labels from NUTRITION_GAPS block that this compound closes. Use [] when none."]
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
    const { mode, petProfile, condition, kgData, clinicalContext, disableLongitudinal, debug }: HybridRequest = await req.json();
    
    console.log('Hybrid recommendation request:', { mode, condition, petProfile, hasContext: !!clinicalContext });

    // ── Pré-flight de abstenção (Card #3) ─────────────────────────────────
    // abstain SOMENTE por falta de sinal de entrada. KG vazio NÃO dispara
    // abstain — esse caso vira resposta marcada `source:'llm_fallback' +
    // disclaimer:'no_kg_data'` (preservada, nunca apagada).
    const hasCondition =
      (typeof condition === 'string' && condition.trim().length > 0) ||
      !!(clinicalContext?.allConditions?.length);
    const hasPetSignal =
      !!(petProfile?.species || petProfile?.breed || petProfile?.age || petProfile?.weight);
    const hasClinicalSignal =
      hasCondition ||
      !!(clinicalContext?.labAlerts?.length) ||
      !!(clinicalContext?.currentMedications?.length) ||
      !!(clinicalContext?.examSummary?.length) ||
      !!(clinicalContext?.latestConsultation?.assessment) ||
      !!(clinicalContext?.latestConsultation?.chief_complaint);

    if (!hasCondition || (!hasPetSignal && !hasClinicalSignal)) {
      const missing: string[] = [];
      if (!hasCondition) missing.push('condition');
      if (!hasPetSignal) missing.push('pet_profile');
      if (!hasClinicalSignal) missing.push('clinical_signal');
      console.warn('hybrid-recommendation abstaining: clinical_signal_insufficient', { missing });
      return new Response(JSON.stringify({
        abstain: true,
        abstain_reason: 'clinical_signal_insufficient',
        abstain_detail: `Faltando: ${missing.join(', ')}`,
        source: mode === 'enrich' ? 'hybrid' : 'llm_fallback',
        disclaimer: 'no_kg_data',
        nutraceuticals: [],
        rationale: 'Entrada insuficiente para gerar recomendação responsável (sem condição informada ou sem dados clínicos do paciente).',
        precautions: ['Forneça condição-alvo e perfil clínico mínimo antes de gerar recomendação.'],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const effectiveContext: ClinicalContext | undefined = disableLongitudinal && clinicalContext
      ? {
          allConditions: clinicalContext.allConditions,
          predispositions: clinicalContext.predispositions,
          labAlerts: clinicalContext.labAlerts,
          currentMedications: clinicalContext.currentMedications,
          examSummary: clinicalContext.examSummary,
        }
      : clinicalContext;
    const contextBlock = buildClinicalContextBlock(effectiveContext);
    const longitudinalDebug = {
      disabled: !!disableLongitudinal,
      hasCurrentState: !disableLongitudinal && !!clinicalContext?.latestConsultation,
      hasClinicalTrajectory: !disableLongitudinal && !!clinicalContext?.clinicalTrajectory?.length,
      hasDietProfile: !disableLongitudinal && !!clinicalContext?.dietProfile,
      trajectoryEntries: clinicalContext?.clinicalTrajectory?.length ?? 0,
      latestConsultationDate: clinicalContext?.latestConsultation?.date ?? null,
      activeConditions: clinicalContext?.latestConsultation?.activeConditions ?? [],
      abnormalExams: clinicalContext?.latestConsultation?.abnormalExams ?? [],
      dietProducts: clinicalContext?.dietProfile?.products ?? [],
    };
    let systemPrompt: string;
    let userPrompt: string;
    let promptKey: string;

    if (mode === 'enrich') {
      promptKey = 'hybrid_recommendation';
      systemPrompt = await fetchSystemPrompt(promptKey, SYSTEM_PROMPT_ENRICH_FALLBACK);
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
      promptKey = 'hybrid_recommendation_fallback';
      systemPrompt = await fetchSystemPrompt(promptKey, SYSTEM_PROMPT_FALLBACK_VERBATIM);
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

    const t0 = Date.now();
    const model = 'google/gemini-2.5-flash';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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
      logPromptUsage({
        prompt_key: promptKey,
        function_name: 'hybrid-recommendation',
        model,
        latency_ms: Date.now() - t0,
        success: false,
        error: `${response.status}: ${errorText.slice(0, 200)}`,
      });
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
    logPromptUsage({
      prompt_key: promptKey,
      function_name: 'hybrid-recommendation',
      model,
      latency_ms: Date.now() - t0,
      tokens_in: aiResponse?.usage?.prompt_tokens ?? null,
      tokens_out: aiResponse?.usage?.completion_tokens ?? null,
      success: true,
    });

    const debugPayload = debug ? {
      longitudinal: longitudinalDebug,
      renderedContextBlock: contextBlock,
    } : undefined;

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
          const kgEmpty = !(kgData?.nutraceuticals?.length);
          return new Response(JSON.stringify({
            source: 'hybrid',
            disclaimer: kgEmpty ? 'no_kg_data' : 'low_confidence',
            abstain: false,
            nutraceuticals: enrichedNutraceuticals,
            rationale: parsed.rationale || kgData?.rationale || `Recomendação enriquecida por IA para ${condition}.`,
            precautions: [...(kgData?.precautions || []), ...(parsed.precautions || [])],
            enrichment: content,
            debug: debugPayload,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (_) {
        // Not JSON — treat as text enrichment, but still return structured payload
      }

      // Fallback: return KG compounds + text enrichment
      const kgEmpty = !(kgData?.nutraceuticals?.length);
      return new Response(JSON.stringify({
        source: 'hybrid',
        disclaimer: kgEmpty ? 'no_kg_data' : 'low_confidence',
        abstain: false,
        nutraceuticals: (kgData?.nutraceuticals || []).map((n: any) => ({
          ...n,
          evidenceLevel: n.evidenceLevel || 'KG-backed',
          condition: n.condition || condition,
        })),
        rationale: `${kgData?.rationale || ''}\n\nConsiderações adicionais: ${content}`,
        precautions: [...(kgData?.precautions || []), 'Alguns dados foram enriquecidos por IA - verificar com veterinário'],
        enrichment: content,
        debug: debugPayload,
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
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        abstain: false,
        nutraceuticals: (parsed.nutraceuticals || []).map((n: any) => ({
          ...n,
          // Card #3: branch llm_fallback agora carimba provenance per-composto.
          evidenceLevel: n.evidenceLevel || 'AI-enriched',
          condition: n.condition || n.targetCondition || condition,
          targetCondition: n.targetCondition || n.condition || condition,
        })),
        rationale: parsed.rationale || 'Recomendação gerada por IA com base em contexto clínico individualizado.',
        precautions: parsed.precautions || [
          'Esta recomendação requer validação por veterinário',
          'Iniciar com doses conservadoras',
          'Monitorar reações de perto'
        ],
        debug: debugPayload,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(JSON.stringify({
        source: 'llm_fallback',
        disclaimer: 'no_kg_data',
        abstain: false,
        nutraceuticals: [],
        rationale: content || 'Não foi possível gerar uma recomendação estruturada. Consulte um veterinário.',
        precautions: ['Esta recomendação requer validação por veterinário', 'Iniciar com doses conservadoras'],
        debug: debugPayload,
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
