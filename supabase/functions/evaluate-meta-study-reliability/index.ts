// Edge function: Avalia confiabilidade de meta-estudos via Lovable AI Gateway.
// Aceita { study_ids?: string[], all_pending?: boolean }.
// Para cada estudo, chama Gemini com tool-calling pedindo 5 notas 0-5 + justificativa,
// e grava em reliability_methodology/evidence_base/applicability/reproducibility/relevance.
// reliability_overall é GENERATED STORED no banco — não precisa ser escrita.
// Sugestão completa (com rationales) vai em reliability_suggested JSONB para auditoria.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const SYSTEM_FALLBACK =
  'Você é um curador científico sênior. Avalia rigorosamente meta-estudos arquiteturais para um produto de nutracêuticos veterinários (longevidade canina). Sempre responde via tool call.';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TOOL = {
  type: "function",
  function: {
    name: "rate_study_reliability",
    description:
      "Avalia 5 dimensões de confiabilidade de um meta-estudo arquitetural em escala 0-5 (com casas decimais 0.5). 0 = ausente/inadequado, 5 = excelente. Considere o contexto de produto: nutracêuticos veterinários para longevidade canina (geroprotetores). Se não houver informação suficiente para uma dimensão, atribua a nota mais provável baseada no título/journal/ano e indique baixa confiança na justificativa.",
    parameters: {
      type: "object",
      properties: {
        methodology: {
          type: "number",
          description: "Rigor do método e desenho do estudo (0-5).",
        },
        methodology_rationale: { type: "string" },
        evidence_base: {
          type: "number",
          description: "Qualidade e volume das fontes citadas (0-5).",
        },
        evidence_base_rationale: { type: "string" },
        applicability: {
          type: "number",
          description: "Aplicabilidade ao contexto canino/geroprotetor (0-5).",
        },
        applicability_rationale: { type: "string" },
        reproducibility: {
          type: "number",
          description: "Replicabilidade do que propõe (0-5).",
        },
        reproducibility_rationale: { type: "string" },
        relevance: {
          type: "number",
          description: "Relevância translacional para o produto (0-5).",
        },
        relevance_rationale: { type: "string" },
        overall_summary: {
          type: "string",
          description: "Resumo em 1-2 frases do julgamento global.",
        },
      },
      required: [
        "methodology",
        "methodology_rationale",
        "evidence_base",
        "evidence_base_rationale",
        "applicability",
        "applicability_rationale",
        "reproducibility",
        "reproducibility_rationale",
        "relevance",
        "relevance_rationale",
        "overall_summary",
      ],
      additionalProperties: false,
    },
  },
};

function clamp(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(5, Math.round(v * 2) / 2));
}

async function evaluateOne(study: any, systemPrompt: string) {
  const prompt = `Avalie a confiabilidade deste meta-estudo arquitetural usando a ferramenta rate_study_reliability.

Título: ${study.title || "(sem título)"}
Autores: ${study.authors || "(não informado)"}
Ano: ${study.year || "?"}
Periódico: ${study.journal || "(não informado)"}
DOI: ${study.doi || "—"}
Tipo (kind): ${study.kind || "—"}
Resumo/Notas: ${(study.summary || "").slice(0, 4000) || "(sem resumo)"}
Padrões arquiteturais extraídos: ${JSON.stringify(study.architectural_patterns || []).slice(0, 1500)}
Métricas de avaliação: ${JSON.stringify(study.evaluation_metrics || []).slice(0, 800)}
Regras propostas: ${(study.proposed_rules || []).length} regras

Contexto: nutracêuticos veterinários para longevidade/geroproteção canina. Avalie em 0-5.`;

  const model = 'google/gemini-3-flash-preview';
  const t0 = Date.now();
  const resp = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: prompt },
        ],
        tools: [TOOL],
        tool_choice: {
          type: "function",
          function: { name: "rate_study_reliability" },
        },
      }),
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    logPromptUsage({
      prompt_key: 'evaluate_meta_study_reliability',
      function_name: 'evaluate-meta-study-reliability',
      model,
      latency_ms: Date.now() - t0,
      success: false,
      error: `http_${resp.status}`,
    });
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 300)}`);
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    logPromptUsage({
      prompt_key: 'evaluate_meta_study_reliability',
      function_name: 'evaluate-meta-study-reliability',
      model,
      latency_ms: Date.now() - t0,
      success: false,
      error: 'no_tool_call',
    });
    throw new Error("Sem tool call na resposta");
  }
  const args = JSON.parse(toolCall.function.arguments || "{}");
  logPromptUsage({
    prompt_key: 'evaluate_meta_study_reliability',
    function_name: 'evaluate-meta-study-reliability',
    model,
    latency_ms: Date.now() - t0,
    tokens_in: data?.usage?.prompt_tokens ?? null,
    tokens_out: data?.usage?.completion_tokens ?? null,
    success: true,
  });

  return {
    methodology: clamp(args.methodology),
    evidence_base: clamp(args.evidence_base),
    applicability: clamp(args.applicability),
    reproducibility: clamp(args.reproducibility),
    relevance: clamp(args.relevance),
    rationales: {
      methodology: args.methodology_rationale,
      evidence_base: args.evidence_base_rationale,
      applicability: args.applicability_rationale,
      reproducibility: args.reproducibility_rationale,
      relevance: args.relevance_rationale,
      overall_summary: args.overall_summary,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { study_ids, all_pending, overwrite } = body as {
      study_ids?: string[];
      all_pending?: boolean;
      overwrite?: boolean;
    };

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let query = supabase
      .from("meta_studies")
      .select(
        "id,title,authors,year,journal,doi,kind,summary,architectural_patterns,evaluation_metrics,proposed_rules,reliability_overall",
      );
    if (study_ids && study_ids.length > 0) {
      query = query.in("id", study_ids);
    } else if (all_pending) {
      query = query.is("reliability_overall", null).limit(50);
    } else {
      return new Response(
        JSON.stringify({
          error: "Informe study_ids[] ou all_pending=true",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: studies, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!studies || studies.length === 0) {
      return new Response(
        JSON.stringify({ evaluated: 0, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Array<{
      id: string;
      ok: boolean;
      overall?: number | null;
      error?: string;
    }> = [];

    // Sequencial para não estourar rate limit.
    for (const s of studies) {
      if (!overwrite && s.reliability_overall != null) {
        results.push({ id: s.id, ok: true, overall: s.reliability_overall });
        continue;
      }
      try {
        const r = await evaluateOne(s, systemPrompt);
        const update = {
          reliability_methodology: r.methodology,
          reliability_evidence_base: r.evidence_base,
          reliability_applicability: r.applicability,
          reliability_reproducibility: r.reproducibility,
          reliability_relevance: r.relevance,
          reliability_suggested: {
            scores: {
              methodology: r.methodology,
              evidence_base: r.evidence_base,
              applicability: r.applicability,
              reproducibility: r.reproducibility,
              relevance: r.relevance,
            },
            rationales: r.rationales,
            generated_at: new Date().toISOString(),
            model: "google/gemini-3-flash-preview",
          },
        };
        const { data: upd, error: upErr } = await supabase
          .from("meta_studies")
          .update(update)
          .eq("id", s.id)
          .select("reliability_overall")
          .maybeSingle();
        if (upErr) throw upErr;
        results.push({
          id: s.id,
          ok: true,
          overall: (upd as any)?.reliability_overall ?? null,
        });
      } catch (e) {
        console.error("Falha no estudo", s.id, e);
        results.push({
          id: s.id,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({ evaluated: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("evaluate-meta-study-reliability error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});