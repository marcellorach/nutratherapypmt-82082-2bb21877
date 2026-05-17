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
const SYSTEM = `Você é um especialista em nutrição animal. Dado o nome de uma marca e produto de ração para pets,
retorne SOMENTE JSON válido com a composição garantida COMPLETA (AAFCO/FEDIAF) e classificação.
Use dados públicos do fabricante (rótulo, site oficial) quando conhecidos. Se não souber um campo, use null.
Marque "confidence" 0..1 indicando certeza geral. NUNCA invente valores — prefira null.
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
    "sodium_pct": number|null, "potassium_pct": number|null, "magnesium_pct": number|null, "chloride_pct": number|null,
    "iron_mg_per_kg": number|null, "copper_mg_per_kg": number|null, "zinc_mg_per_kg": number|null,
    "manganese_mg_per_kg": number|null, "selenium_mg_per_kg": number|null, "iodine_mg_per_kg": number|null,
    "vit_a_iu_per_kg": number|null, "vit_d3_iu_per_kg": number|null, "vit_e_iu_per_kg": number|null,
    "vit_k_mg_per_kg": number|null,
    "vit_b1_mg_per_kg": number|null, "vit_b2_mg_per_kg": number|null, "vit_b3_mg_per_kg": number|null,
    "vit_b5_mg_per_kg": number|null, "vit_b6_mg_per_kg": number|null, "vit_b9_mg_per_kg": number|null,
    "vit_b12_mg_per_kg": number|null, "biotin_mg_per_kg": number|null, "choline_mg_per_kg": number|null,
    "omega3_pct": number|null, "omega6_pct": number|null,
    "epa_pct": number|null, "dha_pct": number|null, "ara_pct": number|null,
    "lysine_pct": number|null, "methionine_pct": number|null, "tryptophan_pct": number|null,
    "threonine_pct": number|null, "arginine_pct": number|null,
    "taurine_mg_per_kg": number|null, "l_carnitine_mg_per_kg": number|null,
    "glucosamine_mg_per_kg": number|null, "chondroitin_mg_per_kg": number|null,
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
    let { product_id } = body;
    let brand_name = body.brand_name;
    let product_name = body.product_name;
    let species = body.species;
    let life_stage = body.life_stage;
    const persist: boolean = body.persist === true;
    const link_to_item_id: string | undefined = body.link_to_item_id;

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

    // Persist=true → garante brand + product no catálogo antes de chamar a IA,
    // de modo que a inserção em pet_food_nutrition (mais abaixo) seja vinculada
    // ao produto recém-criado. Útil para o botão "Incorporar" no perfil do pet.
    if (persist && !product_id) {
      // brand
      const { data: existingBrand } = await sb
        .from("pet_food_brands")
        .select("id")
        .ilike("name", brand_name)
        .maybeSingle();
      let brand_id = existingBrand?.id as string | undefined;
      if (!brand_id) {
        const { data: newBrand, error: be } = await sb
          .from("pet_food_brands")
          .insert({ name: brand_name })
          .select("id")
          .single();
        if (be) throw new Error(`brand insert: ${be.message}`);
        brand_id = newBrand!.id;
      }
      // product (match by brand + name, case-insensitive)
      const { data: existingProd } = await sb
        .from("pet_food_products")
        .select("id")
        .eq("brand_id", brand_id)
        .ilike("name", product_name)
        .maybeSingle();
      if (existingProd?.id) {
        product_id = existingProd.id;
      } else {
        const { data: newProd, error: pe } = await sb
          .from("pet_food_products")
          .insert({
            brand_id,
            name: product_name,
            species: species || null,
            life_stage: life_stage || null,
            submission_status: "approved",
          })
          .select("id")
          .single();
        if (pe) throw new Error(`product insert: ${pe.message}`);
        product_id = newProd!.id;
      }
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

    // Normalize numeric ranges to avoid garbage from the LLM.
    const num = (v: unknown): number | null => {
      if (v == null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };
    const pct = (v: unknown): number | null => {
      const n = num(v);
      if (n == null) return null;
      // some sources report "30" for 30% and others 0.30 — normalize
      const x = n > 0 && n <= 1 ? n * 100 : n;
      return x >= 0 && x <= 100 ? Number(x.toFixed(2)) : null;
    };
    const kcal = (v: unknown): number | null => {
      const n = num(v);
      if (n == null) return null;
      // Plausible canine kibble range 2000–6000 kcal/kg; if value looks like kcal/100g (~300-500), upscale
      if (n > 100 && n < 1000) return Number((n * 10).toFixed(0));
      return n >= 1000 && n <= 8000 ? Number(n.toFixed(0)) : null;
    };
    const enumOrNull = <T extends string>(v: unknown, allowed: T[]): T | null => {
      if (typeof v !== "string") return null;
      const lc = v.toLowerCase().trim();
      const hit = allowed.find((a) => a.toLowerCase() === lc);
      return (hit as T) ?? null;
    };

    if (product_id) {
      const upd: Record<string, unknown> = {};
      const sp = enumOrNull(parsed.species, ["dog", "cat", "both"]);
      const ls = enumOrNull(parsed.life_stage, ["puppy", "adult", "senior", "all"]);
      const sz = enumOrNull(parsed.size_target, ["small", "medium", "large", "giant", "all"]);
      const ff = enumOrNull(parsed.food_form, ["dry_kibble", "wet", "semi_moist", "raw", "freeze_dried"]);
      if (sp) upd.species = sp;
      if (ls) upd.life_stage = ls;
      if (sz) upd.size_target = sz;
      if (ff) upd.food_form = ff;
      if (typeof parsed.is_prescription === "boolean") upd.is_prescription = parsed.is_prescription;
      if (parsed.prescription_indication) upd.prescription_indication = parsed.prescription_indication;
      if (parsed.line) upd.line = parsed.line;
      if (Object.keys(upd).length) await sb.from("pet_food_products").update(upd).eq("id", product_id);

      const n = parsed.nutrition || {};
      const protein_pct = pct(n.protein_pct);
      const fat_pct = pct(n.fat_pct);
      const fiber_pct = pct(n.fiber_pct);
      const moisture_pct = pct(n.moisture_pct);
      const ash_pct = pct(n.ash_pct);
      const ca = pct(n.calcium_pct), p = pct(n.phosphorus_pct);
      const o3 = pct(n.omega3_pct), o6 = pct(n.omega6_pct);
      const kcal_per_kg = kcal(n.kcal_per_kg);
      // Trace minerals & vitamins use raw numeric values from the LLM.
      const mg = (v: unknown): number | null => {
        const x = num(v);
        return x != null && x >= 0 && x < 1_000_000 ? Number(x.toFixed(3)) : null;
      };
      const iu = (v: unknown): number | null => {
        const x = num(v);
        return x != null && x >= 0 && x < 10_000_000 ? Number(x.toFixed(0)) : null;
      };
      const row: Record<string, unknown> = {
        product_id,
        source: "llm_estimated",
        verified: false,
        protein_pct,
        fat_pct,
        fiber_pct,
        moisture_pct,
        ash_pct,
        kcal_per_kg,
        calcium_pct: ca,
        phosphorus_pct: p,
        ca_p_ratio: ca && p ? Number((ca / p).toFixed(2)) : null,
        sodium_pct: pct(n.sodium_pct),
        potassium_pct: pct(n.potassium_pct),
        magnesium_pct: pct(n.magnesium_pct),
        chloride_pct: pct(n.chloride_pct),
        iron_mg_per_kg: mg(n.iron_mg_per_kg),
        copper_mg_per_kg: mg(n.copper_mg_per_kg),
        zinc_mg_per_kg: mg(n.zinc_mg_per_kg),
        manganese_mg_per_kg: mg(n.manganese_mg_per_kg),
        selenium_mg_per_kg: mg(n.selenium_mg_per_kg),
        iodine_mg_per_kg: mg(n.iodine_mg_per_kg),
        vit_a_iu_per_kg: iu(n.vit_a_iu_per_kg),
        vit_d3_iu_per_kg: iu(n.vit_d3_iu_per_kg),
        vit_e_iu_per_kg: iu(n.vit_e_iu_per_kg),
        vit_k_mg_per_kg: mg(n.vit_k_mg_per_kg),
        vit_b1_mg_per_kg: mg(n.vit_b1_mg_per_kg),
        vit_b2_mg_per_kg: mg(n.vit_b2_mg_per_kg),
        vit_b3_mg_per_kg: mg(n.vit_b3_mg_per_kg),
        vit_b5_mg_per_kg: mg(n.vit_b5_mg_per_kg),
        vit_b6_mg_per_kg: mg(n.vit_b6_mg_per_kg),
        vit_b9_mg_per_kg: mg(n.vit_b9_mg_per_kg),
        vit_b12_mg_per_kg: mg(n.vit_b12_mg_per_kg),
        biotin_mg_per_kg: mg(n.biotin_mg_per_kg),
        choline_mg_per_kg: mg(n.choline_mg_per_kg),
        omega3_pct: o3,
        omega6_pct: o6,
        omega6_omega3_ratio: o6 && o3 ? Number((o6 / o3).toFixed(2)) : null,
        epa_pct: pct(n.epa_pct),
        dha_pct: pct(n.dha_pct),
        ara_pct: pct(n.ara_pct),
        lysine_pct: pct(n.lysine_pct),
        methionine_pct: pct(n.methionine_pct),
        tryptophan_pct: pct(n.tryptophan_pct),
        threonine_pct: pct(n.threonine_pct),
        arginine_pct: pct(n.arginine_pct),
        taurine_mg_per_kg: mg(n.taurine_mg_per_kg),
        l_carnitine_mg_per_kg: mg(n.l_carnitine_mg_per_kg),
        glucosamine_mg_per_kg: mg(n.glucosamine_mg_per_kg),
        chondroitin_mg_per_kg: mg(n.chondroitin_mg_per_kg),
        primary_protein_source: n.primary_protein_source ?? null,
        is_grain_free: n.is_grain_free ?? null,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
        data_filled_at: new Date().toISOString(),
        raw_data: parsed,
      };
      // completeness = fração de campos numéricos não-nulos (excluindo metadados)
      const meta = new Set(["product_id","source","verified","raw_data","primary_protein_source","is_grain_free","confidence","data_filled_at"]);
      const numeric = Object.entries(row).filter(([k]) => !meta.has(k));
      const filled = numeric.filter(([, v]) => v != null).length;
      row.completeness_score = numeric.length ? Number((filled / numeric.length).toFixed(2)) : null;
      await sb.from("pet_food_nutrition").insert(row);
    }

    // Vincula o item de dieta ao produto recém-criado (somente quando persist).
    if (persist && product_id && link_to_item_id) {
      await sb
        .from("pet_nutrition_items")
        .update({ product_id })
        .eq("id", link_to_item_id);
    }

    return new Response(JSON.stringify({ ok: true, parsed, product_id: product_id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});