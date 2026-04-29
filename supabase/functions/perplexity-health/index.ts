import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

  if (!PERPLEXITY_API_KEY) {
    return new Response(
      JSON.stringify({
        configured: false,
        connected: false,
        error: "PERPLEXITY_API_KEY não está configurada no backend",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const start = Date.now();
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
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
      return new Response(
        JSON.stringify({
          configured: true,
          connected: false,
          status: resp.status,
          latency_ms,
          error: `Perplexity respondeu ${resp.status}: ${text.slice(0, 240)}`,
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
        model: model ?? "sonar",
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        configured: true,
        connected: false,
        latency_ms: Date.now() - start,
        error: e instanceof Error ? e.message : String(e),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
