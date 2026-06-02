// Parse a veterinary exam PDF using Lovable AI Gateway (Gemini multimodal).
// Input: { exam_id: string, file_url: string }
// Updates pet_exams row with structured JSON results.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Fallback verbatim — usado apenas se o registro de prompts (DB + manifesto) estiver inacessível.
const SYSTEM_FALLBACK = `Você extrai dados de PDFs de exames veterinários (cães).
Retorne SOMENTE JSON válido seguindo este schema:
{
  "exam_type": string,             // ex.: "Hemograma", "Bioquímico", "Urinálise"
  "exam_date": string|null,        // ISO YYYY-MM-DD
  "lab_name": string|null,
  "results": { [analyte: string]: { value: number|string, unit: string|null, ref_min: number|null, ref_max: number|null, flag: "normal"|"high"|"low"|"unreadable"|null } },
  "clinical_comments": string|null,
  "flags_abnormal": string[]       // nomes dos analitos fora da faixa
}

REGRA CRÍTICA DE SEGURANÇA DE LAB (anti-alucinação):
- Se um valor estiver ILEGÍVEL, BORRADO, PARCIALMENTE VISÍVEL ou AMBÍGUO, NÃO ADIVINHE.
- Nesse caso: ou OMITA o item completamente, ou inclua o item com flag="unreadable" e value=null.
- Viés de completude (preencher para parecer útil) em valor de lab causa interpretação clínica errada (ex.: creatinina alucinada → falsa lesão renal).`;

// Canonical unit aliases — normalize common variations to a single form.
const UNIT_ALIASES: Record<string, string> = {
  "mg/dl": "mg/dL", "mg / dl": "mg/dL", "mgdl": "mg/dL",
  "g/dl": "g/dL", "g / dl": "g/dL",
  "u/l": "U/L", "iu/l": "U/L", "ui/l": "U/L",
  "mmol/l": "mmol/L", "mEq/l": "mEq/L", "meq/l": "mEq/L",
  "%": "%", "porcento": "%",
  "10^3/ul": "10^3/µL", "10e3/ul": "10^3/µL", "10*3/ul": "10^3/µL", "k/ul": "10^3/µL",
  "10^6/ul": "10^6/µL", "10e6/ul": "10^6/µL", "m/ul": "10^6/µL",
  "fl": "fL", "pg": "pg",
  "ng/ml": "ng/mL", "ng/dl": "ng/dL", "ug/dl": "µg/dL", "mcg/dl": "µg/dL",
};

function normalizeUnit(u: unknown): string | null {
  if (u == null) return null;
  const raw = String(u).trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/\s+/g, "");
  return UNIT_ALIASES[key] ?? raw;
}

function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d.,\-+eE]/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function deriveFlag(value: number | null, ref_min: number | null, ref_max: number | null, given: unknown): "normal" | "high" | "low" | null {
  const g = typeof given === "string" ? given.toLowerCase() : null;
  if (g === "unreadable") return "unreadable" as any;
  if (g === "high" || g === "low" || g === "normal") return g;
  if (value == null) return null;
  if (ref_max != null && value > ref_max) return "high";
  if (ref_min != null && value < ref_min) return "low";
  if (ref_min != null || ref_max != null) return "normal";
  return null;
}

function normalizeResults(raw: unknown): { results: Record<string, any>; flags: string[] } {
  const out: Record<string, any> = {};
  const flags: string[] = [];
  if (!raw) return { results: out, flags };
  // Aceita dois formatos:
  //   (a) dict { analyte: { value, unit, ... } }  — legado / fallback
  //   (b) array [ { analyte, value, unit, ... } ] — tool_choice (Card #5)
  const entries: Array<[string, any]> = Array.isArray(raw)
    ? (raw as any[]).map((it) => [String(it?.analyte ?? "").trim(), it])
    : typeof raw === "object"
      ? Object.entries(raw as Record<string, any>)
      : [];
  for (const [k, vRaw] of entries) {
    if (!k) continue;
    const v = vRaw && typeof vRaw === "object" ? vRaw : { value: vRaw };
    const numericValue = toNumber(v.value);
    const ref_min = toNumber(v.ref_min);
    const ref_max = toNumber(v.ref_max);
    const unit = normalizeUnit(v.unit);
    // sanity: swap min/max if inverted
    const [rmin, rmax] = ref_min != null && ref_max != null && ref_min > ref_max ? [ref_max, ref_min] : [ref_min, ref_max];
    const flag = deriveFlag(numericValue, rmin, rmax, v.flag);
    out[k.trim()] = {
      value: numericValue ?? (v.value ?? null),
      unit,
      ref_min: rmin,
      ref_max: rmax,
      flag,
    };
    if (flag === "high" || flag === "low") flags.push(k.trim());
    // 'unreadable' NÃO entra em flags_abnormal — desconhecido ≠ anormal.
  }
  return { results: out, flags };
}

function normalizeDate(s: unknown): string | null {
  if (!s) return null;
  const str = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { exam_id, file_url } = await req.json();
    if (!exam_id || !file_url) {
      return new Response(JSON.stringify({ error: "exam_id and file_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    await sb.from("pet_exams").update({ extraction_status: "processing", extraction_error: null }).eq("id", exam_id);

    // Resolve signed URL if path is in private bucket
    let pdfUrl = file_url;
    if (!/^https?:\/\//i.test(file_url)) {
      const { data, error } = await sb.storage.from("pet_exams_pdfs").createSignedUrl(file_url, 600);
      if (error || !data) throw new Error(`signed url: ${error?.message}`);
      pdfUrl = data.signedUrl;
    }

    // Download PDF and base64-encode
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) throw new Error(`fetch pdf failed: ${pdfRes.status}`);
    const buf = new Uint8Array(await pdfRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);

    const SYSTEM = await fetchSystemPrompt('parse_pet_exam_pdf', SYSTEM_FALLBACK);
    const t0 = Date.now();
    const model = "google/gemini-2.5-flash";
    // Card #5 (migração #3 — parse-pet-exam-pdf): tool_choice fecha o schema.
    // Substitui `response_format: json_object` (que só garantia "é JSON", não
    // "tem os campos certos") por tool-calling forçado. Valores de lab são
    // alto risco — unidade/valor no campo errado = interpretação errada.
    const EXTRACT_EXAM_TOOL = {
      type: "function" as const,
      function: {
        name: "extract_exam_data",
        description: "Extrai dados estruturados de um PDF de exame veterinário canino.",
        parameters: {
          type: "object",
          properties: {
            exam_type: { type: "string", description: "Ex.: Hemograma, Bioquímico, Urinálise." },
            exam_date: { type: ["string", "null"], description: "ISO YYYY-MM-DD se presente." },
            lab_name: { type: ["string", "null"] },
            results: {
              type: "array",
              description: "Lista de analitos. Use ARRAY (não objeto) — um item por analito.",
              items: {
                type: "object",
                properties: {
                  analyte: { type: "string", description: "Nome do analito (ex.: ALT, Creatinina)." },
                  value: { type: ["number", "string", "null"] },
                  unit: { type: ["string", "null"] },
                  ref_min: { type: ["number", "null"] },
                  ref_max: { type: ["number", "null"] },
                  flag: { type: ["string", "null"], enum: ["normal", "high", "low", null] },
                },
                required: ["analyte", "value"],
                additionalProperties: false,
              },
            },
            clinical_comments: { type: ["string", "null"] },
            flags_abnormal: {
              type: "array",
              items: { type: "string" },
              description: "Nomes dos analitos fora da faixa.",
            },
          },
          required: ["exam_type", "results", "flags_abnormal"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Extraia o JSON estruturado deste exame." },
            { type: "file", file: { filename: "exam.pdf", file_data: `data:application/pdf;base64,${b64}` } },
          ] },
        ],
        tools: [EXTRACT_EXAM_TOOL],
        tool_choice: { type: "function", function: { name: "extract_exam_data" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      logPromptUsage({
        prompt_key: 'parse_pet_exam_pdf',
        function_name: 'parse-pet-exam-pdf',
        model,
        latency_ms: Date.now() - t0,
        success: false,
        error: `${aiRes.status}: ${txt.slice(0, 200)}`,
      });
      throw new Error(`AI ${aiRes.status}: ${txt.slice(0, 300)}`);
    }
    const aiJson = await aiRes.json();
    logPromptUsage({
      prompt_key: 'parse_pet_exam_pdf',
      function_name: 'parse-pet-exam-pdf',
      model,
      latency_ms: Date.now() - t0,
      tokens_in: aiJson?.usage?.prompt_tokens ?? null,
      tokens_out: aiJson?.usage?.completion_tokens ?? null,
      success: true,
    });
    // Card #5: extrair de tool_calls (forçado por tool_choice). Fallback para
    // message.content só por defesa — não deveria acontecer com tool_choice.
    const msg = aiJson.choices?.[0]?.message ?? {};
    const toolCall = Array.isArray(msg.tool_calls) ? msg.tool_calls[0] : null;
    const rawArgs = toolCall?.function?.arguments ?? msg.content ?? "{}";
    let parsed: any;
    try {
      parsed = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    } catch {
      parsed = { raw: rawArgs };
    }

    // Normalize before persisting.
    const { results: normResults, flags: derivedFlags } = normalizeResults(parsed.results);
    const normExamDate = normalizeDate(parsed.exam_date);
    const llmFlags: string[] = Array.isArray(parsed.flags_abnormal) ? parsed.flags_abnormal.map(String) : [];
    const flagsAbnormal = Array.from(new Set([...llmFlags, ...derivedFlags]));

    // Auto-link to a consultation when the parsed exam date matches one (within ±3 days).
    let consultationId: string | null = null;
    if (normExamDate) {
      const { data: petRow } = await sb.from("pet_exams").select("pet_id").eq("id", exam_id).single();
      if (petRow?.pet_id) {
        const { data: cands } = await sb
          .from("pet_consultations")
          .select("id, consultation_date")
          .eq("pet_id", petRow.pet_id);
        if (cands?.length) {
          const target = new Date(normExamDate).getTime();
          let best: { id: string; diff: number } | null = null;
          for (const c of cands) {
            const diff = Math.abs(new Date(c.consultation_date).getTime() - target);
            if (!best || diff < best.diff) best = { id: c.id, diff };
          }
          if (best && best.diff <= 3 * 86400000) consultationId = best.id;
        }
      }
    }

    await sb.from("pet_exams").update({
      exam_type: parsed.exam_type || "Exame",
      exam_date: normExamDate,
      lab_name: parsed.lab_name || null,
      results: normResults,
      clinical_comments: parsed.clinical_comments || null,
      flags_abnormal: flagsAbnormal,
      raw_extracted: parsed,
      ...(consultationId ? { consultation_id: consultationId } : {}),
      extraction_status: "done",
    }).eq("id", exam_id);

    return new Response(JSON.stringify({ ok: true, parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    try {
      const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
      const body = await req.clone().json().catch(() => ({}));
      if (body?.exam_id) {
        await sb.from("pet_exams").update({ extraction_status: "failed", extraction_error: msg }).eq("id", body.exam_id);
      }
    } catch {}
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});