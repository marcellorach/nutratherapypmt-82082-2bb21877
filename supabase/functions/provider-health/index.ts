// provider-health
// Generic LLM-provider health-check used by the Configurações IA panel.
// Tests authentication AND scope (i.e. that the configured key can actually
// reach the chat/models endpoint) and surfaces detailed HTTP-error info.
//
// Body: { provider: 'openai' | 'claude' | 'gemini' | 'grok' | 'perplexity', model?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Provider = "openai" | "claude" | "gemini" | "grok" | "perplexity";

interface ProviderConfig {
  envVar: string;
  defaultModel: string;
  call: (key: string, model: string) => Promise<Response>;
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  openai: {
    envVar: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    call: (key, model) =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      }),
  },
  claude: {
    envVar: "ANTHROPIC_API_KEY",
    defaultModel: "claude-3-5-haiku-20241022",
    call: (key, model) =>
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      }),
  },
  gemini: {
    envVar: "GOOGLE_AI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    call: (key, model) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        },
      ),
  },
  grok: {
    envVar: "XAI_API_KEY",
    defaultModel: "grok-2-latest",
    call: (key, model) =>
      fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      }),
  },
  perplexity: {
    envVar: "PERPLEXITY_API_KEY",
    defaultModel: "sonar",
    call: (key, model) =>
      fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      }),
  },
};

function hintFor(status: number, model: string): string | undefined {
  if (status === 401) return "Chave inválida ou expirada.";
  if (status === 403) return `Sua chave não tem acesso ao modelo "${model}".`;
  if (status === 404) return `Modelo "${model}" não encontrado para esta chave.`;
  if (status === 429) return "Cota/rate-limit excedido.";
  if (status >= 500) return "Falha temporária do provedor.";
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: { provider?: Provider; model?: string } = {};
  try { body = await req.json(); } catch (_) { /* ignore */ }

  const provider = body.provider as Provider;
  if (!provider || !(provider in PROVIDERS)) {
    return new Response(
      JSON.stringify({ error: `provider inválido. Use um de: ${Object.keys(PROVIDERS).join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const cfg = PROVIDERS[provider];
  const key = Deno.env.get(cfg.envVar);
  if (!key) {
    return new Response(
      JSON.stringify({
        provider,
        configured: false,
        connected: false,
        error: `${cfg.envVar} não está configurada no backend`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const model = body.model || cfg.defaultModel;
  const start = Date.now();
  try {
    const resp = await cfg.call(key, model);
    const latency_ms = Date.now() - start;
    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch (_) { /* ignore */ }

    if (!resp.ok) {
      const providerMessage =
        parsed?.error?.message ||
        parsed?.error?.[0]?.message ||
        parsed?.message ||
        parsed?.detail ||
        text.slice(0, 240);
      return new Response(
        JSON.stringify({
          provider,
          configured: true,
          connected: false,
          status: resp.status,
          status_text: resp.statusText,
          model,
          latency_ms,
          error: `${provider} respondeu ${resp.status}: ${providerMessage}`,
          provider_error: parsed?.error ?? null,
          hint: hintFor(resp.status, model),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        provider,
        configured: true,
        connected: true,
        latency_ms,
        model,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        provider,
        configured: true,
        connected: false,
        latency_ms: Date.now() - start,
        model,
        error: e instanceof Error ? e.message : String(e),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});