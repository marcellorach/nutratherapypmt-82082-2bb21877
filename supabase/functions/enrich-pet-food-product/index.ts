// Enrich a pet food product with nutritional composition using Lovable AI Gateway.
// Input: { product_id: string } OR { brand_name, product_name, species?, life_stage? }
// If product_id is provided, the row is updated and a pet_food_nutrition row is upserted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM = `Você é um especialista em nutrição animal. Dado o nome de uma marca e produto de ração para pets,
retorne SOMENTE JSON válido com a composição garantida e classificação. Use dados públicos do fabricante quando conhecidos.
Se não souber um campo, use null. Marque "confidence" 0..1 indicando certeza geral.
Schema:
{
  "species": "dog"|"cat"|"both",
  "life_stage": "puppy"|"adult"|"senior"|"all"|null,
  "size_target": "small"|"medium"|"large"|"giant"|"all"|null,
  "food_form": "dry_kibble"|"wet"|"semi_moist"|"raw"|"freeze_dried"|null,
  "is_prescription": boolean,
  "prescription_indication": string[]|null,
  "line": string|null,
  "nutrition": {
    "protein_pct": number|null, "fat_pct": number|null, "fiber_pct": number|null,
    "moisture_pct": number|null, "ash_pct": number|null,
    "kcal_per_kg": number|null,
    "calcium_pct": number|null, "phosphorus_pct": number|null,
    "omega3_pct": number|null, "omega6_pct": number|null,
    "primary_protein_source": string|null,
    "is_grain_free": boolean|null
  },
  "confidence": number,
  "notes": string|null
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { product_id } = body;
    let brand_name = body.brand_name;
    let product_name = body.product_name;
    let species = body.species;
    let life_stage = body.life_stage;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (product_id && (!brand_name || !product_name)) {
      const { data, error } = await sb
        .from("pet_food_products")
        .select("name, species, life_stage, pet_food_brands(name)")
        .eq("id", product_id)
        .single();
      if (error || !data) throw new Error(`product not found: ${error?.message}`);
      product_name = data.name;
      brand_name = (data as any).pet_food_brands?.name;
      species = species || data.species;
      life_stage = life_stage || data.life_stage;
    }

    if (!brand_name || !product_name) {
      return new Response(JSON.stringify({ error: "brand_name and product_name (or product_id) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Marca: ${brand_name}\nProduto: ${product_name}` +
      (species ? `\nEspécie: ${species}` : "") +
      (life_stage ? `\nFase: ${life_stage}` : "");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI ${aiRes.status}: ${txt.slice(0, 300)}`);
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    if (product_id) {
      const upd: Record<string, unknown> = {};
      if (parsed.species) upd.species = parsed.species;
      if (parsed.life_stage) upd.life_stage = parsed.life_stage;
      if (parsed.size_target) upd.size_target = parsed.size_target;
      if (parsed.food_form) upd.food_form = parsed.food_form;
      if (typeof parsed.is_prescription === "boolean") upd.is_prescription = parsed.is_prescription;
      if (parsed.prescription_indication) upd.prescription_indication = parsed.prescription_indication;
      if (parsed.line) upd.line = parsed.line;
      if (Object.keys(upd).length) await sb.from("pet_food_products").update(upd).eq("id", product_id);

      const n = parsed.nutrition || {};
      const ca = n.calcium_pct, p = n.phosphorus_pct;
      const o3 = n.omega3_pct, o6 = n.omega6_pct;
      await sb.from("pet_food_nutrition").insert({
        product_id,
        source: "llm_estimated",
        verified: false,
        protein_pct: n.protein_pct ?? null,
        fat_pct: n.fat_pct ?? null,
        fiber_pct: n.fiber_pct ?? null,
        moisture_pct: n.moisture_pct ?? null,
        ash_pct: n.ash_pct ?? null,
        kcal_per_kg: n.kcal_per_kg ?? null,
        calcium_pct: ca ?? null,
        phosphorus_pct: p ?? null,
        ca_p_ratio: ca && p ? Number((ca / p).toFixed(2)) : null,
        omega3_pct: o3 ?? null,
        omega6_pct: o6 ?? null,
        omega6_omega3_ratio: o6 && o3 ? Number((o6 / o3).toFixed(2)) : null,
        primary_protein_source: n.primary_protein_source ?? null,
        is_grain_free: n.is_grain_free ?? null,
        raw_data: parsed,
      });
    }

    return new Response(JSON.stringify({ ok: true, parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});