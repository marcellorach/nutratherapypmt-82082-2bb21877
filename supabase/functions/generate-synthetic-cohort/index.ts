// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-3.5-flash";
const BATCH_SIZE = 10;
const LLM_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;
const INTER_BATCH_DELAY_MS = 300;

const SYSTEM_PROMPT = `Você é um gerador de prontuários veterinários sintéticos para cães, calibrado em medicina real.
Cada pet deve ter um prontuário INTERNAMENTE COERENTE — como se fosse um caso real do "Gerar Pacientes de Exemplo":
- perfil (raça/idade/peso/sexo/castração) compatíveis com o recorte
- SEMPRE pelo menos 1 consulta (a mais recente é a atual) com chief_complaint, clinical_exam, assessment e plan em português
- condições, exames e medicações conforme o PERFIL atribuído a cada pet no prompt do usuário (alguns pets serão saudáveis em check-up, outros parciais, outros completos)
- 1 anamnese curta (clinical_note) e 1 notes_summary (1 linha)
- valores de exame plausíveis (mg/dL, U/L, %, ng/mL) e flags marcando o que está fora do range; correlacione achados às condições (ex.: ALT/AST em hepatopatia, creatinina/ureia em DRC, glicemia em diabetes)
Variabilidade obrigatória: NÃO repita perfis. Distribua severidades (mild/moderate/severe).
REGRA CRÍTICA: respeite EXATAMENTE o perfil (profile) atribuído a cada pet — não preencha condições/exames/medicações em pets cujo perfil pede para deixar vazio.`;

function buildTool(batchSize: number) {
  return {
    type: "function",
    function: {
      name: "emit_synthetic_pets",
      description: "Retorna um lote de prontuários sintéticos completos coerentes com o recorte do cohort.",
      parameters: {
        type: "object",
        properties: {
          pets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                breed: { type: "string" },
                sex: { type: "string", enum: ["male", "female"] },
                age_years: { type: "number", description: "Idade em anos, entre 0.5 e 18" },
                weight_kg: { type: "number", description: "Peso em kg, entre 1 e 80" },
                neutered: { type: "boolean" },
                notes_summary: { type: "string", description: "1 linha descrevendo o perfil clínico do paciente (ex.: 'Labrador sênior obeso com OA bilateral')." },
                conditions: {
                  type: "array",
                  minItems: 0,
                  maxItems: 4,
                  items: {
                    type: "object",
                    properties: {
                      condition_name: { type: "string" },
                      severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                      status: { type: "string", enum: ["active", "controlled", "resolved", "monitoring"] }
                    },
                    required: ["condition_name", "severity", "status"]
                  }
                },
                consultations: {
                  type: "array",
                  minItems: 1,
                  maxItems: 3,
                  description: "Histórico de consultas em ordem cronológica (mais antiga primeiro). A última é a consulta atual.",
                  items: {
                    type: "object",
                    properties: {
                      days_ago: { type: "integer", description: "Quantos dias atrás ocorreu a consulta (0 = hoje, 180 = 6 meses atrás)." },
                      chief_complaint: { type: "string", description: "Motivo da consulta (ex.: 'Rigidez matinal e dificuldade para subir escadas')." },
                      clinical_exam: { type: "string", description: "Achados do exame físico, ECC, mucosas, palpação." },
                      weight_kg_at_visit: { type: "number" },
                      body_condition_score: { type: "integer", description: "ECC 1–9" },
                      assessment: { type: "string", description: "Raciocínio clínico do veterinário em 1–2 frases, primeira pessoa." },
                      plan: { type: "string", description: "Conduta proposta (exames pedidos, medicação iniciada, retorno)." }
                    },
                    required: ["days_ago", "chief_complaint", "assessment", "plan"]
                  }
                },
                medications: {
                  type: "array",
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      medication_name: { type: "string" },
                      dosage: { type: "string", description: "ex.: '0.1mg/kg', '5mg'" },
                      frequency: { type: "string", description: "ex.: 'Once daily', 'BID', 'SID'" },
                      status: { type: "string", enum: ["active", "suspended", "completed"] }
                    },
                    required: ["medication_name"]
                  }
                },
                clinical_note: { type: "string", description: "Anamnese livre de 1–2 frases (contexto do tutor, hábitos, histórico relevante)." },
                exams: {
                  type: "array",
                  minItems: 0,
                  maxItems: 5,
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
              required: ["name", "breed", "sex", "age_years", "weight_kg", "conditions", "exams", "consultations"]
            }
          }
        },
        required: ["pets"]
      }
    }
  };
}

// Pré-sorteia o mix de "completude clínica" do lote para garantir variabilidade visível.
// Profiles:
//   "healthy"        → 0 cond, 0 exam, 0 med (apenas consulta de check-up)
//   "cond_only"      → 1-2 cond, 0 exam, 0 med
//   "cond_exam"      → 1-3 cond, 2-4 exam, 0 med
//   "full"           → 1-4 cond, 2-5 exam, 1-3 med
// Distribuição-alvo por 10 pets: 1 healthy · 2 cond_only · 2 cond_exam · 5 full
type Profile = "healthy" | "cond_only" | "cond_exam" | "full";
function sampleProfileMix(n: number): Profile[] {
  const baseRatios: Array<[Profile, number]> = [
    ["healthy", 0.10],
    ["cond_only", 0.20],
    ["cond_exam", 0.20],
    ["full", 0.50],
  ];
  const out: Profile[] = [];
  for (const [p, r] of baseRatios) {
    const count = Math.round(n * r);
    for (let i = 0; i < count; i++) out.push(p);
  }
  // ajuste para bater exatamente n
  while (out.length < n) out.push("full");
  while (out.length > n) out.pop();
  // Fisher-Yates shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function describeProfile(p: Profile): string {
  switch (p) {
    case "healthy":   return "SAUDÁVEL EM CHECK-UP: 0 condições, 0 exames, 0 medicações (apenas 1 consulta de rotina)";
    case "cond_only": return "DIAGNÓSTICO CLÍNICO SEM EXAMES: 1-2 condições, 0 exames, 0 medicações";
    case "cond_exam": return "INVESTIGAÇÃO ATIVA: 1-3 condições, 2-4 exames, 0 medicações (ainda sem tratamento)";
    case "full":      return "CASO COMPLETO: 1-4 condições, 2-5 exames, 1-3 medicações";
  }
}

async function callLLM(criteria: any, batchSize: number, batchIndex: number) {
  const mix = sampleProfileMix(batchSize);
  const slotList = mix
    .map((p, i) => `  Pet ${i + 1}: ${describeProfile(p)}`)
    .join("\n");

  const userPrompt = `Recorte do cohort:
\`\`\`json
${JSON.stringify(criteria, null, 2)}
\`\`\`

Gere EXATAMENTE ${batchSize} prontuários sintéticos COMPLETOS (lote ${batchIndex + 1}).

PERFIL CLÍNICO DE CADA PET (RESPEITE A ORDEM E O CONTEÚDO):
${slotList}

REGRAS GERAIS:
- TODO pet tem pelo menos 1 consulta (a última = atual, days_ago = 5..30; anteriores = 90..540 dias atrás).
- Se o perfil pede 0 condições/exames/medicações, retorne array VAZIO ([]) para esse campo. NÃO preencha.
- Pets "SAUDÁVEL EM CHECK-UP" têm consulta de rotina (chief_complaint tipo "Check-up anual", assessment "Animal hígido", plan "Manter rotina"). O notes_summary deve refletir isso ("Cão hígido em acompanhamento preventivo").
- Para perfis com condições: alinhe ao recorte clínico do cohort.
- Para perfis com exames: correlacione com as condições e marque flags do que está alterado.
- 1 anamnese curta (clinical_note) + 1 notes_summary (1 linha) sempre.

IMPORTANTE — diversidade demográfica obrigatória neste lote:
- Misture sexos de forma equilibrada (não enviese para um lado).
- Varie \`neutered\` de forma realista: cerca de 60–80% true e 20–40% false. NÃO retorne todos como true.
- Varie raças, idades e pesos dentro do recorte; evite repetir o mesmo perfil.

Exemplo de qualidade esperada (NÃO copie, apenas inspire-se):
\`\`\`
{ "name":"Rex", "breed":"Labrador Retriever", "sex":"male", "age_years":8, "weight_kg":32, "neutered":true,
  "notes_summary":"Labrador sênior obeso com OA bilateral em controle nutracêutico.",
  "conditions":[
    {"condition_name":"Osteoarthritis","severity":"moderate","status":"active"},
    {"condition_name":"Obesity","severity":"moderate","status":"controlled"}
  ],
  "consultations":[
    {"days_ago":365,"chief_complaint":"Ganho de peso progressivo","assessment":"Cão acima do peso, ECC 7/9. Janela boa pra agir antes de complicar.","plan":"Dieta de controle. Reavaliar em 90 dias.","weight_kg_at_visit":36,"body_condition_score":7,"clinical_exam":"Sobrepeso evidente. Sem queixa locomotora."},
    {"days_ago":21,"chief_complaint":"Reavaliação OA e peso","assessment":"OA mexendo bastante. Peso vem caindo bem.","plan":"Manter Meloxicam. Adicionar protocolo nutracêutico articular.","weight_kg_at_visit":32,"body_condition_score":6,"clinical_exam":"Locomoção melhor. Crepitação articular bilateral."}
  ],
  "medications":[{"medication_name":"Meloxicam","dosage":"0.1mg/kg","frequency":"Once daily","status":"active"}],
  "clinical_note":"Tutora relata melhora locomotora após dieta + Meloxicam. Cão mais ativo nos passeios.",
  "exams":[
    {"exam_type":"Body Condition Score","results_json":"{\"bcs\":{\"value\":6,\"unit\":\"/9\",\"ref_min\":4,\"ref_max\":5}}","flags_abnormal":["bcs"]},
    {"exam_type":"X-Ray (Hip)","results_json":"{\"grade\":{\"value\":3,\"unit\":\"FCI\",\"ref_min\":0,\"ref_max\":1},\"degeneration\":{\"value\":\"moderate\"}}","flags_abnormal":["grade"]}
  ]
}
\`\`\``;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), LLM_TIMEOUT_MS);
  try {
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
      signal: ac.signal,
    });

    if (!resp.ok) {
      const t = await resp.text();
      const err: any = new Error(`AI gateway ${resp.status}: ${t.slice(0, 500)}`);
      err.status = resp.status;
      throw err;
    }
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return parsed?.pets ?? [];
  } finally {
    clearTimeout(timer);
  }
}

async function callLLMWithRetry(service: any, cohortId: string, criteria: any, batchSize: number, batchIndex: number) {
  let lastErr: any = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await service.from("synthetic_cohorts")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("id", cohortId);
      return await callLLM(criteria, batchSize, batchIndex);
    } catch (e: any) {
      lastErr = e;
      const isAbort = e?.name === "AbortError";
      const isRetryable = isAbort || e?.status === 429 || (e?.status >= 500 && e?.status < 600);
      if (attempt < MAX_RETRIES && isRetryable) {
        const backoff = 1500 * Math.pow(2, attempt);
        await appendLog(service, cohortId, "warn",
          `Batch ${batchIndex + 1} tentativa ${attempt + 1} falhou (${isAbort ? "timeout" : `status ${e?.status ?? "?"}`}) · retry em ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
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

    // Mutex: só permite UM cohort em geração por usuário ao mesmo tempo.
    const { data: alreadyRunning } = await service
      .from("synthetic_cohorts")
      .select("id, name")
      .eq("created_by", user.id)
      .eq("status", "generating")
      .limit(1);
    if (alreadyRunning && alreadyRunning.length > 0) {
      return new Response(JSON.stringify({
        error: `Já existe um cohort em geração ("${alreadyRunning[0].name}"). Aguarde terminar ou finalize-o antes de iniciar outro.`,
        busy_cohort_id: alreadyRunning[0].id,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    await appendLog(service, cohortId, "info", `Cohort criado · alvo ${targetN} pets em ${batches} batches de ${BATCH_SIZE}`, { model: MODEL });

    const runGeneration = async () => {
      let fatal: any = null;
      let cancelled = false;
      try {
        for (let b = 0; b < batches; b++) {
          // Checa se o cohort foi finalizado/cancelado externamente (ex.: "Forçar finalização")
          const { data: cur } = await service.from("synthetic_cohorts")
            .select("status").eq("id", cohortId).single();
          if (cur && cur.status !== "generating") {
            cancelled = true;
            await appendLog(service, cohortId, "warn",
              `Geração interrompida externamente (status=${cur.status}) antes do batch ${b + 1} · abortando background`);
            break;
          }
          const remaining = targetN - generated;
          const size = Math.min(BATCH_SIZE, remaining);
          await appendLog(service, cohortId, "info", `Batch ${b + 1}/${batches} · solicitando ${size} pets ao modelo`);
          let pets: any[] = [];
          try {
            pets = await callLLMWithRetry(service, cohortId, { ...criteria, kind, cohort_name: name }, size, b);
          } catch (e: any) {
            await appendLog(service, cohortId, "error", `Batch ${b + 1} falhou no LLM após retries: ${String(e?.message ?? e).slice(0, 240)} · pulando`);
            continue;
          }
          if (!Array.isArray(pets) || pets.length === 0) {
            await appendLog(service, cohortId, "warn", `Batch ${b + 1} retornou vazio · pulando`);
            continue;
          }

          // Validation: discard pets without conditions or exams
          const validPets = pets.filter((p: any) =>
            Array.isArray(p?.conditions) && p.conditions.length > 0 &&
            Array.isArray(p?.exams) && p.exams.length > 0
          );
          const discarded = pets.length - validPets.length;
          if (discarded > 0) {
            await appendLog(service, cohortId, "warn", `Batch ${b + 1} · ${discarded} pets descartados (sem condições ou exames)`);
          }
          if (validPets.length === 0) continue;
          pets = validPets;

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
            notes: p.notes_summary
              ? `${String(p.notes_summary).slice(0, 240)} · cohort "${name}" · sintético`
              : `Pet sintético · cohort "${name}" · gerado por IA`,
          }));
          const { data: createdPets, error: petsErr } = await service
            .from("pet_profiles").insert(profileRows).select("id");
          if (petsErr) {
            await appendLog(service, cohortId, "error", `Falha ao inserir pets do batch ${b + 1}: ${petsErr.message}`);
            continue;
          }

          // Insert consultations first (we need the IDs to link condition/exam/medication to the latest visit)
          const todayMs = Date.now();
          const toDate = (daysAgo: number) =>
            new Date(todayMs - Math.max(0, Number(daysAgo) || 0) * 86_400_000).toISOString().slice(0, 10);

          // Build consultation rows and remember the index in `pets` they belong to
          const consultPlan: Array<{ petIdx: number; isLatest: boolean; row: any }> = [];
          createdPets.forEach((row: any, idx: number) => {
            const src = pets[idx];
            const cs = Array.isArray(src.consultations) && src.consultations.length
              ? [...src.consultations].sort((a: any, z: any) => (Number(z.days_ago) || 0) - (Number(a.days_ago) || 0))
              : [{ days_ago: 7, chief_complaint: "Consulta inicial sintética", assessment: "—", plan: "—" }];
            cs.forEach((c: any, cIdx: number) => {
              const isLatest = cIdx === cs.length - 1;
              consultPlan.push({
                petIdx: idx,
                isLatest,
                row: {
                  pet_id: row.id,
                  consultation_date: toDate(c.days_ago),
                  chief_complaint: c.chief_complaint ? String(c.chief_complaint).slice(0, 1000) : null,
                  clinical_exam: c.clinical_exam ? String(c.clinical_exam).slice(0, 2000) : null,
                  weight_kg_at_visit: c.weight_kg_at_visit != null ? Number(c.weight_kg_at_visit) : null,
                  body_condition_score: c.body_condition_score != null
                    ? Math.max(1, Math.min(9, Math.round(Number(c.body_condition_score))))
                    : null,
                  assessment: c.assessment ? String(c.assessment).slice(0, 2000) : null,
                  plan: c.plan ? String(c.plan).slice(0, 2000) : null,
                  is_latest: isLatest,
                  created_by: user.id,
                  tags: ["synthetic"],
                },
              });
            });
          });

          const { data: createdConsults, error: consultErr } = await service
            .from("pet_consultations").insert(consultPlan.map((c) => c.row)).select("id, pet_id, is_latest");
          if (consultErr) {
            await appendLog(service, cohortId, "warn", `Falha ao gravar consultas batch ${b + 1}: ${consultErr.message}`);
          }

          // Map pet_id -> latest consultation_id (fallback to any consultation for that pet)
          const latestByPet: Record<string, string> = {};
          (createdConsults ?? []).forEach((c: any) => {
            if (c.is_latest && !latestByPet[c.pet_id]) latestByPet[c.pet_id] = c.id;
          });
          (createdConsults ?? []).forEach((c: any) => {
            if (!latestByPet[c.pet_id]) latestByPet[c.pet_id] = c.id;
          });

          // Insert pet_conditions + pet_exams + pet_medications + pet_clinical_notes
          const condRows: any[] = [];
          const examRows: any[] = [];
          const medRows: any[] = [];
          const noteRows: any[] = [];
          createdPets.forEach((row: any, idx: number) => {
            const src = pets[idx];
            const consultId = latestByPet[row.id] ?? null;
            (src.conditions ?? []).forEach((c: any) => {
              const sevRaw = String(c.severity ?? "").toLowerCase();
              const severity = ["mild", "moderate", "severe"].includes(sevRaw) ? sevRaw : "moderate";
              const statRaw = String(c.status ?? "").toLowerCase();
              const status = ["active", "resolved", "monitoring"].includes(statRaw) ? statRaw : "active";
              condRows.push({
                pet_id: row.id,
                condition_name: String(c.condition_name).slice(0, 120),
                severity,
                status,
                origin: "synthetic",
                diagnosis_date: new Date().toISOString().slice(0, 10),
                consultation_id: consultId,
              });
            });
            (src.exams ?? []).forEach((e: any) => {
              let results: any = {};
              try {
                results = e.results_json ? JSON.parse(e.results_json) : (e.results ?? {});
              } catch {
                results = { _raw: String(e.results_json ?? "").slice(0, 500) };
              }
              examRows.push({
                pet_id: row.id,
                exam_type: String(e.exam_type).slice(0, 60),
                exam_date: new Date().toISOString().slice(0, 10),
                results,
                flags_abnormal: Array.isArray(e.flags_abnormal) ? e.flags_abnormal : [],
                extraction_status: "done",
                approved: true,
                consultation_id: consultId,
              });
            });
            (Array.isArray(src.medications) ? src.medications : []).forEach((m: any) => {
              if (!m?.medication_name) return;
              medRows.push({
                pet_id: row.id,
                medication_name: String(m.medication_name).slice(0, 120),
                dosage: m.dosage ? String(m.dosage).slice(0, 60) : null,
                frequency: m.frequency ? String(m.frequency).slice(0, 60) : null,
                status: ["active", "suspended", "completed"].includes(m.status) ? m.status : "active",
                consultation_id: consultId,
              });
            });
            if (src.clinical_note && String(src.clinical_note).trim()) {
              noteRows.push({
                pet_id: row.id,
                note_type: "observation",
                content: String(src.clinical_note).slice(0, 2000),
                consultation_id: consultId,
                created_by: user.id,
              });
            }
          });
          const insertWithLog = async (table: string, rows: any[]) => {
            if (!rows.length) return;
            const { error } = await service.from(table).insert(rows);
            if (error) {
              console.error(`[cohort ${cohortId}] insert ${table} failed:`, error.message);
              await appendLog(service, cohortId, "warn", `Falha ao inserir ${rows.length} ${table}: ${error.message}`);
            }
          };
          await insertWithLog("pet_conditions", condRows);
          await insertWithLog("pet_exams", examRows);
          await insertWithLog("pet_medications", medRows);
          await insertWithLog("pet_clinical_notes", noteRows);

          generated += createdPets.length;
          await service.from("synthetic_cohorts")
            .update({ generated_n: generated, last_heartbeat_at: new Date().toISOString() })
            .eq("id", cohortId);
          await appendLog(service, cohortId, "info", `Batch ${b + 1} ok · +${createdPets.length} pets (total ${generated}/${targetN})`);
          if (b < batches - 1) await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
        }
      } catch (e: any) {
        console.error("generation error", e);
        fatal = e;
      } finally {
        if (cancelled) {
          // Respeita o status definido pela finalização manual — só atualiza o generated_n
          await service.from("synthetic_cohorts")
            .update({ generated_n: generated, last_heartbeat_at: new Date().toISOString() })
            .eq("id", cohortId);
          await appendLog(service, cohortId, "warn",
            `Background encerrado após cancelamento manual · ${generated} pets gerados`);
        } else {
          // Sempre finaliza o status — evita ficar pendurado em "generating".
          const ratio = generated / Math.max(1, targetN);
          const finalStatus = fatal ? "failed" : (ratio >= 0.8 ? "ready" : (generated > 0 ? "ready" : "failed"));
          const errMsg = fatal
            ? String(fatal?.message ?? fatal).slice(0, 500)
            : (generated < targetN ? `Apenas ${generated}/${targetN} pets gerados (alguns batches falharam)` : null);
          await service.from("synthetic_cohorts")
            .update({
              status: finalStatus,
              generated_n: generated,
              generation_error: errMsg,
              last_heartbeat_at: new Date().toISOString(),
            })
            .eq("id", cohortId);
          await appendLog(
            service, cohortId,
            finalStatus === "ready" ? "info" : "error",
            finalStatus === "ready"
              ? `Geração concluída · ${generated} pets sintéticos prontos`
              : `Geração interrompida: ${errMsg ?? "erro desconhecido"}`,
          );
        }
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