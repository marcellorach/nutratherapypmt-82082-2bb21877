import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LookupBody {
  compound: string;
  condition?: string | null;
  species?: string;
}

interface LookupResult {
  min_mg_per_kg: number | null;
  max_mg_per_kg: number | null;
  unit: string;
  frequency_per_day: number | null;
  route: string | null;
  source_url: string | null;
  source_citation: string | null;
  confidence: number;
  notes?: string | null;
}

const SYSTEM_FALLBACK = `You are a veterinary clinical pharmacologist. You return ONLY structured dosing data for nutraceuticals/supplements in companion animals (dogs by default), grounded in authoritative sources.

Acceptable sources, in order of preference:
1. Plumb's Veterinary Drug Handbook
2. Merck Veterinary Manual (merckvetmanual.com)
3. ACVIM consensus statements
4. WSAVA / AAFP / AAHA guidelines
5. PubMed / PMC peer-reviewed canine or feline studies
6. VIN (Veterinary Information Network)

Rules:
- Return mg/kg/day ranges. If only total mg/day is available for a standard ~10kg dog, normalize to per-kg.
- If you are NOT confident the dose is well established for the species/condition, set confidence below 0.5 and explain in notes.
- NEVER invent a citation. If you cannot find a real source, return source_url=null and source_citation=null and confidence <= 0.3.
- Always return JSON via the provided tool. Do not write prose.`;

async function callLovableAi(
  compound: string,
  condition: string | null,
  species: string,
): Promise<LookupResult | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const userPrompt = condition
    ? `Look up the standard ${species} oral dose of "${compound}" used for "${condition}". Provide mg/kg/day range and best citation.`
    : `Look up the standard ${species} oral dose of "${compound}" (general supplementation). Provide mg/kg/day range and best citation.`;

  const systemPrompt = await fetchSystemPrompt("web_dosage_lookup", SYSTEM_FALLBACK);
  const model = "google/gemini-2.5-pro";
  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "report_dose",
          description:
            "Return the canonical dosing information for the requested compound and condition.",
          parameters: {
            type: "object",
            properties: {
              min_mg_per_kg: { type: ["number", "null"] },
              max_mg_per_kg: { type: ["number", "null"] },
              unit: { type: "string", enum: ["mg/kg", "mg/kg/day"] },
              frequency_per_day: { type: ["number", "null"] },
              route: { type: ["string", "null"] },
              source_url: { type: ["string", "null"] },
              source_citation: { type: ["string", "null"] },
              confidence: { type: "number" },
              notes: { type: ["string", "null"] },
            },
            required: [
              "min_mg_per_kg",
              "max_mg_per_kg",
              "unit",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "report_dose" } },
  };

  const t0 = Date.now();
  const resp = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Lovable AI error", resp.status, text);
    await logPromptUsage({
      prompt_key: "web_dosage_lookup",
      function_name: "web-dosage-lookup",
      model,
      latency_ms: Date.now() - t0,
      success: false,
      error: `HTTP ${resp.status}`,
    });
    if (resp.status === 429 || resp.status === 402) {
      throw new Error(`AI gateway ${resp.status}`);
    }
    return null;
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    await logPromptUsage({
      prompt_key: "web_dosage_lookup",
      function_name: "web-dosage-lookup",
      model,
      latency_ms: Date.now() - t0,
      success: false,
      error: "no_tool_call",
    });
    return null;
  }

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    await logPromptUsage({
      prompt_key: "web_dosage_lookup",
      function_name: "web-dosage-lookup",
      model,
      latency_ms: Date.now() - t0,
      tokens_in: data?.usage?.prompt_tokens,
      tokens_out: data?.usage?.completion_tokens,
      success: true,
    });
    return parsed as LookupResult;
  } catch (e) {
    console.error("Failed to parse tool args", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as LookupBody;
    const compound = (body?.compound || "").trim();
    const condition = (body?.condition || "").trim() || null;
    const species = (body?.species || "canine").trim();

    if (!compound) {
      return new Response(
        JSON.stringify({ error: "compound is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Cache check — try condition-specific first, then generic (condition is null)
    let cached: any = null;
    if (condition) {
      const { data } = await supabase
        .from("compound_dosage_reference")
        .select("*")
        .ilike("compound_name_en", `%${compound}%`)
        .ilike("condition_name_en", `%${condition}%`)
        .eq("species", species)
        .order("confidence", { ascending: false })
        .limit(1)
        .maybeSingle();
      cached = data;
    }
    if (!cached) {
      const { data } = await supabase
        .from("compound_dosage_reference")
        .select("*")
        .ilike("compound_name_en", `%${compound}%`)
        .is("condition_name_en", null)
        .eq("species", species)
        .order("confidence", { ascending: false })
        .limit(1)
        .maybeSingle();
      cached = data;
    }

    if (cached) {
      return new Response(
        JSON.stringify({ source: "cache", reference: cached }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await callLovableAi(compound, condition, species);

    if (!result || (result.min_mg_per_kg == null && result.max_mg_per_kg == null)) {
      return new Response(
        JSON.stringify({ source: "none", reference: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const insertRow = {
      compound_name_en: compound,
      condition_name_en: condition,
      species,
      min_mg_per_kg: result.min_mg_per_kg,
      max_mg_per_kg: result.max_mg_per_kg,
      unit: result.unit || "mg/kg",
      frequency_per_day: result.frequency_per_day,
      route: result.route,
      source_type: result.source_url ? "web_authoritative" : "llm_estimate",
      source_url: result.source_url,
      source_citation: result.source_citation,
      confidence: Math.max(0, Math.min(1, result.confidence ?? 0.4)),
      needs_review: true,
      notes: result.notes ?? null,
    };

    // Manual SELECT-then-INSERT/UPDATE (the table uses a functional unique
    // index that PostgREST upsert cannot target via onConflict).
    let existingQuery = supabase
      .from("compound_dosage_reference")
      .select("id")
      .ilike("compound_name_en", compound)
      .eq("species", species);
    existingQuery = condition
      ? existingQuery.ilike("condition_name_en", condition)
      : existingQuery.is("condition_name_en", null);
    const { data: existing } = await existingQuery.limit(1).maybeSingle();

    let saved: any = null;
    let saveErr: any = null;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("compound_dosage_reference")
        .update(insertRow)
        .eq("id", existing.id)
        .select()
        .maybeSingle();
      saved = data;
      saveErr = error;
    } else {
      const { data, error } = await supabase
        .from("compound_dosage_reference")
        .insert(insertRow)
        .select()
        .maybeSingle();
      saved = data;
      saveErr = error;
    }

    if (saveErr) {
      console.error("Persist error", saveErr);
      return new Response(
        JSON.stringify({ source: "ai", reference: insertRow }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ source: "ai", reference: saved ?? insertRow }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("web-dosage-lookup error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});