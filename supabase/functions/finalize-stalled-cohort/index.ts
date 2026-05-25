// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: adminFlag } = await userClient.rpc("is_admin");
    if (!adminFlag) {
      return new Response(JSON.stringify({ error: "Only admins can finalize cohorts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cohort_id } = await req.json();
    if (!cohort_id) {
      return new Response(JSON.stringify({ error: "cohort_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: c } = await service.from("synthetic_cohorts")
      .select("status, generated_n, target_n, progress_log").eq("id", cohort_id).single();
    if (!c) {
      return new Response(JSON.stringify({ error: "Cohort not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (c.status !== "generating") {
      return new Response(JSON.stringify({ ok: true, already_final: true, status: c.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated = Number(c.generated_n ?? 0);
    const target = Number(c.target_n ?? 0);
    const finalStatus = generated > 0 ? "ready" : "failed";
    const entry = {
      ts: new Date().toISOString(),
      level: finalStatus === "ready" ? "warn" : "error",
      message: `Finalização manual · ${generated}/${target} pets · marcado como ${finalStatus}`,
    };
    const nextLog = Array.isArray(c.progress_log) ? [...c.progress_log, entry] : [entry];
    await service.from("synthetic_cohorts").update({
      status: finalStatus,
      generation_error: `Travado · finalizado manualmente (${generated}/${target} pets)`,
      progress_log: nextLog.slice(-80),
      last_heartbeat_at: new Date().toISOString(),
    }).eq("id", cohort_id);

    return new Response(JSON.stringify({ ok: true, status: finalStatus, generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});