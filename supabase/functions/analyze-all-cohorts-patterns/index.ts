// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";
const PROMPT_KEY = "analyze_all_cohorts_patterns";

const SYSTEM_FALLBACK = `Você é um epidemiologista veterinário consolidando MÚLTIPLOS cohorts caninos
sintéticos em uma análise pan-populacional. Procure padrões que SÓ aparecem quando os cohorts são
vistos juntos: comorbidades trans-raça, gradientes de prevalência por idade que cruzam tipos de
cohort (prevenção vs validação vs exploratório), assinaturas laboratoriais comuns, e oportunidades
de meta-estudo cruzado. Evite repetir descobertas já triviais de cohorts isolados.

Gere 6 a 10 insights pan-populacionais com título PT/EN, resumo PT/EN (até 280 chars),
evidência quantitativa cruzando cohorts, confiança 0–1 e sinais.`;

const TOOL = {
  type: "function",
  function: {
    name: "emit_cohort_insights",
    description: "Retorna insights pan-populacionais entre cohorts caninos.",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array", minItems: 6, maxItems: 10,
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["discovery", "hypothesis", "proposed_meta_study"] },
              title: { type: "string" }, title_en: { type: "string" },
              summary: { type: "string" }, summary_en: { type: "string" },
              evidence: { type: "object", additionalProperties: true },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              signals: { type: "array", items: { type: "string" } }
            },
            required: ["kind","title","title_en","summary","summary_en","evidence","confidence","signals"],
            additionalProperties: false
          }
        }
      },
      required: ["insights"], additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: adminFlag } = await userClient.rpc("is_admin");
    if (!adminFlag) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cohorts } = await service.from("synthetic_cohorts").select("id, name, kind, criteria").eq("status","ready");
    if (!cohorts?.length) {
      return new Response(JSON.stringify({ error: "no_ready_cohorts" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const cohortIds = cohorts.map((c:any)=>c.id);
    const { data: pets } = await service.from("pet_profiles").select("id, cohort_id, breed, sex, age_years, weight_kg").in("cohort_id", cohortIds);
    const petIds = (pets ?? []).map((p:any)=>p.id);
    const { data: conditions } = await service.from("pet_conditions").select("pet_id, condition_name, severity").in("pet_id", petIds);
    const { data: exams } = await service.from("pet_exams").select("pet_id, exam_type, flags_abnormal").in("pet_id", petIds);

    // per-cohort + cross aggregates
    const petToCohort: Record<string,string> = {};
    pets?.forEach((p:any)=>{ petToCohort[p.id] = p.cohort_id; });
    const perCohort: Record<string, any> = {};
    cohorts.forEach((c:any)=>{ perCohort[c.id] = { name: c.name, kind: c.kind, n: 0, breeds: {}, conditions: {}, flags: {} }; });
    pets?.forEach((p:any)=>{ const a = perCohort[p.cohort_id]; if (!a) return; a.n++; a.breeds[p.breed] = (a.breeds[p.breed]??0)+1; });
    conditions?.forEach((c:any)=>{ const a = perCohort[petToCohort[c.pet_id]]; if (!a) return; a.conditions[c.condition_name] = (a.conditions[c.condition_name]??0)+1; });
    exams?.forEach((e:any)=>{ const a = perCohort[petToCohort[e.pet_id]]; if (!a) return; (e.flags_abnormal??[]).forEach((f:string)=>{ a.flags[f] = (a.flags[f]??0)+1; }); });

    const summary = {
      total_cohorts: cohorts.length,
      total_pets: pets?.length ?? 0,
      per_cohort: perCohort,
    };

    const systemPrompt = await fetchSystemPrompt(PROMPT_KEY, SYSTEM_FALLBACK);
    const t0 = Date.now();
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Agregados pan-populacionais:\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n\nProduza insights cruzando cohorts.` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "emit_cohort_insights" } },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      await logPromptUsage({ prompt_key: PROMPT_KEY, function_name: "analyze-all-cohorts-patterns", model: MODEL, latency_ms: Date.now() - t0, success: false, error: `gateway_${resp.status}` });
      throw new Error(`AI gateway ${resp.status}: ${t.slice(0,400)}`);
    }
    const data = await resp.json();
    await logPromptUsage({
      prompt_key: PROMPT_KEY,
      function_name: "analyze-all-cohorts-patterns",
      model: MODEL,
      latency_ms: Date.now() - t0,
      tokens_in: data?.usage?.prompt_tokens ?? null,
      tokens_out: data?.usage?.completion_tokens ?? null,
      success: true,
    });
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const insights = parsed?.insights ?? [];
    if (!insights.length) return new Response(JSON.stringify({ error: "Empty LLM response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const rows = insights.map((i:any)=>({
      cohort_id: null,
      kind: i.kind, stage: i.kind === "proposed_meta_study" ? "proposed_meta_study" : i.kind,
      title: `[Pan-cohort] ${i.title}`, title_en: `[Pan-cohort] ${i.title_en}`,
      summary: i.summary, summary_en: i.summary_en,
      evidence: { ...(i.evidence ?? {}), cross_cohort: true, cohort_count: cohorts.length },
      confidence: i.confidence ?? 0, signals: i.signals ?? [],
      source_model: MODEL, created_by: user.id,
    }));
    const { error: insErr } = await service.from("cohort_insights").insert(rows);
    if (insErr) throw insErr;
    return new Response(JSON.stringify({ ok: true, generated: rows.length, cohorts: cohorts.length, model: MODEL }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e:any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});