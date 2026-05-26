// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";

const SYSTEM_PROMPT = `Você é um pesquisador sênior em medicina veterinária focado em longevidade canina,
atuando como ponte entre a Senex AI e a PetLove (maior rede vet do Brasil, com centenas de milhares
de prontuários ativos E falecidos).

OBJETIVO: propor 6 cohorts que a PetLove poderia compartilhar do seu histórico para gerar
VALOR OPERACIONAL DIRETO para ela mesma — NÃO para preencher lacunas do Knowledge Graph
(isso resolvemos com mais estudos). Cada cohort deve revelar um padrão que a PetLove ainda
não enxerga e que destrava uma decisão de negócio/clínica concreta (mudar protocolo, sinalizar
vet outlier, reduzir custo evitável, identificar churn precoce, prever óbito evitável, etc.).

REGRA OBRIGATÓRIA: devolva EXATAMENTE 6 cohorts, 1 ancorado em cada um dos modelos preditivos
da plataforma. Os 6 modelos (use o id literal em \`target_model_id\`):
1. \`efficacy-prediction\` — Eficácia real de nutracêuticos (responders × não-responders).
2. \`disease-progression\` — Velocidade de progressão de doenças degenerativas/metabólicas.
3. \`cost-benefit-analysis\` — Custo vet evitado por protocolo nutracêutico.
4. \`patient-segmentation\` — Cães tratáveis × não-tratáveis (polifarmácia, comorbidades).
5. \`mortality-risk-window\` — Risco de óbito em 6/12/24m E janela de intervenção (gold label = falecidos).
6. \`treatment-adherence\` — Quem abandona o plano em 3/6/9m (puro operacional PetLove).

DUAS POPULAÇÕES POSSÍVEIS:
- \`living\`: cães vivos com acompanhamento longitudinal (responde "o que está acontecendo agora?").
- \`deceased\`: cães JÁ FALECIDOS com prontuário completo pré-óbito (responde "qual a trajetória
  real até a morte?" — gold label insubstituível). Pelo menos 2 dos 6 cohorts devem ser \`deceased\`
  ou \`mixed\` — especialmente para os modelos 2 e 5.
- \`mixed\`: vivos + falecidos no mesmo recorte (ex.: curva de sobrevida).

DUAS LARGURAS (\`breadth\`):
- \`broad\`: recorte amplo, N=1000–2500, viabilidade alta, padrão diluído mas estatisticamente robusto.
- \`stratified\`: recorte específico (raça×idade×condição×medicação), N=150–400, padrão nítido,
  impacto alto.
Distribua livremente entre os 6 cohorts (mistura broad/stratified à sua escolha).

CRITÉRIOS POR COHORT:
- Foco em doenças metabólicas/degenerativas caninas (escopo da plataforma).
- \`value_to_partner\`: 1–2 frases descrevendo o ganho operacional concreto para PetLove
  (ex.: "identificar 25% de não-responders ANTES de prescrever, economizando ~R$X/ano").
- \`discoverable\` (pattern): O padrão concreto que emerge dos dados.
- \`record_requirements\`: critérios não-negociáveis nos prontuários (ex.: "≥18m pré-óbito",
  "causa de óbito registrada", "≥3 hemogramas seriados", "BCS documentado").
- \`target_model_expected_gain\`: frase curta tipo "+N pets · esperado +X% accuracy".

Impacto (0–100) = quanto a descoberta destrava decisão operacional/clínica PetLove.
Viabilidade (0–100) = quão provável que o dado JÁ existe estruturado no histórico PetLove.`;

const TOOL = {
  type: "function",
  function: {
    name: "propose_cohorts",
    description: "Propõe 6 cohorts (1 por modelo preditivo) que a PetLove poderia compartilhar.",
    parameters: {
      type: "object",
      properties: {
        cohorts: {
          type: "array",
          minItems: 6,
          maxItems: 6,
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
              discoverable: { type: "string", description: "O padrão concreto que emerge dos dados (1–2 frases acionáveis)" },
              kind: { type: "string", enum: ["prevention", "treatment_validation", "exploratory"] },
              cohort_population: { type: "string", enum: ["living", "deceased", "mixed"], description: "Cães vivos, falecidos (gold label) ou misto." },
              breadth: { type: "string", enum: ["broad", "stratified"], description: "Recorte amplo (N alto, padrão diluído) ou estratificado (N menor, padrão nítido)." },
              pattern_family: { type: "string", description: "Família do padrão (ex.: 'treatment_inefficacy', 'mortality_trajectory', 'churn_signature', 'polypharmacy_risk')." },
              value_to_partner: { type: "string", description: "Ganho operacional concreto para PetLove em 1–2 frases." },
              record_requirements: {
                type: "array",
                items: { type: "string" },
                description: "Critérios não-negociáveis nos prontuários (ex.: '≥18m pré-óbito', 'causa de óbito registrada')."
              },
              target_model_id: {
                type: "string",
                enum: ["efficacy-prediction","disease-progression","cost-benefit-analysis","patient-segmentation","mortality-risk-window","treatment-adherence"],
                description: "ID do modelo preditivo que este cohort treina."
              },
              target_model_expected_gain: { type: "string", description: "Ex.: '+850 pets · esperado +6% accuracy'." },
              impact_score: { type: "number", minimum: 0, maximum: 100 },
              viability_score: { type: "number", minimum: 0, maximum: 100 }
            },
            required: ["title", "rationale", "suggested_criteria", "discoverable", "kind", "cohort_population", "breadth", "pattern_family", "value_to_partner", "record_requirements", "target_model_id", "target_model_expected_gain", "impact_score", "viability_score"],
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

Proponha 6 cohorts (exatamente 1 por modelo preditivo, na ordem dos ids:
efficacy-prediction, disease-progression, cost-benefit-analysis, patient-segmentation,
mortality-risk-window, treatment-adherence). Pelo menos 2 devem ser de cães FALECIDOS
(\`deceased\` ou \`mixed\`) — especialmente os ancorados em disease-progression e
mortality-risk-window. Misture broad e stratified livremente. Sempre preencha
\`value_to_partner\` com ganho operacional concreto para a PetLove (não para o KG).`;

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
          cohort_population: c.cohort_population ?? null,
          breadth: c.breadth ?? null,
          pattern_family: c.pattern_family ?? null,
          value_to_partner: c.value_to_partner ?? null,
          record_requirements: c.record_requirements ?? null,
          target_model_id: c.target_model_id ?? null,
          target_model_expected_gain: c.target_model_expected_gain ?? null,
          impact_score: c.impact_score ?? null,
          viability_score: c.viability_score ?? null,
          source_model: MODEL,
          signals,
          created_by: userId,
        }));
        const { error: insErr } = await service.from("cohort_suggestions").insert(rows);
        if (insErr) console.error("Persist suggestions failed", insErr);
        else persisted = rows.length;

        // Dispara check de originalidade em background (não bloqueia a resposta).
        if (persisted > 0) {
          try {
            const { data: justInserted } = await service
              .from("cohort_suggestions")
              .select("id, title, rationale, suggested_criteria")
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(persisted);
            const usePerplexity = body?.use_perplexity === true;
            for (const row of justInserted ?? []) {
              const url = `${SUPABASE_URL}/functions/v1/check-cohort-originality`;
              const p = fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  suggestion_id: row.id,
                  title: row.title,
                  rationale: row.rationale,
                  suggested_criteria: row.suggested_criteria,
                  use_perplexity: usePerplexity,
                }),
              }).catch((e) => console.error("originality dispatch failed", row.id, e));
              // @ts-ignore EdgeRuntime is available in Supabase Edge runtime
              if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(p);
            }
          } catch (e) {
            console.error("originality dispatch outer exception", e);
          }
        }
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