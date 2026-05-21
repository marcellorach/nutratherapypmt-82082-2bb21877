/**
 * Roteador universal de chamadas IA (Fase 2.5 — governança completa).
 *
 * Resolve, para cada `task_id`:
 *   1. Modelo ativo (override em `ai_configurations.ai_model_<task_id>` ou recomendado estático).
 *   2. Prompt ativo em `ai_prompt_versions` (versão `is_active=true`).
 *   3. Parâmetros de routing (reasoning_effort, temperature, context_caching).
 *
 * Executa via Lovable AI Gateway e registra TODA invocação em
 * `ai_task_invocations` + atualiza `ai_task_status`.
 *
 * Garantia de não-quebra: se nada estiver semeado em banco, usa fallback
 * fornecido pelo caller — comportamento legado preservado.
 */

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

// Cache in-memory de 30s para reduzir reads no DB por chamada do router.
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; value: ResolvedTask }>();

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export interface ResolvedTask {
  task_id: string;
  model_id: string;
  system_prompt: string | null;
  user_prompt: string | null;
  prompt_version_id: string | null;
  reasoning_effort?: ReasoningEffort;
  temperature?: number;
  source: "db" | "fallback";
}

export interface CallAITaskOptions {
  /** Substitui `{{input}}` no user_prompt; também pode haver outras variáveis em `variables`. */
  input?: string;
  variables?: Record<string, string>;
  /** Permite override por chamada (raro — útil para A/B em runtime). */
  override_model?: string;
  override_system_prompt?: string;
  override_user_prompt?: string;
  reasoning_effort?: ReasoningEffort;
  temperature?: number;
  /** Função que está chamando — preenche `ai_task_invocations.caller_function`. */
  caller: string;
  /** Plain messages para chat multi-turn — quando passado, substitui o user_prompt resolvido. */
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  /** Tool / function calling — quando passado, a chamada usa tool calls e o resultado vem em `tool_calls`. */
  tools?: any[];
  tool_choice?: any;
  /** Fallback caso resolveTask não encontre nada (preserva comportamento legado). */
  fallback?: {
    model_id: string;
    system_prompt?: string | null;
    user_prompt?: string | null;
    reasoning_effort?: ReasoningEffort;
    temperature?: number;
  };
}

export interface CallAITaskResult {
  ok: true;
  output: string;
  model_used: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  prompt_version_id: string | null;
  tool_calls?: any[];
  raw: any;
}

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

function estimateCost(model: string, tIn: number, tOut: number): number {
  const c = COST_PER_1K[model];
  if (!c) return 0;
  return Number(((tIn / 1000) * c.in + (tOut / 1000) * c.out).toFixed(6));
}

export async function resolveTask(
  taskId: string,
  fallback?: CallAITaskOptions["fallback"],
): Promise<ResolvedTask> {
  const cached = cache.get(taskId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  // 1. modelo override em ai_configurations
  let model: string | null = null;
  try {
    const { data: cfg } = await admin
      .from("ai_configurations")
      .select("config_value")
      .eq("config_key", `ai_model_${taskId}`)
      .maybeSingle();
    if (cfg?.config_value) {
      model = typeof cfg.config_value === "string"
        ? cfg.config_value.replace(/^"|"$/g, "")
        : String(cfg.config_value);
    }
  } catch (_) { /* tabela pode estar vazia para esta task — ok */ }

  // 2. prompt ativo
  let systemPrompt: string | null = null;
  let userPrompt: string | null = null;
  let promptVersionId: string | null = null;
  let promptModelId: string | null = null;
  try {
    const { data: versions } = await admin
      .from("ai_prompt_versions")
      .select("id, system_prompt, user_prompt, model_id")
      .eq("task_id", taskId)
      .eq("is_active", true);
    if (versions && versions.length > 0) {
      const exact = model ? versions.find((v: any) => v.model_id === model) : undefined;
      const generic = versions.find((v: any) => !v.model_id);
      const chosen = exact ?? generic ?? versions[0];
      systemPrompt = chosen.system_prompt;
      userPrompt = chosen.user_prompt;
      promptVersionId = chosen.id;
      promptModelId = chosen.model_id;
    }
  } catch (_) { /* sem prompts ainda — usa fallback */ }

  const finalModel = model ?? promptModelId ?? fallback?.model_id ?? "google/gemini-3-flash-preview";
  const value: ResolvedTask = {
    task_id: taskId,
    model_id: finalModel,
    system_prompt: systemPrompt ?? fallback?.system_prompt ?? null,
    user_prompt: userPrompt ?? fallback?.user_prompt ?? null,
    prompt_version_id: promptVersionId,
    reasoning_effort: fallback?.reasoning_effort,
    temperature: fallback?.temperature,
    source: (promptVersionId || model) ? "db" : "fallback",
  };
  cache.set(taskId, { at: Date.now(), value });
  return value;
}

function interpolate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? "");
}

export async function logInvocation(row: {
  task_id: string;
  model_id: string;
  prompt_version_id: string | null;
  caller_function: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  ok: boolean;
  error?: string | null;
}) {
  try {
    await admin.from("ai_task_invocations").insert(row);
    await admin.from("ai_task_status").upsert({
      task_id: row.task_id,
      last_run_at: new Date().toISOString(),
      last_latency_ms: row.latency_ms,
      last_model_id: row.model_id,
      last_error: row.ok ? null : (row.error?.slice(0, 500) ?? null),
      ok: row.ok,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // logging best-effort — nunca quebra a chamada principal
    console.error("[ai-task-router] logInvocation failed:", e);
  }
}

export async function callAITask(
  taskId: string,
  opts: CallAITaskOptions,
): Promise<CallAITaskResult> {
  const resolved = await resolveTask(taskId, opts.fallback);
  const modelId = opts.override_model ?? resolved.model_id;
  const reasoning = opts.reasoning_effort ?? resolved.reasoning_effort;
  const temperature = opts.temperature ?? resolved.temperature;

  const systemPrompt = opts.override_system_prompt ?? resolved.system_prompt;
  let messages: Array<{ role: string; content: string }>;
  if (opts.messages && opts.messages.length > 0) {
    messages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...opts.messages]
      : opts.messages;
  } else {
    const userTpl = opts.override_user_prompt ?? resolved.user_prompt ?? "";
    const vars: Record<string, string> = { ...(opts.variables ?? {}) };
    if (opts.input !== undefined) vars.input = opts.input;
    const userMsg = userTpl ? interpolate(userTpl, vars) : (opts.input ?? "");
    messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: userMsg },
    ];
  }

  const payload: Record<string, unknown> = {
    model: modelId,
    messages,
    stream: false,
  };
  if (reasoning) payload.reasoning = { effort: reasoning };
  if (typeof temperature === "number") payload.temperature = temperature;
  if (opts.tools && opts.tools.length > 0) payload.tools = opts.tools;
  if (opts.tool_choice) payload.tool_choice = opts.tool_choice;

  const started = Date.now();
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const latency = Date.now() - started;

  if (!resp.ok) {
    const text = await resp.text();
    await logInvocation({
      task_id: taskId,
      model_id: modelId,
      prompt_version_id: resolved.prompt_version_id,
      caller_function: opts.caller,
      latency_ms: latency,
      tokens_in: 0,
      tokens_out: 0,
      cost_estimate: 0,
      ok: false,
      error: `${resp.status}: ${text.slice(0, 300)}`,
    });
    throw new Error(`AI Gateway ${resp.status}: ${text.slice(0, 300)}`);
  }

  const json = await resp.json();
  const output: string = json?.choices?.[0]?.message?.content ?? "";
  const toolCalls = json?.choices?.[0]?.message?.tool_calls;
  const tIn: number = json?.usage?.prompt_tokens ?? 0;
  const tOut: number = json?.usage?.completion_tokens ?? 0;
  const cost = estimateCost(modelId, tIn, tOut);

  await logInvocation({
    task_id: taskId,
    model_id: modelId,
    prompt_version_id: resolved.prompt_version_id,
    caller_function: opts.caller,
    latency_ms: latency,
    tokens_in: tIn,
    tokens_out: tOut,
    cost_estimate: cost,
    ok: true,
  });

  return {
    ok: true,
    output,
    model_used: modelId,
    latency_ms: latency,
    tokens_in: tIn,
    tokens_out: tOut,
    cost_estimate: cost,
    prompt_version_id: resolved.prompt_version_id,
    tool_calls: toolCalls,
    raw: json,
  };
}

/** Limpa o cache (chamado pelo healthcheck após mudanças). */
export function invalidateRouterCache() {
  cache.clear();
}
