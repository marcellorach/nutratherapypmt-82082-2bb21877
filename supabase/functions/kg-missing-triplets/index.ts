// Edge function: kg-missing-triplets
// Returns the matrix of (condition × proposed compound) pairs that currently
// HAVE NO supporting evidence in the knowledge graph for a given pet, plus a
// summary of what is missing per condition. Used by the admin-only "Ver
// triplets faltantes" panel inside the Biological Timeline tab so curators
// know exactly which links must be approved/extracted to make the
// geroprotector protocol generate measurable life-years gain for this pet.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

console.log("[kg-missing-triplets] boot", {
  hasUrl: !!SUPABASE_URL,
  hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const lower = (s: any) => String(s || "").toLowerCase().trim();

interface Body {
  pet_id: string;
  recommended_compounds?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[kg-missing-triplets] missing env", {
        hasUrl: !!SUPABASE_URL, hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
      });
      return jsonResponse({ error: "server misconfiguration: missing env vars" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return jsonResponse({ error: "unauthorized" }, 401);

    // Resolve the caller and verify the admin role.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: userResp } = await adminClient.auth.getUser(token);
    const userId = userResp?.user?.id;
    if (!userId) return jsonResponse({ error: "unauthorized" }, 401);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (!isAdmin) return jsonResponse({ error: "forbidden" }, 403);

    const body = (await req.json()) as Body;
    if (!body?.pet_id) return jsonResponse({ error: "pet_id required" }, 400);

    const recommended = Array.isArray(body.recommended_compounds)
      ? body.recommended_compounds.filter((s) => typeof s === "string" && s.trim().length > 0)
      : [];

    // 1) Pet + breed
    const { data: pet } = await adminClient
      .from("pet_profiles")
      .select("id, name, breed, age_years")
      .eq("id", body.pet_id)
      .maybeSingle();
    if (!pet) return jsonResponse({ error: "pet not found" }, 404);

    const breedName = (pet.breed || "").trim();
    const { data: breeds } = await adminClient
      .from("breeds")
      .select("id, name, name_en")
      .or(`name.ilike.${breedName},name_en.ilike.${breedName}`)
      .limit(1);
    const breed = breeds?.[0] || null;

    // 2) Active conditions + breed predispositions → unified condition list
    const { data: petConditions } = await adminClient
      .from("pet_conditions")
      .select("condition_name, severity, status")
      .eq("pet_id", body.pet_id);
    const activeConditionNames = (petConditions || [])
      .filter((c: any) => !c.status || c.status === "active")
      .map((c: any) => c.condition_name);

    let predispositions: any[] = [];
    if (breed) {
      const { data: pds } = await adminClient
        .from("breed_predispositions")
        .select(
          `risk_factor, evidence_grade, condition_id,
           health_conditions:condition_id (id, name, name_en)`,
        )
        .eq("breed_id", breed.id);
      predispositions = pds || [];
    }

    // Resolve canonical condition rows for active condition names
    const { data: allHcs } = await adminClient
      .from("health_conditions")
      .select("id, name, name_en");
    const hcByLower = new Map<string, any>();
    (allHcs || []).forEach((h: any) => {
      if (h.name) hcByLower.set(lower(h.name), h);
      if (h.name_en) hcByLower.set(lower(h.name_en), h);
    });

    const conditionEntries: Array<{
      condition_id: string | null;
      display_name: string;
      display_name_en: string | null;
      origin: "active" | "predisposition";
      severity?: string | null;
      risk_factor?: number | null;
    }> = [];

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (const name of activeConditionNames) {
      const hc = hcByLower.get(lower(name));
      const id = hc?.id || null;
      const key = id || lower(name);
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      if (id) seenIds.add(id);
      conditionEntries.push({
        condition_id: id,
        display_name: hc?.name || name,
        display_name_en: hc?.name_en || null,
        origin: "active",
        severity: (petConditions || []).find((c: any) => lower(c.condition_name) === lower(name))?.severity || null,
      });
    }
    for (const p of predispositions) {
      const hc = p.health_conditions;
      const id = hc?.id || null;
      const key = id || lower(hc?.name);
      if (!key || seenNames.has(key)) continue;
      seenNames.add(key);
      if (id) seenIds.add(id);
      conditionEntries.push({
        condition_id: id,
        display_name: hc?.name || "—",
        display_name_en: hc?.name_en || null,
        origin: "predisposition",
        risk_factor: Number(p.risk_factor) || null,
      });
    }

    // 3) Existing curated evidence rows (nutraceutical_conditions) for those conditions
    let curatedEdges: any[] = [];
    if (seenIds.size > 0) {
      const { data: ev } = await adminClient
        .from("nutraceutical_conditions")
        .select(
          `relationship_type, efficacy_score, condition_id,
           nutraceuticals:nutraceutical_id (id, name, name_en)`,
        )
        .in("condition_id", Array.from(seenIds));
      curatedEdges = ev || [];
    }

    // 4) Hierarchical edges (extracted triplets) touching those conditions by name
    const conditionNamesLower = new Set(
      conditionEntries.flatMap((c) => [lower(c.display_name), lower(c.display_name_en || "")]).filter(Boolean),
    );
    let extractedHits: any[] = [];
    if (recommended.length > 0 && conditionNamesLower.size > 0) {
      // Pull a manageable slice; admin tool, not hot path.
      const { data: edges } = await adminClient
        .from("hierarchical_edges")
        .select("source_type, target_type, relationship, intensity, confidence, evidence_count, curated, triplet_id, source_id, target_id")
        .limit(2000);
      // We don't have the entity names on the edge row; we'll rely on
      // nutraceutical_conditions for the curated case. Extracted triplets
      // without a curated link will be surfaced by the triplet bank — here
      // we just return the count as a hint.
      extractedHits = edges || [];
    }

    // 5) Build the missing matrix
    const missing: Array<{
      condition_display: string;
      condition_id: string | null;
      origin: "active" | "predisposition";
      compound: string;
      reason: "no_curated_link" | "weak_efficacy";
      best_efficacy_0_5: number | null;
      relationship: string | null;
    }> = [];

    const perCondition: Array<{
      condition_display: string;
      condition_id: string | null;
      origin: "active" | "predisposition";
      total_compounds: number;
      covered_compounds: number;
      missing_compounds: string[];
      has_any_curated_link: boolean;
      severity?: string | null;
      risk_factor?: number | null;
    }> = [];

    for (const c of conditionEntries) {
      const edgesForCond = curatedEdges.filter((e: any) => e.condition_id === c.condition_id);
      const supportingByCompound = new Map<string, { eff: number | null; rel: string | null }>();
      for (const e of edgesForCond) {
        const compName = lower(e.nutraceuticals?.name_en || e.nutraceuticals?.name);
        if (!compName) continue;
        const cur = supportingByCompound.get(compName);
        const eff = typeof e.efficacy_score === "number" ? e.efficacy_score : null;
        if (!cur || (eff != null && (cur.eff == null || eff > cur.eff))) {
          supportingByCompound.set(compName, { eff, rel: e.relationship_type || null });
        }
      }
      const missingForCond: string[] = [];
      let covered = 0;
      for (const cmp of recommended) {
        const key = lower(cmp);
        const sup = supportingByCompound.get(key);
        const isStrong = sup && typeof sup.eff === "number" && sup.eff >= 3;
        if (!sup) {
          missing.push({
            condition_display: c.display_name,
            condition_id: c.condition_id,
            origin: c.origin,
            compound: cmp,
            reason: "no_curated_link",
            best_efficacy_0_5: null,
            relationship: null,
          });
          missingForCond.push(cmp);
        } else if (!isStrong) {
          missing.push({
            condition_display: c.display_name,
            condition_id: c.condition_id,
            origin: c.origin,
            compound: cmp,
            reason: "weak_efficacy",
            best_efficacy_0_5: sup.eff,
            relationship: sup.rel,
          });
          missingForCond.push(cmp);
        } else {
          covered++;
        }
      }
      perCondition.push({
        condition_display: c.display_name,
        condition_id: c.condition_id,
        origin: c.origin,
        total_compounds: recommended.length,
        covered_compounds: covered,
        missing_compounds: missingForCond,
        has_any_curated_link: edgesForCond.length > 0,
        severity: c.severity || null,
        risk_factor: c.risk_factor || null,
      });
    }

    return jsonResponse({
      pet: { id: pet.id, name: pet.name, breed: pet.breed },
      recommended_compounds: recommended,
      conditions_total: conditionEntries.length,
      conditions_without_any_curated_link: perCondition.filter((p) => !p.has_any_curated_link).length,
      compounds_total: recommended.length,
      missing_pairs: missing,
      per_condition: perCondition,
      extracted_edges_scanned: extractedHits.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("kg-missing-triplets error:", err);
    return jsonResponse({ error: err?.message || "internal error" }, 500);
  }
});