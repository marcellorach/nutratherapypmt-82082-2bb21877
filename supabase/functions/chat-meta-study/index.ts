// Edge function: chat contextual sobre um meta-estudo arquitetural.
// Streaming via Lovable AI Gateway. Contexto = summary + key_claims + proposed_rules + core_rule_evidence do próprio registro.
// Não faz RAG novo — o registro já foi curado e cabe inteiro no system prompt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildSystemPrompt(study: any, evidence: any[]): string {
  const claims = (study.key_claims || []).slice(0, 12).map((c: any, i: number) => {
    const txt = typeof c === "string" ? c : (c.claim || c.text || JSON.stringify(c));
    const quote = c?.quote ? ` [quote: "${String(c.quote).slice(0, 200)}"]` : "";
    return `  ${i + 1}. ${txt}${quote}`;
  }).join("\n");

  const rules = (study.proposed_rules || []).slice(0, 8).map((r: any, i: number) => {
    const txt = typeof r === "string" ? r : (r.title || r.rule || JSON.stringify(r));
    return `  ${i + 1}. ${txt}`;
  }).join("\n");

  const ev = evidence.slice(0, 10).map((e: any) =>
    `  - ${e.relation} ${e.rule_title || e.rule_id} (peso ${e.weight})${e.quote ? `: "${String(e.quote).slice(0, 160)}"` : ""}`
  ).join("\n");

  return [
    `Você é um curador científico do Senex AI ajudando a discutir o paper "${study.title}" (${study.authors || "autores n/d"}, ${study.year || "ano n/d"}, ${study.journal || ""}).`,
    `Tipo: ${study.kind}. Confiabilidade geral: ${study.reliability_overall != null ? `★${Number(study.reliability_overall).toFixed(1)}/5` : "não avaliada"}.`,
    "",
    "RESUMO DO PAPER:",
    study.summary || "(sem resumo cadastrado)",
    "",
    "CLAIMS-CHAVE EXTRAÍDOS:",
    claims || "(nenhum)",
    "",
    "REGRAS PROPOSTAS (para a arquitetura do Senex AI):",
    rules || "(nenhuma)",
    "",
    "IMPACTO NAS CORE RULES DO PRODUTO:",
    ev || "(ainda não conectado a nenhuma core rule)",
    "",
    "INSTRUÇÕES:",
    "- Responda no idioma da pergunta do usuário (PT ou EN).",
    "- Seja conciso, técnico e cite o claim numerado quando relevante.",
    "- Se a pergunta sair do escopo deste paper, diga claramente e ofereça redirecionamento.",
    "- NUNCA invente dados que não estejam no contexto acima. Diga 'não consta no paper'.",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const { meta_study_id, messages } = await req.json();
    if (!meta_study_id || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "meta_study_id and messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: study, error } = await supa
      .from("meta_studies")
      .select("id, title, authors, year, journal, kind, summary, key_claims, proposed_rules, reliability_overall")
      .eq("id", meta_study_id)
      .maybeSingle();
    if (error || !study) {
      return new Response(JSON.stringify({ error: "study not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: evRaw } = await supa
      .from("core_rule_evidence")
      .select("relation, weight, quote, rule_id, core_rules!inner(title, rule_id)")
      .eq("meta_study_id", meta_study_id);
    const evidence = (evRaw || []).map((e: any) => ({
      relation: e.relation,
      weight: e.weight,
      quote: e.quote,
      rule_id: e.core_rules?.rule_id || e.rule_id,
      rule_title: e.core_rules?.title,
    }));

    const system = buildSystemPrompt(study, evidence);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados no Lovable AI." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `gateway ${resp.status}: ${t.slice(0, 200)}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});