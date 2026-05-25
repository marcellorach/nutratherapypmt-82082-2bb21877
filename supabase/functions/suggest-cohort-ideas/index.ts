// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";

const SYSTEM_PROMPT = `Você é um pesquisador sênior em medicina veterinária focado em longevidade canina.
Recebe sinais quantitativos de uma plataforma de RAG médico (Senex AI) e propõe 5 cohorts
que a PetLove (maior rede vet do Brasil) poderia compartilhar do seu histórico (centenas
de milhares de prontuários) para destravar descobertas com alto valor clínico.

Critérios para um bom cohort:
- Foco em doenças metabólicas/degenerativas em cães (escopo da plataforma).
- Recorte específico o bastante para ser estatisticamente útil (N=200–2000).
- Combina sinais internos (gaps do Knowledge Graph, conflitos, baixa cobertura)
  com a força da PetLove (histórico longitudinal real).
- Diversidade: pelo menos 1 cohort de prevenção, 1 de validação de tratamento,
  1 de descoberta exploratória.
- Cada cohort gera uma descoberta acionável (mudança de protocolo, novo guideline,
  validação de hipótese, prevenção raça-específica).

Score (impacto × viabilidade) é 0–100. Impacto alto = descoberta destrava decisão clínica.
Viabilidade alta = dado provavelmente já está estruturado no histórico PetLove.`;

const TOOL = {
  type: "function",
  function: {
    name: "propose_cohorts",
    description: "Propõe 5 cohorts que a PetLove poderia compartilhar.",
    parameters: {
      type: "object",
      properties: {
        cohorts: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Nome curto e clínico do cohort, ex.: 'Golden 8+ com elevação de ALT'" },
              rationale: { type: "string", description: "Por que este cohort é interessante (2–3 frases)" },
              suggested_criteria: {
                type: "object",
                properties: {
                  breeds: { type: "string" },
                  age_range: { type: "string" },
                  weight_range: { type: "string" },
                  conditions: { type: "string" },
                  current_meds: { type: "string" },
                  exclusion: { type: "string" },
                  target_n: { type: "string" }
                },
                required: ["breeds", "age_range", "conditions", "target_n"],
                additionalProperties: false
              },
              discoverable: { type: "string", description: "O que poderíamos descobrir (1–2 frases acionáveis)" },
              kind: { type: "string", enum: ["prevention", "treatment_validation", "exploratory"] },
              impact_score: { type: "number", minimum: 0, maximum: 100 },
              viability_score: { type: "number", minimum: 0, maximum: 100 }
            },
            required: ["title", "rationale", "suggested_criteria", "discoverable", "kind", "impact_score", "viability_score"],
            additionalProperties: false
          }
        }
      },
      required: ["cohorts"],
      additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const signals = body?.signals ?? {};
    const authHeader = req.headers.get("Authorization") ?? "";

    const userPrompt = `Sinais atuais da plataforma Senex AI:

\`\`\`json
${JSON.stringify(signals, null, 2)}
\`\`\`

Proponha 5 cohorts que a PetLove poderia compartilhar para destravar descobertas
com alto valor clínico em longevidade canina. Diversifique entre prevenção,
validação de tratamento e descoberta exploratória.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "propose_cohorts" } },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error", resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos Lovable AI esgotados. Adicione em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error", details: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let parsed: any = {};
    try { parsed = typeof args === "string" ? JSON.parse(args) : (args ?? {}); }
    catch (e) { console.error("Failed to parse tool args", e, args); }

    const cohorts: any[] = parsed?.cohorts ?? [];

    // Persist suggestions (best-effort, admin-only). Requires service role to bypass RLS safely.
    let persisted = 0;
    try {
      if (cohorts.length && authHeader) {
        const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: userData } = await userClient.auth.getUser();
        const userId = userData?.user?.id ?? null;
        const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const rows = cohorts.map((c: any) => ({
          title: String(c.title ?? "(sem título)").slice(0, 240),
          rationale: c.rationale ?? null,
          suggested_criteria: c.suggested_criteria ?? {},
          discoverable: c.discoverable ?? null,
          kind: c.kind ?? "exploratory",
          impact_score: c.impact_score ?? null,
          viability_score: c.viability_score ?? null,
          source_model: MODEL,
          signals,
          created_by: userId,
        }));
        const { error: insErr } = await service.from("cohort_suggestions").insert(rows);
        if (insErr) console.error("Persist suggestions failed", insErr);
        else persisted = rows.length;
      }
    } catch (e) {
      console.error("Persist suggestions exception", e);
    }

    return new Response(JSON.stringify({
      ok: true,
      model: MODEL,
      cohorts,
      persisted,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("suggest-cohort-ideas error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});