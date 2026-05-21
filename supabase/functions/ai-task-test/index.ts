// Phase 2 governance: test a prompt × model against the Lovable AI Gateway.
// Admin-only. Logs every run to ai_prompt_test_runs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

interface TestBody {
  task_id: string;
  model_id: string;
  prompt_version_id?: string | null;
  system_prompt?: string | null;
  user_prompt?: string | null;
  input: string;
  reasoning_effort?: "minimal" | "low" | "medium" | "high" | "xhigh";
  temperature?: number;
}

// rough cost in USD per 1k tokens — purely indicative for the UI.
const COST_PER_1K: Record<string, { in: number; out: number }> = {
  "openai/gpt-5.4": { in: 0.005, out: 0.015 },
  "openai/gpt-5.4-mini": { in: 0.0015, out: 0.006 },
  "openai/gpt-5.5": { in: 0.008, out: 0.024 },
  "openai/gpt-5": { in: 0.005, out: 0.015 },
  "openai/gpt-5-mini": { in: 0.0015, out: 0.006 },
  "google/gemini-2.5-pro": { in: 0.00125, out: 0.005 },
  "google/gemini-3-pro-preview": { in: 0.00125, out: 0.005 },
  "google/gemini-3-flash-preview": { in: 0.0003, out: 0.0012 },
  "google/gemini-2.5-flash": { in: 0.0003, out: 0.0012 },
  "google/gemini-2.5-flash-lite": { in: 0.0001, out: 0.0004 },
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const c = COST_PER_1K[model];
  if (!c) return 0;
  return Number(((tokensIn / 1000) * c.in + (tokensOut / 1000) * c.out).toFixed(6));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Identify user from JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdminData, error: isAdminErr } = await admin.rpc("is_admin");
    // is_admin() uses auth.uid() which is null when called with service role.
    // Fallback: check user_roles directly.
    let isAdmin = !!isAdminData && !isAdminErr;
    if (!isAdmin) {
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roles;
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as TestBody;
    if (!body?.task_id || !body?.model_id || !body?.input) {
      return new Response(JSON.stringify({ error: "task_id, model_id and input are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve prompts: explicit overrides → active version for (task, model) → active for task → empty
    let systemPrompt = body.system_prompt ?? null;
    let userTemplate = body.user_prompt ?? null;
    let promptVersionId = body.prompt_version_id ?? null;
    if (!systemPrompt && !userTemplate) {
      const { data: versions } = await admin
        .from("ai_prompt_versions")
        .select("id, system_prompt, user_prompt, model_id")
        .eq("task_id", body.task_id)
        .eq("is_active", true);
      const exactMatch = versions?.find((v) => v.model_id === body.model_id);
      const fallback = versions?.find((v) => !v.model_id) ?? versions?.[0];
      const chosen = exactMatch ?? fallback;
      if (chosen) {
        systemPrompt = chosen.system_prompt;
        userTemplate = chosen.user_prompt;
        promptVersionId = chosen.id;
      }
    }

    const userMessage = userTemplate
      ? userTemplate.replace(/\{\{\s*input\s*\}\}/g, body.input)
      : body.input;

    const payload: Record<string, unknown> = {
      model: body.model_id,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: userMessage },
      ],
      stream: false,
    };
    if (body.reasoning_effort) payload.reasoning = { effort: body.reasoning_effort };
    if (typeof body.temperature === "number") payload.temperature = body.temperature;

    const started = Date.now();
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const latency = Date.now() - started;

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      await admin.from("ai_prompt_test_runs").insert({
        task_id: body.task_id,
        model_id: body.model_id,
        prompt_version_id: promptVersionId,
        input_text: body.input,
        latency_ms: latency,
        run_by: userId,
        error: `${aiResp.status}: ${errText.slice(0, 500)}`,
      });
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 502;
      return new Response(
        JSON.stringify({ error: `AI gateway error ${aiResp.status}`, detail: errText.slice(0, 1000) }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiResp.json();
    const output: string = json?.choices?.[0]?.message?.content ?? "";
    const tokensIn: number = json?.usage?.prompt_tokens ?? 0;
    const tokensOut: number = json?.usage?.completion_tokens ?? 0;
    const cost = estimateCost(body.model_id, tokensIn, tokensOut);

    const { data: inserted } = await admin
      .from("ai_prompt_test_runs")
      .insert({
        task_id: body.task_id,
        model_id: body.model_id,
        prompt_version_id: promptVersionId,
        input_text: body.input,
        output_text: output,
        latency_ms: latency,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_estimate: cost,
        run_by: userId,
      })
      .select("id")
      .maybeSingle();

    return new Response(
      JSON.stringify({
        ok: true,
        run_id: inserted?.id ?? null,
        output,
        latency_ms: latency,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_estimate: cost,
        prompt_version_id: promptVersionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-task-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});