import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const SYSTEM_PROMPT = `You are a veterinary clinical pharmacologist. You return ONLY structured dosing data for nutraceuticals/supplements in companion animals (dogs by default), grounded in authoritative sources.

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

  const body = {
    model: "google/gemini-2.5-pro",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
    if (resp.status === 429 || resp.status === 402) {
      throw new Error(`AI gateway ${resp.status}`);
    }
    return null;
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
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

    // Cache check
    const { data: cached } = await supabase
      .from("compound_dosage_reference")
      .select("*")
      .ilike("compound_name_en", compound)
      .eq("species", species)
      .or(
        condition
          ? `condition_name_en.ilike.${condition},condition_name_en.is.null`
          : "condition_name_en.is.null",
      )
      .order("condition_name_en", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

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

    const { data: inserted, error: insErr } = await supabase
      .from("compound_dosage_reference")
      .upsert(insertRow, {
        onConflict: "compound_name_en,condition_name_en,species",
        ignoreDuplicates: false,
      })
      .select()
      .maybeSingle();

    if (insErr) {
      console.error("Insert error", insErr);
      // Fall back: return result without persisting
      return new Response(
        JSON.stringify({ source: "ai", reference: insertRow }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ source: "ai", reference: inserted ?? insertRow }),
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