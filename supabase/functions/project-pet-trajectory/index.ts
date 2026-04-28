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

function ageInYears(birthdate: string | null, fallback: number | null): number {
  if (birthdate) {
    const ms = Date.now() - new Date(birthdate).getTime();
    return Math.max(ms / (365.25 * 24 * 3600 * 1000), 0);
  }
  return fallback ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.pet_id) return jsonResponse({ error: "pet_id required" }, 400);
    const withIntervention = !!body.with_intervention;
    const maxYears = Math.min(Math.max(body.max_years_ahead ?? 8, 3), 18);

    // 1) Pet
    const { data: pet, error: petErr } = await supabase
      .from("pet_profiles")
      .select("id, name, breed, birthdate, weight_kg, gender")
      .eq("id", body.pet_id)
      .maybeSingle();
    if (petErr || !pet) return jsonResponse({ error: "pet not found" }, 404);

    // 2) Active conditions
    const { data: petConditions } = await supabase
      .from("pet_conditions")
      .select("id, condition_name, severity, status, diagnosed_at")
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
    const { data: petMeds } = await supabase
      .from("pet_medications")
      .select("id, name, status, dose")
      .eq("pet_id", body.pet_id);
    const activeCompounds = (petMeds || []).filter(
      (m: any) => !m.status || m.status === "active",
    );

    // 6) Top KG evidence for active conditions (compound × condition links)
    const conditionIds = (predispositions || [])
      .map((p: any) => p.condition_id)
      .filter(Boolean);
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

    // 7) Build context hash for cache lookup
    const ageNow = ageInYears(pet.birthdate, null);
    const cacheCtx = {
      petId: pet.id,
      ageBucket: Math.floor(ageNow * 4) / 4, // quarter-year resolution
      conditions: activeConditions
        .map((c: any) => `${c.condition_name}|${c.severity || "mild"}`)
        .sort()
        .join(";"),
      compounds: activeCompounds.map((m: any) => m.name).sort().join(";"),
      breedId: breed?.id || null,
      maxYears,
      version: "v2.0",
    };
    const ctxHash = await sha256Hex(JSON.stringify(cacheCtx));

    // 8) Cache check
    if (!body.force_refresh) {
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
        sex: pet.gender,
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
      active_compounds: activeCompounds.map((m: any) => ({ name: m.name, dose: m.dose })),
      kg_compound_condition_evidence: compactEvidence.slice(0, 30),
      simulate_with_geroprotective_protocol: withIntervention,
      max_years_ahead: maxYears,
      instructions: `Produce one projection point for each year from y=0 to y=${maxYears}.
- biological_age: use Gompertz curve + condition load + size factor.
- existing_conditions[].projected_severity_score in [0,1] (mild ~0.2, moderate ~0.55, severe ~0.9).
- new_conditions[]: include only breed_predispositions whose cumulative incidence by that year >= 0.05.
- expected_remaining_years: derived from Gompertz survival, penalized by severe conditions.
- If simulate_with_geroprotective_protocol=true, apply ONLY effects supported by kg_compound_condition_evidence (per-condition).
  Reduce probabilities/severities proportional to the strongest 2-3 supporting compounds; never exceed 50% reduction for a single condition.
- citations[]: list condition+compound+evidence-source combinations you actually relied on.
- years_gained: difference vs no-protocol scenario at the final year (>=0 if protocol helps).
- confidence: "high" if >=5 evidence rows AND breed predisposition data; "medium" if partial; "low" if missing core inputs.`,
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
              years_gained: { type: "number" },
              years: {
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
            required: ["confidence", "rationale", "years_gained", "years", "citations"],
          },
        },
      },
    ];

    const model = "google/gemini-2.5-pro";
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(aiJson).slice(0, 500));
      return jsonResponse({ error: "ai_no_tool_call" }, 500);
    }
    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return jsonResponse({ error: "ai_invalid_json" }, 500);
    }

    const baseline = parsed.years?.[0] || null;

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
          years_gained: parsed.years_gained ?? null,
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
      years_gained: parsed.years_gained ?? null,
      baseline_biological_age: baseline?.biological_age ?? null,
      baseline_remaining_years: baseline?.expected_remaining_years ?? null,
    });
  } catch (e) {
    console.error("project-pet-trajectory error", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "unknown_error" },
      500,
    );
  }
});