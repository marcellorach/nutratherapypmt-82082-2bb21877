// Edge function: project-pet-trajectory
// Phase 2 of the Biological Timeline. Generates an evidence-grounded
// trajectory projection for a pet using:
//   - Active pet conditions (from `pet_conditions`)
//   - Breed predispositions (`breed_predispositions`)
//   - Breed aging curve (Gompertz parameters from `breed_aging_curves`)
//   - Nutraceutical/condition evidence (`nutraceutical_conditions`,
//     `nutraceutical_outcomes`) for compounds the pet is or could be on
//   - Approved triplet extractions (`triplet_extractions`)
// The LLM (Lovable AI Gateway, Gemini 2.5 Pro) returns structured JSON via
// tool calling: per-year severity, new-risk probabilities, biological age,
// remaining years, and citations to the studies/triplets used.
// Results are cached in `pet_trajectory_projections` (7-day TTL).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface RequestBody {
  pet_id: string;
  with_intervention?: boolean;
  force_refresh?: boolean;
  max_years_ahead?: number;
  /** When provided, the projection uses this stack as the "with protocol"
   * scenario instead of relying solely on currently-prescribed medications.
   * Each entry is a free-form compound name. */
  recommended_compounds?: string[];
  /** Optional analysis snapshot id for traceability/citations. */
  analysis_snapshot_id?: string;
  /** Admin-only "what-if" preview: when true, also feed pending gap-fill
   * triplets to the LLM and mark resulting projections as provisional.
   * Bypasses cache. */
  include_pending_gap_fill?: boolean;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeAge(ageYears: number | null | undefined): number {
  return Math.max(Number(ageYears) || 0, 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: RequestBody;
    try {
      const raw = await req.text();
      body = raw ? (JSON.parse(raw) as RequestBody) : ({} as RequestBody);
    } catch (parseErr) {
      return jsonResponse({ error: "Invalid JSON body", details: String(parseErr) }, 400);
    }
    if (!body?.pet_id) return jsonResponse({ error: "pet_id required" }, 400);
    // Always compute BOTH scenarios in a single call so the UI can show a
    // coherent comparison from one source of truth. The legacy
    // `with_intervention` flag is honored for caching by being baked into the
    // context hash, but the response now contains `scenarios.with_protocol`
    // and `scenarios.without_protocol`.
    const withIntervention = body.with_intervention !== false;
    const maxYears = Math.min(Math.max(body.max_years_ahead ?? 8, 3), 18);
    const recommendedStack = Array.isArray(body.recommended_compounds)
      ? body.recommended_compounds.filter(s => typeof s === 'string' && s.trim().length > 0)
      : [];
    const includePending = body.include_pending_gap_fill === true;

    // 1) Pet
    const { data: pet, error: petErr } = await supabase
      .from("pet_profiles")
      .select("id, name, breed, age_years, weight_kg, sex")
      .eq("id", body.pet_id)
      .maybeSingle();
    if (petErr || !pet) return jsonResponse({ error: "pet not found" }, 404);

    // 2) Active conditions
    const { data: petConditions } = await supabase
      .from("pet_conditions")
      .select("id, condition_name, severity, status, diagnosis_date")
      .eq("pet_id", body.pet_id);
    const activeConditions = (petConditions || []).filter(
      (c: any) => !c.status || c.status === "active",
    );

    // 3) Breed (case-insensitive match) + aging curve
    const breedName = (pet.breed || "").trim();
    const { data: breeds } = await supabase
      .from("breeds")
      .select("id, name, name_en, size_category, average_weight_kg, average_lifespan_years")
      .or(`name.ilike.${breedName},name_en.ilike.${breedName}`)
      .limit(1);
    const breed = breeds?.[0] || null;
    const sizeCategory = breed?.size_category || "medium";

    const { data: agingCurves } = await supabase
      .from("breed_aging_curves")
      .select("*")
      .eq("size_category", sizeCategory)
      .maybeSingle();

    // 4) Breed predispositions
    const { data: predispositions } = breed
      ? await supabase
          .from("breed_predispositions")
          .select(`
            condition_id,
            risk_factor,
            evidence_grade,
            health_conditions:condition_id (id, name, name_en)
          `)
          .eq("breed_id", breed.id)
      : { data: [] as any[] };

    // 5) Active medications / supplements (compounds in use)
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: petMeds } = await supabase
      .from("pet_medications")
      .select("id, medication_name, dosage, end_date")
      .eq("pet_id", body.pet_id);
    const activeCompounds = (petMeds || [])
      .filter((m: any) => !m.end_date || m.end_date >= todayIso)
      .map((m: any) => ({ name: m.medication_name, dose: m.dosage }));

    // Effective compounds for the "with protocol" scenario: union of the
    // currently-prescribed compounds AND the geroprotector stack proposed by
    // the VetGraphRAG analysis (if provided by the client). This is what the
    // LLM must use to look up evidence.
    const protocolCompoundNames = Array.from(new Set([
      ...activeCompounds.map((m: any) => (m.name || '').toLowerCase().trim()).filter(Boolean),
      ...recommendedStack.map(s => s.toLowerCase().trim()),
    ]));

    // 6) Top KG evidence for active conditions AND breed predispositions.
    // We need the union so the LLM can reason about both worsening of
    // existing diagnoses and prevention of likely future ones.
    const predispositionIds = (predispositions || [])
      .map((p: any) => p.condition_id)
      .filter(Boolean);

    // Resolve active condition NAMES to condition_ids by canonical match
    // against `health_conditions` (case-insensitive PT/EN). Active records
    // may not carry an FK, so we look them up here.
    let activeConditionIds: string[] = [];
    if (activeConditions.length > 0) {
      const { data: hcs } = await supabase
        .from("health_conditions")
        .select("id, name, name_en");
      const lower = (s: string) => (s || '').toLowerCase().trim();
      activeConditionIds = activeConditions
        .map((c: any) => {
          const target = lower(c.condition_name);
          const found = (hcs || []).find((h: any) =>
            lower(h.name) === target ||
            lower(h.name_en) === target ||
            (target && (lower(h.name).includes(target) || lower(h.name_en).includes(target))) ||
            (target && (target.includes(lower(h.name)) || target.includes(lower(h.name_en))))
          );
          return found?.id || null;
        })
        .filter(Boolean) as string[];
    }
    const conditionIds = Array.from(new Set([...predispositionIds, ...activeConditionIds]));
    let kgEvidence: any[] = [];
    if (conditionIds.length > 0) {
      const { data: ev } = await supabase
        .from("nutraceutical_conditions")
        .select(`
          relationship_type,
          efficacy_score,
          notes,
          condition_id,
          nutraceuticals:nutraceutical_id (id, name, name_en),
          health_conditions:condition_id (id, name, name_en)
        `)
        .in("condition_id", conditionIds)
        .order("efficacy_score", { ascending: false })
        .limit(40);
      kgEvidence = ev || [];
    }

    // Optional preview: pending gap-fill triplets that match this pet's
    // conditions AND the recommended stack. Surfaced to the LLM so admin can
    // see "what would happen if these get approved".
    let pendingPreviewEvidence: Array<{
      compound: string;
      condition: string;
      relation: string;
      efficacy_0_5: number;
      provisional: true;
    }> = [];
    if (includePending && conditionIds.length > 0) {
      const { data: hcRows } = await supabase
        .from('health_conditions')
        .select('id, name_en')
        .in('id', conditionIds);
      const condNames = (hcRows || []).map((h: any) => h.name_en).filter(Boolean);
      if (condNames.length > 0) {
        const { data: pending } = await supabase
          .from('triplet_extractions')
          .select('subject_name, object_name, intensity, predicate, approval_chain')
          .eq('curation_status', 'pending')
          .in('object_name', condNames)
          .limit(60);
        // Also fetch perplexity_gap_fill pending triplets
        const { data: pendingPx } = await supabase
          .from('triplet_extractions')
          .select('subject_name, object_name, intensity, predicate, approval_chain')
          .eq('curation_status', 'pending')
          .in('object_name', condNames)
          .contains('approval_chain', { source: 'perplexity_gap_fill' })
          .limit(60);
        const allPending = [...(pending || []), ...(pendingPx || [])];
        const stackLower = recommendedStack.map(s => s.toLowerCase().trim());
        pendingPreviewEvidence = allPending
          .filter((t: any) =>
            stackLower.length === 0 ||
            stackLower.includes(String(t.subject_name || '').toLowerCase().trim()),
          )
          .map((t: any) => ({
            compound: t.subject_name,
            condition: t.object_name,
            relation: t.predicate || 'treats',
            efficacy_0_5: Math.round((Number(t.intensity) || 0) * 5),
            provisional: true as const,
          }));
      }
    }

    // 7) Build context hash for cache lookup
    const ageNow = safeAge(pet.age_years);
    const cacheCtx = {
      petId: pet.id,
      ageBucket: Math.floor(ageNow * 4) / 4, // quarter-year resolution
      conditions: activeConditions
        .map((c: any) => `${c.condition_name}|${c.severity || "mild"}`)
        .sort()
        .join(";"),
      compounds: activeCompounds.map((m: any) => m.name).filter(Boolean).sort().join(";"),
      recommendedStack: recommendedStack.slice().sort().join(";"),
      breedId: breed?.id || null,
      maxYears,
      version: "v3.1-dual-scenario",
      includePending,
      pendingPreviewCount: pendingPreviewEvidence.length,
    };
    const ctxHash = await sha256Hex(JSON.stringify(cacheCtx));

    // 8) Cache check
    if (!body.force_refresh && !includePending) {
      const { data: cached } = await supabase
        .from("pet_trajectory_projections")
        .select("*")
        .eq("pet_id", pet.id)
        .eq("context_hash", ctxHash)
        .eq("with_intervention", withIntervention)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (cached) {
        return jsonResponse({
          source: cached.source,
          cached: true,
          model_used: cached.model_used,
          projection: cached.projection_data,
          citations: cached.citations,
          years_gained: cached.years_gained,
          years_gained_breakdown: (cached.projection_data as any)?.years_gained_breakdown || [],
          protocol_caveats: (cached.projection_data as any)?.protocol_caveats || [],
          confidence: (cached.projection_data as any)?.confidence || null,
          coverage_by_condition: (cached.projection_data as any)?.coverage_by_condition || [],
          years_with_protocol: (cached.projection_data as any)?.years_with_protocol || (cached.projection_data as any)?.years || [],
          years_without_protocol: (cached.projection_data as any)?.years_without_protocol || (cached.projection_data as any)?.years || [],
          baseline_biological_age: cached.baseline_biological_age,
          baseline_remaining_years: cached.baseline_remaining_years,
        });
      }
    }

    // 9) Build LLM payload
    const compactPredisp = (predispositions || []).map((p: any) => ({
      condition: p.health_conditions?.name_en || p.health_conditions?.name,
      risk_factor: Number(p.risk_factor) || 1,
      evidence: p.evidence_grade,
    }));
    const compactEvidence = kgEvidence.map((e: any) => ({
      compound: e.nutraceuticals?.name_en || e.nutraceuticals?.name,
      condition: e.health_conditions?.name_en || e.health_conditions?.name,
      relation: e.relationship_type,
      efficacy_0_5: e.efficacy_score,
    }));

    const systemPrompt = `You are a veterinary longevity science engine. You produce CONSERVATIVE, evidence-grounded trajectory projections for a single dog.
You MUST cite the provided breed predispositions, knowledge graph (KG) evidence, and Gompertz aging curve. Do NOT invent facts.
If evidence is insufficient, lower the confidence and explain.
You MUST output through the function tool.`;

    const userPayload = {
      pet: {
        name: pet.name,
        breed: breed?.name_en || breed?.name || pet.breed,
        size_category: sizeCategory,
        weight_kg: pet.weight_kg ?? breed?.average_weight_kg ?? null,
        chronological_age_years: Number(ageNow.toFixed(2)),
        sex: pet.sex,
      },
      breed_lifespan_years: breed?.average_lifespan_years ?? agingCurves?.median_lifespan_years ?? 12,
      gompertz_curve: agingCurves
        ? {
            alpha: Number(agingCurves.gompertz_alpha),
            beta: Number(agingCurves.gompertz_beta),
            median_lifespan_years: Number(agingCurves.median_lifespan_years),
            mortality_doubling_years: Number(agingCurves.mortality_doubling_years),
            aging_acceleration_factor: Number(agingCurves.aging_acceleration_factor),
            source: agingCurves.source,
          }
        : null,
      active_conditions: activeConditions.map((c: any) => ({
        name: c.condition_name,
        severity: c.severity || "mild",
      })),
      breed_predispositions: compactPredisp,
      active_compounds: activeCompounds,
      vetgraphrag_recommended_stack: recommendedStack,
      effective_protocol_compounds: protocolCompoundNames,
      kg_compound_condition_evidence: compactEvidence.slice(0, 30),
      pending_gap_fill_preview: pendingPreviewEvidence.slice(0, 30),
      preview_mode: includePending,
      simulate_both_scenarios: true,
      max_years_ahead: maxYears,
      instructions: `Produce TWO complete year-by-year projections (y=0..y=${maxYears}):
  (A) "without_protocol": no geroprotector intervention, only current standard care.
  (B) "with_protocol": adds the VetGraphRAG-recommended geroprotector stack on top of (A).
Both scenarios MUST share the same baseline (y=0) values for biological_age, severities, and remaining years. They must diverge only in subsequent years and only for conditions that have actual KG evidence.

CORE PRINCIPLE: This system MUST be honest about uncertainty. It is NORMAL and EXPECTED to report years_gained_total close to 0 when KG evidence is sparse for THIS pet's specific conditions. Do NOT inflate benefit. An honest "no significant benefit" answer is better than an optimistic guess.

- biological_age: use Gompertz curve + condition load + size factor.
- existing_conditions[].projected_severity_score in [0,1] (mild ~0.2, moderate ~0.55, severe ~0.9).
- new_conditions[]: include only breed_predispositions whose cumulative incidence by that year >= 0.05.
- expected_remaining_years: derived from Gompertz survival, penalized by severe conditions.

PROTOCOL EFFECTS (apply ONLY to scenario B "with_protocol"):
- For EACH condition, check kg_compound_condition_evidence for compounds in effective_protocol_compounds with relation supportive of that specific condition AND efficacy_0_5 >= 3.
- If no such evidence exists for a condition, that condition gets ZERO reduction. Do NOT assume a "general geroprotective effect".
- When evidence exists, reduce severity by AT MOST 0.40 × adherence (default adherence 0.75) using the top 1-2 compounds.
- For NEW condition incidence, reduction is at most 0.6 × the severity reduction (prevention is harder than treatment).
- HARD CAP: years_gained_total MUST be in [-0.5, +1.5] years. Values above 1.5 require >=8 high-grade evidence rows AND multi-condition coverage. Negative values are valid when polypharmacy outweighs benefit.

PREVIEW MODE (only when preview_mode is true):
- Treat entries from pending_gap_fill_preview EXACTLY like kg_compound_condition_evidence — they are real PubMed-derived assessments awaiting human curation.
- For every condition that received protection ONLY because of a preview entry, append "(provisório)" to the citation summary and add a protocol_caveat of type "partial_coverage" with message starting with "PREVIEW:" so the UI can render a provisional badge.
- The hard cap still applies.

POLYPHARMACY PENALTY: if effective_protocol_compounds count > 4, reduce adherence by 5 percentage points per extra compound (floor 40%). Mention this in protocol_caveats.

OUTPUT REQUIREMENTS:
- coverage_by_condition[]: one entry per pet condition or predisposition, with kg_covered:boolean, supporting_compounds[], best_efficacy_0_5.
- years_gained_total: net difference vs no-protocol at final year. Can be negative.
- years_gained_breakdown[]: one entry per condition that received non-zero protection, with anchor compound name and citation source.
- protocol_caveats[]: list ALL of: (a) conditions WITHOUT KG coverage, (b) polypharmacy if applicable, (c) adherence assumption, (d) any contraindications.
- citations[]: every condition+compound+evidence row you relied on.
- confidence: "high" only if >=5 evidence rows AND >=50% of pet's conditions have KG coverage; "medium" if partial; "low" otherwise. When low, years_gained_total should be near 0.`,
    };

    // 10) Call Lovable AI gateway with tool calling
    const tools = [
      {
        type: "function",
        function: {
          name: "submit_trajectory_projection",
          description: "Return the full per-year trajectory projection for the pet.",
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              rationale: { type: "string" },
              years_gained_total: { type: "number" },
              coverage_by_condition: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    condition: { type: "string" },
                    origin: { type: "string", enum: ["active", "predisposition"] },
                    kg_covered: { type: "boolean" },
                    supporting_compounds: { type: "array", items: { type: "string" } },
                    best_efficacy_0_5: { type: "number" },
                  },
                  required: ["condition", "kg_covered"],
                },
              },
              years_gained_breakdown: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    condition: { type: "string" },
                    years_contribution: { type: "number" },
                    anchor_compound: { type: "string" },
                    citation: { type: "string" },
                  },
                  required: ["condition", "years_contribution"],
                },
              },
              protocol_caveats: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    type: {
                      type: "string",
                      enum: ["polypharmacy", "adherence", "no_kg_coverage", "partial_coverage", "contraindication"],
                    },
                    message: { type: "string" },
                    related_condition: { type: "string" },
                  },
                  required: ["type", "message"],
                },
              },
              years_without_protocol: {
                type: "array",
                items: { $ref: "#/properties/years_with_protocol/items" },
              },
              years_with_protocol: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    year: { type: "integer" },
                    age_at_year: { type: "number" },
                    biological_age: { type: "number" },
                    expected_remaining_years: { type: "number" },
                    existing_conditions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          projected_severity_score: { type: "number" },
                          projected_severity_label: {
                            type: "string",
                            enum: ["mild", "moderate", "severe"],
                          },
                          notes: { type: "string" },
                        },
                        required: ["name", "projected_severity_score", "projected_severity_label"],
                      },
                    },
                    new_conditions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          probability: { type: "number" },
                          evidence_grade: { type: "string" },
                          rationale: { type: "string" },
                        },
                        required: ["name", "probability"],
                      },
                    },
                  },
                  required: [
                    "year",
                    "age_at_year",
                    "biological_age",
                    "expected_remaining_years",
                    "existing_conditions",
                    "new_conditions",
                  ],
                },
              },
              citations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    type: {
                      type: "string",
                      enum: ["kg_evidence", "breed_predisposition", "gompertz_curve"],
                    },
                    summary: { type: "string" },
                    related_condition: { type: "string" },
                    related_compound: { type: "string" },
                  },
                  required: ["type", "summary"],
                },
              },
            },
            required: ["confidence", "rationale", "years_gained_total", "years_gained_breakdown", "protocol_caveats", "years_with_protocol", "years_without_protocol", "citations"],
          },
        },
      },
    ];

    const model = "google/gemini-2.5-pro";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);
    let aiResp: Response;
    try {
    aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_trajectory_projection" } },
      }),
    });
    } catch (abortErr: any) {
      clearTimeout(timeoutId);
      if (abortErr?.name === 'AbortError') {
        return jsonResponse({ error: "ai_timeout", message: "A IA demorou demais (>120s). Tente novamente." }, 504);
      }
      throw abortErr;
    }
    clearTimeout(timeoutId);

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return jsonResponse(
          { error: "rate_limited", message: "Limite de requisições atingido, tente novamente em instantes." },
          429,
        );
      }
      if (aiResp.status === 402) {
        return jsonResponse(
          { error: "credits_exhausted", message: "Créditos da IA esgotados — adicione saldo no workspace." },
          402,
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return jsonResponse({ error: "ai_gateway_error", status: aiResp.status }, 500);
    }

    let aiJson = await aiResp.json();
    let toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Retry once with stricter instruction — some models occasionally
      // return prose despite tool_choice. A single retry resolves this.
      console.warn("No tool call on first attempt, retrying once...");
      const retryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt + "\n\nCRITICAL: You MUST invoke the function tool `submit_trajectory_projection`. Do NOT reply with text. Output ONLY a tool call." },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "submit_trajectory_projection" } },
        }),
      });
      if (retryResp.ok) {
        aiJson = await retryResp.json();
        toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
      }
      if (!toolCall?.function?.arguments) {
        console.error("No tool call after retry", JSON.stringify(aiJson).slice(0, 500));
        return jsonResponse({ error: "ai_no_tool_call" }, 500);
      }
    }
    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return jsonResponse({ error: "ai_invalid_json" }, 500);
    }

    // Backward-compatible: some upstream prompts may still emit `years`.
    if (!parsed.years_with_protocol && Array.isArray(parsed.years)) {
      parsed.years_with_protocol = parsed.years;
    }
    if (!parsed.years_without_protocol && Array.isArray(parsed.years)) {
      parsed.years_without_protocol = parsed.years;
    }
    // Convenience legacy alias
    parsed.years = parsed.years_with_protocol || parsed.years_without_protocol || [];

    const baseline = parsed.years_with_protocol?.[0] || parsed.years_without_protocol?.[0] || null;
    // Hard cap: clamp years_gained_total to plausible range [-0.5, 1.5]
    const rawGain = Number(parsed.years_gained_total ?? parsed.years_gained ?? 0);
    const cappedGain = Math.max(Math.min(rawGain, 1.5), -0.5);
    parsed.years_gained_total = cappedGain;
    if (cappedGain !== rawGain) {
      parsed.protocol_caveats = parsed.protocol_caveats || [];
      parsed.protocol_caveats.push({
        type: "adherence",
        message: `Estimativa do modelo (${rawGain.toFixed(2)}a) ajustada para o teto de plausibilidade (${cappedGain.toFixed(2)}a).`,
      });
    }

    // If both scenarios are identical (no KG benefit), surface that
    // explicitly so the UI does not silently mislead the vet.
    const coverage = Array.isArray(parsed.coverage_by_condition) ? parsed.coverage_by_condition : [];
    const coveredCount = coverage.filter((c: any) => c?.kg_covered).length;
    const totalCovered = coverage.length || 0;
    if (coveredCount === 0 && totalCovered > 0) {
      parsed.protocol_caveats = parsed.protocol_caveats || [];
      const already = parsed.protocol_caveats.some((c: any) => c?.type === 'no_kg_coverage');
      if (!already) {
        parsed.protocol_caveats.push({
          type: 'no_kg_coverage',
          message: 'Nenhuma condição deste pet tem evidência KG suficiente para que o protocolo geroprotetor altere a trajetória.',
        });
      }
    }

    // 11) Cache result
    const { error: cacheErr } = await supabase
      .from("pet_trajectory_projections")
      .upsert(
        {
          pet_id: pet.id,
          context_hash: ctxHash,
          with_intervention: withIntervention,
          projection_data: parsed,
          citations: parsed.citations || [],
          years_gained: parsed.years_gained_total ?? null,
          baseline_biological_age: baseline?.biological_age ?? null,
          baseline_remaining_years: baseline?.expected_remaining_years ?? null,
          model_used: model,
          source: "ai_kg_grounded",
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        },
        { onConflict: "pet_id,context_hash,with_intervention" },
      );
    if (cacheErr) console.warn("cache write failed", cacheErr.message);

    return jsonResponse({
      source: "ai_kg_grounded",
      cached: false,
      model_used: model,
      projection: parsed,
      citations: parsed.citations || [],
      years_gained: parsed.years_gained_total ?? null,
      years_gained_breakdown: parsed.years_gained_breakdown || [],
      protocol_caveats: parsed.protocol_caveats || [],
      confidence: parsed.confidence || null,
      coverage_by_condition: parsed.coverage_by_condition || [],
      years_with_protocol: parsed.years_with_protocol || [],
      years_without_protocol: parsed.years_without_protocol || [],
      baseline_biological_age: baseline?.biological_age ?? null,
      baseline_remaining_years: baseline?.expected_remaining_years ?? null,
      preview_mode: includePending,
      pending_preview_count: pendingPreviewEvidence.length,
    });
  } catch (e) {
    console.error("project-pet-trajectory error", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "unknown_error" },
      500,
    );
  }
});