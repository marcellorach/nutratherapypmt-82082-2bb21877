// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";
const PROMPT_KEY = "analyze_cohort_patterns";

const SYSTEM_FALLBACK = `Você é um epidemiologista veterinário lendo um cohort canino para descobrir
padrões longitudinais que destravem decisões clínicas. Foque em comorbidades cruzadas, padrões
laboratoriais (combinações de marcadores), prevalência por raça/idade, e oportunidades de prevenção.

Para cada padrão relevante, retorne 1 insight categorizado:
- 'discovery': observação estatística forte e nova
- 'hypothesis': hipótese causal/mecanística derivada da observação
- 'proposed_meta_study': meta-estudo que validaria a hipótese

REGRA OBRIGATÓRIA DE EVIDÊNCIA QUANTITATIVA: cada insight DEVE preencher o objeto 'evidence'
com números DERIVADOS DOS AGREGADOS FORNECIDOS — nada de prosa solta. Campos obrigatórios:
  - n_supporting: quantos pets sustentam o padrão
  - n_total: tamanho da cohort considerada
  - prevalence: n_supporting / n_total (0–1)
  - comparison_baseline: prevalência ou taxa de referência (string curta, ex: "vs 12% literatura canina geral")
  - effect_size: magnitude/odds/diferença observada (string curta, ex: "3.2x vs baseline")
  - notes: 1 linha explicando o cálculo
Se você NÃO consegue derivar números do agregado, NÃO produza o insight.

Gere pelo menos 6 insights bem distribuídos. Cada insight deve incluir título PT e EN,
resumo PT e EN (até 280 chars), evidência quantitativa estruturada, confiança 0–1, e sinais.`;

const TOOL = {
  type: "function",
  function: {
    name: "emit_cohort_insights",
    description: "Retorna insights derivados de um cohort canino.",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array",
          minItems: 6,
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["discovery", "hypothesis", "proposed_meta_study"] },
              title: { type: "string" },
              title_en: { type: "string" },
              summary: { type: "string" },
              summary_en: { type: "string" },
              evidence: {
                type: "object",
                description: "Evidência quantitativa OBRIGATÓRIA derivada da cohort.",
                properties: {
                  n_supporting: { type: "number" },
                  n_total: { type: "number" },
                  prevalence: { type: "number", minimum: 0, maximum: 1 },
                  comparison_baseline: { type: "string" },
                  effect_size: { type: "string" },
                  notes: { type: "string" },
                },
                required: ["n_supporting", "n_total", "prevalence", "comparison_baseline", "effect_size", "notes"],
                additionalProperties: true,
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              signals: { type: "array", items: { type: "string" } }
            },
            required: ["kind", "title", "title_en", "summary", "summary_en", "evidence", "confidence", "signals"],
            additionalProperties: false
          }
        }
      },
      required: ["insights"],
      additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: adminFlag } = await userClient.rpc("is_admin");
    if (!adminFlag) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    let cohort_id = body?.cohort_id;
    const force = Boolean(body?.force);
    const insight_id: string | undefined = body?.insight_id;
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If insight_id provided, resolve cohort_id from it (single-insight regeneration mode)
    let existingInsight: any = null;
    if (insight_id && !cohort_id) {
      const { data: ins } = await service.from("cohort_insights").select("*").eq("id", insight_id).single();
      if (!ins) {
        return new Response(JSON.stringify({ error: "insight not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      existingInsight = ins;
      cohort_id = ins.cohort_id;
    }
    if (!cohort_id) {
      return new Response(JSON.stringify({ error: "cohort_id or insight_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const log: Array<{ ts: string; level: "info" | "warn" | "error"; message: string }> = [];
    const pushLog = async (
      level: "info" | "warn" | "error",
      message: string,
      persist = true,
    ) => {
      log.push({ ts: new Date().toISOString(), level, message });
      if (persist) {
        await service
          .from("synthetic_cohorts")
          .update({ analysis_log: log })
          .eq("id", cohort_id);
      }
    };

    // load cohort + sample of pets (compacted for prompt size)
    const { data: cohort } = await service.from("synthetic_cohorts").select("*").eq("id", cohort_id).single();
    if (!cohort) {
      return new Response(JSON.stringify({ error: "Cohort not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard against accidental re-runs (<24h) unless force=true
    if (!force && !insight_id && cohort.last_analyzed_at) {
      const ageMs = Date.now() - new Date(cohort.last_analyzed_at).getTime();
      if (ageMs < 24 * 3600 * 1000) {
        return new Response(
          JSON.stringify({
            error: "already_analyzed",
            message: `Cohort analisado há ${Math.round(ageMs / 60000)} min. Use force=true para re-analisar.`,
            last_analyzed_at: cohort.last_analyzed_at,
            last_count: cohort.last_analysis_insights_count,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Reset log for this run
    await service.from("synthetic_cohorts").update({ analysis_log: [] }).eq("id", cohort_id);
    await pushLog("info", `Iniciando análise de padrões (modelo: ${MODEL})`);

    const { data: pets } = await service
      .from("pet_profiles")
      .select("id, breed, sex, age_years, weight_kg")
      .eq("cohort_id", cohort_id);
    const petIds = (pets ?? []).map((p: any) => p.id);
    await pushLog("info", `Carregados ${pets?.length ?? 0} pets do cohort`);

    const { data: conditions } = await service
      .from("pet_conditions")
      .select("pet_id, condition_name, severity, status")
      .in("pet_id", petIds);
    await pushLog("info", `Carregadas ${conditions?.length ?? 0} condições clínicas`);

    const { data: exams } = await service
      .from("pet_exams")
      .select("pet_id, exam_type, flags_abnormal")
      .in("pet_id", petIds);
    await pushLog("info", `Carregados ${exams?.length ?? 0} exames laboratoriais`);

    // compact aggregates to feed the LLM
    const byBreed: Record<string, number> = {};
    const ageBuckets: Record<string, number> = { "0-3": 0, "4-7": 0, "8+": 0 };
    pets?.forEach((p: any) => {
      byBreed[p.breed] = (byBreed[p.breed] ?? 0) + 1;
      const a = Number(p.age_years);
      if (a <= 3) ageBuckets["0-3"]++;
      else if (a <= 7) ageBuckets["4-7"]++;
      else ageBuckets["8+"]++;
    });
    const conditionFreq: Record<string, number> = {};
    conditions?.forEach((c: any) => {
      conditionFreq[c.condition_name] = (conditionFreq[c.condition_name] ?? 0) + 1;
    });
    const flagFreq: Record<string, number> = {};
    exams?.forEach((e: any) => {
      (e.flags_abnormal ?? []).forEach((f: string) => {
        flagFreq[f] = (flagFreq[f] ?? 0) + 1;
      });
    });

    const summary = {
      cohort: { name: cohort.name, kind: cohort.kind, n: pets?.length ?? 0, criteria: cohort.criteria },
      by_breed: byBreed,
      by_age: ageBuckets,
      condition_frequency: conditionFreq,
      abnormal_flag_frequency: flagFreq,
    };
    await pushLog(
      "info",
      `Agregados calculados: ${Object.keys(byBreed).length} raças, ${Object.keys(conditionFreq).length} condições distintas, ${Object.keys(flagFreq).length} flags laboratoriais`,
    );
    await pushLog("info", `Chamando LLM (${MODEL}) com ${JSON.stringify(summary).length} chars de contexto…`);

    const systemPrompt = await fetchSystemPrompt(PROMPT_KEY, SYSTEM_FALLBACK);
    const t0 = Date.now();
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Agregados do cohort:\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n\nProduza insights bilíngues acionáveis.` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "emit_cohort_insights" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      await pushLog("error", `AI gateway erro ${resp.status}: ${t.slice(0, 200)}`);
      await logPromptUsage({ prompt_key: PROMPT_KEY, function_name: "analyze-cohort-patterns", model: MODEL, latency_ms: Date.now() - t0, success: false, error: `gateway_${resp.status}` });
      throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 400)}`);
    }
    const data = await resp.json();
    await logPromptUsage({
      prompt_key: PROMPT_KEY,
      function_name: "analyze-cohort-patterns",
      model: MODEL,
      latency_ms: Date.now() - t0,
      tokens_in: data?.usage?.prompt_tokens ?? null,
      tokens_out: data?.usage?.completion_tokens ?? null,
      success: true,
    });
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const insights = parsed?.insights ?? [];
    await pushLog("info", `LLM retornou ${insights.length} insights estruturados`);

    if (!insights.length) {
      await pushLog("error", "Resposta vazia do LLM");
      return new Response(JSON.stringify({ error: "Empty LLM response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = insights.map((i: any) => ({
      cohort_id,
      kind: i.kind, stage: i.kind === "proposed_meta_study" ? "proposed_meta_study" : i.kind,
      title: i.title, title_en: i.title_en,
      summary: i.summary, summary_en: i.summary_en,
      evidence: i.evidence ?? {}, confidence: i.confidence ?? 0,
      signals: i.signals ?? [], source_model: MODEL,
      created_by: user.id,
    }));
    if (insight_id && existingInsight) {
      // Single-insight regeneration: pick best matching new insight (highest confidence)
      // and UPDATE the existing row with stronger quantitative evidence.
      const best = rows.reduce((a: any, b: any) => ((b.confidence ?? 0) > (a.confidence ?? 0) ? b : a), rows[0]);
      const { error: updErr } = await service.from("cohort_insights").update({
        title: best.title,
        title_en: best.title_en,
        summary: best.summary,
        summary_en: best.summary_en,
        evidence: best.evidence,
        confidence: best.confidence,
        signals: best.signals,
        source_model: MODEL,
      }).eq("id", insight_id);
      if (updErr) {
        await pushLog("error", `Falha ao atualizar insight: ${updErr.message}`);
        throw updErr;
      }
      await pushLog("info", `Insight ${insight_id} re-analisado com evidência quantitativa`);
      return new Response(JSON.stringify({ ok: true, regenerated: 1, model: MODEL }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await service.from("cohort_insights").insert(rows);
    if (insErr) {
      await pushLog("error", `Falha ao inserir insights: ${insErr.message}`);
      throw insErr;
    }
    await pushLog("info", `${rows.length} insights persistidos em cohort_insights`);
    await service
      .from("synthetic_cohorts")
      .update({
        last_analyzed_at: new Date().toISOString(),
        last_analysis_insights_count: rows.length,
        last_analysis_model: MODEL,
      })
      .eq("id", cohort_id);
    await pushLog("info", "Análise concluída ✓");

    return new Response(JSON.stringify({ ok: true, generated: rows.length, model: MODEL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});