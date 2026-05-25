// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";
const BATCH_SIZE = 25;

const SYSTEM_PROMPT = `Você é um gerador de dados clínicos sintéticos para cães, calibrado em medicina veterinária real.
Para cada pet, produza um perfil verossímil e internamente coerente: raça/idade/peso compatíveis,
condições alinhadas ao recorte solicitado, exames laboratoriais com valores plausíveis (e correlatos com as condições).
Variabilidade obrigatória: não repita o mesmo perfil. Distribua severidades. Use unidades vet padrão (mg/dL, U/L, %, etc).`;

function buildTool(batchSize: number) {
  return {
    type: "function",
    function: {
      name: "emit_synthetic_pets",
      description: "Retorna um lote de pets sintéticos coerentes com o recorte.",
      parameters: {
        type: "object",
        properties: {
          pets: {
            type: "array",
            minItems: batchSize,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                breed: { type: "string" },
                sex: { type: "string", enum: ["male", "female"] },
                age_years: { type: "number", minimum: 0.5, maximum: 18 },
                weight_kg: { type: "number", minimum: 1, maximum: 80 },
                neutered: { type: "boolean" },
                conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      condition_name: { type: "string" },
                      severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                      status: { type: "string", enum: ["active", "controlled", "resolved"] }
                    },
                    required: ["condition_name", "severity", "status"]
                  }
                },
                exams: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exam_type: { type: "string", description: "ex.: CBC, Bioquímico hepático, Bioquímico renal, Urinálise" },
                      results_json: {
                        type: "string",
                        description: "JSON string mapeando marcador -> { value, unit, ref_min, ref_max }. Ex.: '{\"ALT\":{\"value\":120,\"unit\":\"U/L\",\"ref_min\":10,\"ref_max\":100}}'"
                      },
                      flags_abnormal: { type: "array", items: { type: "string" } }
                    },
                    required: ["exam_type", "results_json"]
                  }
                }
              },
              required: ["name", "breed", "sex", "age_years", "weight_kg", "conditions", "exams"]
            }
          }
        },
        required: ["pets"]
      }
    }
  };
}

async function callLLM(criteria: any, batchSize: number, batchIndex: number) {
  const userPrompt = `Recorte do cohort:
\`\`\`json
${JSON.stringify(criteria, null, 2)}
\`\`\`

Gere EXATAMENTE ${batchSize} pets sintéticos (lote ${batchIndex + 1}). Varie raça dentro do recorte, idade dentro da faixa,
severidade das condições, e padrões laboratoriais. Para cada pet, inclua entre 2 e 4 exames pertinentes às condições
(ex.: ALT/AST elevados em hepatopatia, creatinina/ureia em DRC, glicemia em diabetes).`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [buildTool(batchSize)],
      tool_choice: { type: "function", function: { name: "emit_synthetic_pets" } },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 500)}`);
  }
  const data = await resp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const parsed = typeof args === "string" ? JSON.parse(args) : args;
  return parsed?.pets ?? [];
}

async function appendLog(service: any, cohortId: string, level: "info" | "warn" | "error", message: string, extra: any = {}) {
  const entry = { ts: new Date().toISOString(), level, message, ...extra };
  console.log(`[cohort ${cohortId}] ${level.toUpperCase()} ${message}`, extra);
  try {
    const { data: row } = await service
      .from("synthetic_cohorts")
      .select("progress_log")
      .eq("id", cohortId).single();
    const next = Array.isArray(row?.progress_log) ? [...row.progress_log, entry] : [entry];
    // keep last 80 entries to bound size
    const trimmed = next.slice(-80);
    await service.from("synthetic_cohorts").update({ progress_log: trimmed }).eq("id", cohortId);
  } catch (e) {
    console.error("appendLog failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
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
    // admin check
    const { data: adminFlag } = await userClient.rpc("is_admin");
    if (!adminFlag) {
      return new Response(JSON.stringify({ error: "Only admins can generate synthetic cohorts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, kind, rationale, criteria, target_n } = body ?? {};
    if (!name || !kind || !criteria) {
      return new Response(JSON.stringify({ error: "name, kind and criteria required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const targetN: number = Math.min(Math.max(Number(target_n) || 200, 10), 600);

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // create cohort row
    const { data: cohort, error: insertErr } = await service
      .from("synthetic_cohorts")
      .insert({
        name, kind, rationale: rationale ?? null, criteria,
        target_n: targetN, status: "generating", created_by: user.id,
      })
      .select("*").single();
    if (insertErr) throw insertErr;

    const cohortId = cohort.id;
    const batches = Math.ceil(targetN / BATCH_SIZE);
    let generated = 0;

    const runGeneration = async () => {
      try {
        for (let b = 0; b < batches; b++) {
          const remaining = targetN - generated;
          const size = Math.min(BATCH_SIZE, remaining);
          const pets = await callLLM({ ...criteria, kind, cohort_name: name }, size, b);
          if (!Array.isArray(pets) || pets.length === 0) continue;

          // Insert pet_profiles
          const profileRows = pets.map((p: any) => ({
            name: String(p.name).slice(0, 60),
            species: "canine",
            breed: String(p.breed).slice(0, 60),
            sex: p.sex === "female" ? "female" : "male",
            age_years: Number(p.age_years) || 5,
            weight_kg: Number(p.weight_kg) || 15,
            neutered: !!p.neutered,
            is_synthetic: true,
            is_demo: false,
            cohort_id: cohortId,
            created_by: user.id,
            notes: `Pet sintético · cohort "${name}" · gerado por IA`,
          }));
          const { data: createdPets, error: petsErr } = await service
            .from("pet_profiles").insert(profileRows).select("id");
          if (petsErr) { console.error("Pets insert error", petsErr); continue; }

          // Insert pet_conditions + pet_exams
          const condRows: any[] = [];
          const examRows: any[] = [];
          createdPets.forEach((row: any, idx: number) => {
            const src = pets[idx];
            (src.conditions ?? []).forEach((c: any) => {
              condRows.push({
                pet_id: row.id,
                condition_name: String(c.condition_name).slice(0, 120),
                severity: c.severity, status: c.status, origin: "synthetic",
                diagnosis_date: new Date().toISOString().slice(0, 10),
              });
            });
            (src.exams ?? []).forEach((e: any) => {
              examRows.push({
                pet_id: row.id,
                exam_type: String(e.exam_type).slice(0, 60),
                exam_date: new Date().toISOString().slice(0, 10),
                results: e.results ?? {},
                flags_abnormal: Array.isArray(e.flags_abnormal) ? e.flags_abnormal : [],
                extraction_status: "synthetic",
                approved: true,
              });
            });
          });
          if (condRows.length) await service.from("pet_conditions").insert(condRows);
          if (examRows.length) await service.from("pet_exams").insert(examRows);

          generated += createdPets.length;
          await service.from("synthetic_cohorts")
            .update({ generated_n: generated }).eq("id", cohortId);
        }
        await service.from("synthetic_cohorts")
          .update({ status: "ready", generated_n: generated }).eq("id", cohortId);
      } catch (e: any) {
        console.error("generation error", e);
        await service.from("synthetic_cohorts")
          .update({ status: "failed", generation_error: String(e?.message ?? e), generated_n: generated })
          .eq("id", cohortId);
      }
    };

    // Fire and forget so client can poll
    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(runGeneration());

    return new Response(JSON.stringify({
      ok: true, cohort_id: cohortId, target_n: targetN, batches, model: MODEL,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});