// Parse a veterinary exam PDF using Lovable AI Gateway (Gemini multimodal).
// Input: { exam_id: string, file_url: string }
// Updates pet_exams row with structured JSON results.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM = `Você extrai dados de PDFs de exames veterinários (cães).
Retorne SOMENTE JSON válido seguindo este schema:
{
  "exam_type": string,             // ex.: "Hemograma", "Bioquímico", "Urinálise"
  "exam_date": string|null,        // ISO YYYY-MM-DD
  "lab_name": string|null,
  "results": { [analyte: string]: { value: number|string, unit: string|null, ref_min: number|null, ref_max: number|null, flag: "normal"|"high"|"low"|null } },
  "clinical_comments": string|null,
  "flags_abnormal": string[]       // nomes dos analitos fora da faixa
}`;

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Extraia o JSON estruturado deste exame." },
            { type: "file", file: { filename: "exam.pdf", file_data: `data:application/pdf;base64,${b64}` } },
          ] },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI ${aiRes.status}: ${txt.slice(0, 300)}`);
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; }
    catch { parsed = { raw: content }; }

    await sb.from("pet_exams").update({
      exam_type: parsed.exam_type || "Exame",
      exam_date: parsed.exam_date || null,
      lab_name: parsed.lab_name || null,
      results: parsed.results || {},
      clinical_comments: parsed.clinical_comments || null,
      flags_abnormal: parsed.flags_abnormal || [],
      raw_extracted: parsed,
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