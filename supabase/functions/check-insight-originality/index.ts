// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const PERPLEXITY_PROMPT_KEY = "check_insight_originality_perplexity";
const PERPLEXITY_FALLBACK = "You are a veterinary literature search assistant. Only cite peer-reviewed canine veterinary sources.";
const GEMINI_PROMPT_KEY = "check_insight_originality_gemini_fallback";
const GEMINI_FALLBACK = "You are an expert in canine veterinary literature. Reason from training knowledge only — flag uncertainty.";
const GEMINI_MODEL = "google/gemini-3.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: adminFlag } = await userClient.rpc("is_admin");
    if (!adminFlag) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { insight_id } = await req.json();
    if (!insight_id) return new Response(JSON.stringify({ error: "insight_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: insight } = await service.from("cohort_insights").select("*").eq("id", insight_id).single();
    if (!insight) return new Response(JSON.stringify({ error: "Insight not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Strategy: prefer Perplexity if configured; fallback to Gemini-based literature reasoning.
    const query = `In canine veterinary literature (PubMed, Vet journals), how well-established is this finding: "${insight.title}". ${insight.summary}. Signals: ${(insight.signals ?? []).join(", ")}. Cite up to 5 specific peer-reviewed studies (year + first author + journal). If you cannot find direct evidence, say so. End with a single line: "novelty: novel|partial|known".`;

    let providerUsed = "perplexity";
    let answer = "";
    let citations: string[] = [];

    if (PERPLEXITY_API_KEY) {
      try {
        const systemPrompt = await fetchSystemPrompt(PERPLEXITY_PROMPT_KEY, PERPLEXITY_FALLBACK);
        const t0 = Date.now();
        const r = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: 0.1,
            max_tokens: 600,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          answer = d?.choices?.[0]?.message?.content ?? "";
          citations = d?.citations ?? [];
          await logPromptUsage({
            prompt_key: PERPLEXITY_PROMPT_KEY,
            function_name: "check-insight-originality",
            model: "sonar",
            latency_ms: Date.now() - t0,
            tokens_in: d?.usage?.prompt_tokens ?? null,
            tokens_out: d?.usage?.completion_tokens ?? null,
            success: true,
          });
        } else {
          await logPromptUsage({ prompt_key: PERPLEXITY_PROMPT_KEY, function_name: "check-insight-originality", model: "sonar", latency_ms: Date.now() - t0, success: false, error: `perplexity_${r.status}` });
          providerUsed = "gemini-fallback";
        }
      } catch {
        providerUsed = "gemini-fallback";
      }
    } else {
      providerUsed = "gemini-fallback";
    }

    if (!answer) {
      // Fallback: Gemini reasoning (no web access — produces best-effort assessment)
      const systemPrompt = await fetchSystemPrompt(GEMINI_PROMPT_KEY, GEMINI_FALLBACK);
      const t0 = Date.now();
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
        }),
      });
      const d = await r.json();
      answer = d?.choices?.[0]?.message?.content ?? "";
      await logPromptUsage({
        prompt_key: GEMINI_PROMPT_KEY,
        function_name: "check-insight-originality",
        model: GEMINI_MODEL,
        latency_ms: Date.now() - t0,
        tokens_in: d?.usage?.prompt_tokens ?? null,
        tokens_out: d?.usage?.completion_tokens ?? null,
        success: r.ok,
        error: r.ok ? null : `gateway_${r.status}`,
      });
    }

    const noveltyMatch = answer.toLowerCase().match(/novelty:\s*(novel|partial|known)/);
    const novelty = (noveltyMatch?.[1] ?? "unknown") as "novel" | "partial" | "known" | "unknown";
    const status = novelty === "novel" ? "novel" : novelty === "known" ? "known" : novelty === "partial" ? "partial" : "unknown";

    const evidence = { provider: providerUsed, answer, citations, checked_at: new Date().toISOString() };
    await service.from("cohort_insights").update({
      originality_status: status,
      originality_checked_at: new Date().toISOString(),
      originality_evidence: evidence,
    }).eq("id", insight_id);

    return new Response(JSON.stringify({ ok: true, status, evidence }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});