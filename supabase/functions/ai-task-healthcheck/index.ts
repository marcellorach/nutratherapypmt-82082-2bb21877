// Fase 4 — Healthcheck diário de tarefas IA conectadas.
//
// Para cada task com status='connected' no registry estático (passado pelo
// caller no body, ou descoberto via ai_prompt_versions), executa um ping
// mínimo no modelo ativo via Lovable AI Gateway e grava em ai_task_status.
//
// Verify_jwt = false (cron-friendly). Aceita header `x-cron-secret` opcional
// — se a env CRON_SECRET estiver setada, exige match para rejeitar chamadas
// não autorizadas.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface Body {
  task_ids?: string[];
}

async function pingModel(modelId: string, systemPrompt: string | null): Promise<{ ok: boolean; latency: number; error?: string }> {
  const started = Date.now();
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt.slice(0, 400) }] : []),
          { role: "user", content: "Responda apenas com a palavra 'ok'." },
        ],
        stream: false,
        max_tokens: 8,
      }),
    });
    const latency = Date.now() - started;
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, latency, error: `${resp.status}: ${text.slice(0, 240)}` };
    }
    return { ok: true, latency };
  } catch (e) {
    return { ok: false, latency: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requestedIds = body.task_ids;

    // Resolve effective tasks: priorizar tarefas com prompt ativo no DB.
    const { data: actives, error: actErr } = await admin
      .from("ai_prompt_versions")
      .select("task_id, model_id, system_prompt")
      .eq("is_active", true);
    if (actErr) throw actErr;

    const byTask = new Map<string, { model_id: string | null; system_prompt: string | null }>();
    for (const r of actives ?? []) {
      if (!byTask.has(r.task_id)) byTask.set(r.task_id, { model_id: r.model_id, system_prompt: r.system_prompt });
    }

    const taskIds = (requestedIds && requestedIds.length > 0)
      ? requestedIds
      : Array.from(byTask.keys());

    const results: Array<{ task_id: string; ok: boolean; latency_ms: number; model_id: string; error?: string }> = [];

    for (const task_id of taskIds) {
      const cfg = byTask.get(task_id) ?? {};
      // Override de modelo em ai_configurations (ai_model_<task>) tem precedência
      let modelId = cfg.model_id ?? "google/gemini-3-flash-preview";
      try {
        const { data: cfgRow } = await admin
          .from("ai_configurations")
          .select("config_value")
          .eq("config_key", `ai_model_${task_id}`)
          .maybeSingle();
        if (cfgRow?.config_value) {
          modelId = typeof cfgRow.config_value === "string"
            ? cfgRow.config_value.replace(/^"|"$/g, "")
            : String(cfgRow.config_value);
        }
      } catch { /* ignore */ }

      const ping = await pingModel(modelId, cfg.system_prompt ?? null);
      results.push({ task_id, ok: ping.ok, latency_ms: ping.latency, model_id: modelId, error: ping.error });

      await admin.from("ai_task_status").upsert({
        task_id,
        last_run_at: new Date().toISOString(),
        last_latency_ms: ping.latency,
        last_model_id: modelId,
        last_error: ping.ok ? null : (ping.error?.slice(0, 500) ?? "unknown"),
        ok: ping.ok,
        updated_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ checked: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[ai-task-healthcheck]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});