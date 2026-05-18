// Bulk-enrich pet food products that have no nutrition row or low completeness.
// Admin-only. Logs every run to pet_food_bulk_enrich_runs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Body {
  limit?: number;             // max products to process (default 25, hard cap 100)
  min_completeness?: number;  // re-process when completeness < this (default 0.6); set to 0 to only pick rows with no nutrition at all
  brand_id?: string;          // optional filter
  only_missing?: boolean;     // true => skip rows that already have any pet_food_nutrition row
  concurrency?: number;       // default 4
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return json({ error: "missing bearer token" }, 401);
    }
    // Identify caller and ensure admin
    const sbUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: uerr } = await sbUser.auth.getUser();
    if (uerr || !userData.user) return json({ error: "unauthorized" }, 401);
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await sb.rpc("is_admin");
    // is_admin() relies on auth.uid(); call via user client
    const { data: isAdminUser } = await sbUser.rpc("is_admin");
    if (!isAdminUser) return json({ error: "admin only" }, 403);

    const body = (await req.json().catch(() => ({}))) as Body;
    const limit = Math.min(Math.max(Number(body.limit ?? 25) | 0, 1), 100);
    const minCompleteness = typeof body.min_completeness === "number" ? body.min_completeness : 0.6;
    const onlyMissing = body.only_missing === true;
    const concurrency = Math.min(Math.max(Number(body.concurrency ?? 4) | 0, 1), 8);

    // Pick candidates: products with no nutrition row, or low completeness.
    // We hydrate brand name to pass to the enricher.
    let q = sb
      .from("pet_food_products")
      .select("id, name, species, life_stage, brand_id, pet_food_brands!inner(name), pet_food_nutrition(completeness_score, confidence)")
      .eq("submission_status", "approved")
      .eq("discontinued", false)
      .limit(limit * 4); // overfetch then filter in memory by completeness aggregate
    if (body.brand_id) q = q.eq("brand_id", body.brand_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(`product fetch: ${error.message}`);

    const candidates = (rows ?? [])
      .map((r: any) => {
        const nuts: Array<{ completeness_score: number | null; confidence: number | null }> =
          r.pet_food_nutrition ?? [];
        const best = nuts.length
          ? Math.max(...nuts.map((n) => n.completeness_score ?? 0))
          : -1;
        return {
          id: r.id,
          name: r.name,
          species: r.species,
          life_stage: r.life_stage,
          brand_name: r.pet_food_brands?.name as string | undefined,
          best_completeness: best,
        };
      })
      .filter((r) => {
        if (!r.brand_name) return false;
        if (onlyMissing) return r.best_completeness < 0;
        if (r.best_completeness < 0) return true;
        return r.best_completeness < minCompleteness;
      })
      .slice(0, limit);

    // Open run log
    const { data: run, error: rerr } = await sb
      .from("pet_food_bulk_enrich_runs")
      .insert({
        triggered_by: userData.user.id,
        params: { limit, min_completeness: minCompleteness, only_missing: onlyMissing, brand_id: body.brand_id ?? null, concurrency },
        status: "running",
      })
      .select("id")
      .single();
    if (rerr) throw new Error(`run open: ${rerr.message}`);
    const runId = run!.id as string;

    let succeeded = 0, failed = 0, skipped = 0;
    const details: Array<Record<string, unknown>> = [];

    // Process in chunks with bounded concurrency
    for (let i = 0; i < candidates.length; i += concurrency) {
      const chunk = candidates.slice(i, i + concurrency);
      const results = await Promise.allSettled(chunk.map(async (c) => {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-pet-food-product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
            apikey: SERVICE_ROLE,
          },
          body: JSON.stringify({ product_id: c.id }),
        });
        const txt = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        let parsed: any = {};
        try { parsed = JSON.parse(txt); } catch {}
        return { c, confidence: parsed?.parsed?.confidence ?? null };
      }));
      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        const c = chunk[j];
        if (r.status === "fulfilled") {
          succeeded++;
          details.push({ product_id: c.id, brand: c.brand_name, name: c.name, ok: true, confidence: r.value.confidence });
        } else {
          failed++;
          details.push({ product_id: c.id, brand: c.brand_name, name: c.name, ok: false, error: String((r as any).reason?.message ?? r.reason).slice(0, 300) });
        }
      }
    }

    skipped = Math.max(0, (rows?.length ?? 0) - candidates.length);

    await sb
      .from("pet_food_bulk_enrich_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "completed",
        processed: candidates.length,
        succeeded,
        failed,
        skipped,
        details,
      })
      .eq("id", runId);

    return json({ ok: true, run_id: runId, processed: candidates.length, succeeded, failed, skipped });
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}