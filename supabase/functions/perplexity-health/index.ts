import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Sonar family currently exposed by Perplexity.
// We hard-code the catalog (Perplexity has no public "list models" endpoint)
// and the health-check pings the *selected* model so the user can confirm
// the API key has access to that specific tier.
const SUPPORTED_MODELS = [
  { id: "sonar", label: "Sonar", description: "Fast, lightweight web search" },
  { id: "sonar-pro", label: "Sonar Pro", description: "Multi-step reasoning, 2× more citations" },
  { id: "sonar-reasoning", label: "Sonar Reasoning", description: "Chain-of-thought + real-time search" },
  { id: "sonar-reasoning-pro", label: "Sonar Reasoning Pro", description: "Advanced reasoning (DeepSeek R1)" },
  { id: "sonar-deep-research", label: "Sonar Deep Research", description: "Multi-query expert research" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

  if (!PERPLEXITY_API_KEY) {
    return new Response(
      JSON.stringify({
        configured: false,
        connected: false,
        error: "PERPLEXITY_API_KEY não está configurada no backend",
        supported_models: SUPPORTED_MODELS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Optional `model` override via query string or POST body; defaults to "sonar".
  let requestedModel = "sonar";
  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get("model");
    if (qp) requestedModel = qp;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as any));
      if (body?.model && typeof body.model === "string") requestedModel = body.model;
    }
  } catch (_) { /* ignore */ }

  const start = Date.now();
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: "Reply with the single word: ok" },
          { role: "user", content: "ping" },
        ],
        max_tokens: 5,
      }),
    });

    const latency_ms = Date.now() - start;
    const text = await resp.text();

    if (!resp.ok) {
      // Surface the most useful HTTP-error fields so the UI can explain
      // auth/scope failures (401 invalid key, 403 model not in plan, 429 quota…).
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch (_) { /* ignore */ }
      const providerMessage =
        parsed?.error?.message ||
        parsed?.message ||
        parsed?.detail ||
        text.slice(0, 240);
      const hint =
        resp.status === 401
          ? "Chave inválida ou expirada — verifique no painel da Perplexity."
          : resp.status === 403
          ? `Sua chave não tem acesso ao modelo "${requestedModel}". Selecione um modelo do seu plano.`
          : resp.status === 429
          ? "Cota/rate-limit excedido. Aguarde alguns minutos."
          : resp.status >= 500
          ? "Falha temporária do provedor."
          : undefined;
      return new Response(
        JSON.stringify({
          configured: true,
          connected: false,
          status: resp.status,
          status_text: resp.statusText,
          model: requestedModel,
          latency_ms,
          error: `Perplexity respondeu ${resp.status}: ${providerMessage}`,
          provider_error: parsed?.error ?? null,
          hint,
          supported_models: SUPPORTED_MODELS,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let model: string | undefined;
    try {
      const data = JSON.parse(text);
      model = data?.model;
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({
        configured: true,
        connected: true,
        latency_ms,
        model: model ?? requestedModel,
        requested_model: requestedModel,
        checked_at: new Date().toISOString(),
        supported_models: SUPPORTED_MODELS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        configured: true,
        connected: false,
        latency_ms: Date.now() - start,
        model: requestedModel,
        error: e instanceof Error ? e.message : String(e),
        supported_models: SUPPORTED_MODELS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
