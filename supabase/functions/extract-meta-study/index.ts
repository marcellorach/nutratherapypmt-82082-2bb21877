// extract-meta-study: extrai metadados arquiteturais de um texto/PDF e
// sugere vínculos com Regras-Core existentes. NÃO grava nada — retorna
// rascunho para revisão humana na FundamentosTab > Ingestão.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
const googleAiApiKey = Deno.env.get("GOOGLE_AI_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const MODEL = "google/gemini-3-pro-preview";

// Model name mapping. The Lovable AI Gateway expects the `google/` prefix;
// the direct Google AI API (generativelanguage.googleapis.com) rejects it
// with 404 NOT_FOUND. Use these helpers everywhere instead of hand-stripping.
function toGatewayModel(model: string): string {
  return model.startsWith("google/") || model.includes("/") ? model : `google/${model}`;
}
function toDirectModel(model: string): string {
  return model.replace(/^google\//, "");
}
const GATEWAY_MODEL = toGatewayModel(MODEL);
const DIRECT_MODEL = toDirectModel(MODEL);

// Conservative inline-PDF cap for the Lovable AI Gateway. The gateway has
// historically rejected/dropped silently around ~8–10MB of inline file data,
// so we fail FAST and LOUD above this threshold instead of silently truncating.
const GATEWAY_PDF_LIMIT_BYTES = 7 * 1024 * 1024;
const LLM_TIMEOUT_MS = 110_000;

type GeminiUploadedFile = {
  name: string;
  uri: string;
  mimeType: string;
  state?: string;
};

type TraceEntry = {
  stage: string;
  status: "success" | "error" | "skipped";
  duration_ms?: number;
  detail?: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked base64 encode to avoid call-stack issues on large PDFs
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function uploadPdfToGoogleAi(pdfBytes: Uint8Array, fileName: string, mimeType: string) {
  if (!googleAiApiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  const initResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleAiApiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(pdfBytes.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: fileName } }),
  });

  if (!initResponse.ok) {
    throw new Error(`Falha ao iniciar upload do PDF grande: ${initResponse.status} - ${await initResponse.text()}`);
  }

  const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("Google AI não retornou upload URL para o PDF grande.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(pdfBytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: pdfBytes,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Falha ao enviar PDF grande: ${uploadResponse.status} - ${await uploadResponse.text()}`);
  }

  const uploaded = (await uploadResponse.json()).file as GeminiUploadedFile | undefined;
  if (!uploaded?.name || !uploaded?.uri) {
    throw new Error("Google AI não retornou metadados válidos do arquivo enviado.");
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const infoResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploaded.name}?key=${googleAiApiKey}`);
    if (!infoResponse.ok) {
      throw new Error(`Falha ao consultar status do PDF grande: ${infoResponse.status} - ${await infoResponse.text()}`);
    }
    const fileInfo = await infoResponse.json() as GeminiUploadedFile;
    if (fileInfo.state === "ACTIVE") {
      return fileInfo;
    }
    if (fileInfo.state === "FAILED") {
      throw new Error("Google AI marcou o arquivo como FAILED durante o processamento.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error("Google AI demorou demais para ativar o PDF grande.");
}

async function deleteGoogleAiFile(fileName: string) {
  if (!googleAiApiKey || !fileName) return;
  try {
    await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${googleAiApiKey}`, {
      method: "DELETE",
    });
  } catch (_err) {
    // best effort cleanup
  }
}

const TOOL = {
  type: "function",
  function: {
    name: "emit_meta_study_draft",
    description:
      "Emit a structured draft of an architectural/methodological meta-study and proposed links to existing Core Rules.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        authors: { type: "string" },
        year: { type: "integer" },
        journal: { type: "string" },
        doi: { type: "string" },
        kind: {
          type: "string",
          enum: ["architectural", "translational", "methodological", "inspiration"],
        },
        summary: { type: "string", description: "2-4 sentence executive summary." },
        key_claims: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim: { type: "string" },
              quote: { type: "string", description: "Literal quote (<=300 chars)." },
              weight: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["claim"],
          },
        },
        suggested_links: {
          type: "array",
          description: "Proposed evidence links to existing Core Rules by rule_id (e.g. RC-001).",
          items: {
            type: "object",
            properties: {
              rule_id: { type: "string" },
              relation: {
                type: "string",
                enum: ["supports", "contradicts", "modulates_weight", "inspires"],
              },
              weight: { type: "number", minimum: 0, maximum: 1 },
              quote: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["rule_id", "relation"],
          },
        },
      },
      required: ["title", "kind", "summary", "key_claims", "suggested_links"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const trace: TraceEntry[] = [];
  const pushTrace = (e: TraceEntry) => {
    trace.push(e);
    console.log(`[trace] ${e.stage} · ${e.status}${e.duration_ms ? ` · ${e.duration_ms}ms` : ""}${e.detail ? ` · ${e.detail}` : ""}`);
  };
  const fail = (status: number, stage: string, message: string, extra?: Record<string, unknown>) => {
    pushTrace({ stage, status: "error", detail: message });
    return new Response(
      JSON.stringify({ error: message, stage, trace, ...extra }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  };

  try {
    if (!lovableApiKey) {
      return fail(500, "config", "LOVABLE_API_KEY not configured");
    }

    const body = await req.json();
    const { text: rawText, pdf_storage_path, source_url, curator_notes, pdf_mime } = body as {
      text?: string;
      pdf_storage_path?: string;
      source_url?: string;
      curator_notes?: string;
      pdf_mime?: string;
    };
    let text = rawText;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch existing Core Rules to give the model the catalog to map onto.
    const tRules = performance.now();
    const { data: rules, error: rErr } = await supabase
      .from("core_rules")
      .select("rule_id, title, category, justification")
      .order("rule_id");
    if (rErr) return fail(500, "rules_catalog", rErr.message);
    pushTrace({
      stage: "rules_catalog",
      status: "success",
      duration_ms: Math.round(performance.now() - tRules),
      detail: `${rules?.length ?? 0} regras disponíveis para vínculo`,
    });

    // Download the source document (PDF or text-like). For PDFs we attach as
    // multimodal input to Gemini; for text-like we read as UTF-8.
    let pdfBase64: string | null = null;
    let googleAiFile: GeminiUploadedFile | null = null;
    let pdfMime: string = pdf_mime || "application/pdf";
    if (pdf_storage_path) {
      const tDl = performance.now();
      const { data: file, error: dErr } = await supabase.storage
        .from("meta_studies_pdfs")
        .download(pdf_storage_path);
      if (dErr) return fail(500, "extraction", `Falha ao baixar PDF do storage: ${dErr.message}`);
      const buf = new Uint8Array(await file.arrayBuffer());
      if (buf.byteLength === 0) return fail(422, "extraction", "PDF vazio.");
      if (buf.byteLength > 20 * 1024 * 1024) {
        return fail(413, "extraction", "Arquivo excede 20MB. Reduza o PDF ou cole abstract + conclusão como texto.");
      }
      // Treat .txt/.md as plain text
      if (pdfMime.startsWith("text/") || /\.(md|txt)$/i.test(pdf_storage_path)) {
        text = new TextDecoder().decode(buf);
        pushTrace({
          stage: "extraction",
          status: "success",
          duration_ms: Math.round(performance.now() - tDl),
          detail: `Texto lido (${text.length} chars)`,
        });
      } else {
        if (buf.byteLength > GATEWAY_PDF_LIMIT_BYTES) {
          const sizeMb = (buf.byteLength / 1024 / 1024).toFixed(1);
          try {
            googleAiFile = await uploadPdfToGoogleAi(
              buf,
              pdf_storage_path?.split("/").pop() || "document.pdf",
              pdfMime,
            );
            pushTrace({
              stage: "extraction",
              status: "success",
              duration_ms: Math.round(performance.now() - tDl),
              detail: `PDF grande enviado via Google AI File API (${sizeMb} MB · ${pdfMime})`,
            });
          } catch (fileApiErr: any) {
            const capMb = (GATEWAY_PDF_LIMIT_BYTES / 1024 / 1024).toFixed(0);
            return fail(
              413,
              "extraction",
              `PDF tem ${sizeMb} MB — acima do limite seguro de ${capMb} MB para envio inline ao gateway, e o fallback automático de arquivo grande falhou: ${fileApiErr?.message || fileApiErr}`,
              {
                options: [
                  "Tentar novamente: o fallback automático para PDF grande usa upload dedicado e pode falhar por rate limit/transiente do provedor.",
                  "Dividir o PDF em partes (ex: capítulos, ou abstract+métodos+discussão) e ingerir cada parte como um meta-estudo separado.",
                  "Extrair o texto fora da plataforma (qualquer leitor de PDF → exportar como .txt ou .md) e reenviar como arquivo de texto, preservando o estudo completo.",
                  "Se o PDF for scan, rodar OCR antes (ex: ocrmypdf) para melhorar leitura e reduzir peso efetivo.",
                ],
              },
            );
          }
        } else {
          pdfBase64 = bytesToBase64(buf);
          pushTrace({
            stage: "extraction",
            status: "success",
            duration_ms: Math.round(performance.now() - tDl),
            detail: `PDF anexado ao Gemini (${(buf.byteLength / 1024).toFixed(0)} KB · ${pdfMime})`,
          });
        }
      }
    } else if (text) {
      pushTrace({
        stage: "extraction",
        status: "success",
        detail: `Texto colado (${text.length} chars)`,
      });
    } else {
      return fail(400, "extraction", "Anexe um documento (PDF/.md/.txt/.docx) ou cole o texto.");
    }

    if (!pdfBase64 && !googleAiFile && (!text || text.length < 50)) {
      return fail(422, "extraction", "Texto extraído é muito curto (<50 chars). Pode ser PDF escaneado sem OCR.");
    }

    const truncated = (text || "").slice(0, 60_000);
    const rulesCatalog = (rules || [])
      .map((r: any) => `- ${r.rule_id} [${r.category}] ${r.title} — ${r.justification?.slice(0, 180) || ""}`)
      .join("\n");

    const systemPrompt =
      "You curate architectural/methodological references for a veterinary geroprotector platform's Meta-KG. " +
      "These are NOT clinical studies — they justify how the pipeline reasons (translational weighting, exclusion vs contraindication, fallback policies, etc.). " +
      "Extract a faithful draft and propose links to EXISTING Core Rules only (use their rule_id verbatim). " +
      "Use 'supports' when the study justifies the rule; 'contradicts' when it challenges it; 'modulates_weight' when it informs a numeric weight (e.g. canine→human translatability); 'inspires' when it motivated the rule conceptually. " +
      "Quotes must be literal substrings of the source text (<=300 chars). If unsure, omit the link.";

    const curatorBlock = curator_notes && curator_notes.trim()
      ? `\n\nCURATOR NOTES (treat as binding guidance — respect them):\n${curator_notes.trim().slice(0, 4000)}\n`
      : "";

    const textPrompt =
      `EXISTING CORE RULES (link only to these rule_ids):\n${rulesCatalog || "(none)"}\n${curatorBlock}\n` +
      (pdfBase64 || googleAiFile
        ? `SOURCE${source_url ? ` (${source_url})` : ""}: see attached PDF.`
        : `SOURCE${source_url ? ` (${source_url})` : ""}:\n${truncated}`);

    const userContent: any[] = [{ type: "text", text: textPrompt }];
    if (pdfBase64) {
      userContent.push({
        type: "file",
        file: {
          filename: (pdf_storage_path?.split("/").pop() || "document.pdf"),
          file_data: `data:${pdfMime};base64,${pdfBase64}`,
        },
      });
    } else if (googleAiFile) {
      userContent.push({
        type: "file",
        file: {
          file_id: googleAiFile.name,
        },
      });
    }

    const tLlm = performance.now();
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
    let call: any = null;
    let usage: any = {};
    try {
      if (googleAiFile) {
        // Google AI direct API expects the model name without the `google/` gateway prefix
        const directModel = MODEL.replace(/^google\//, "");
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${directModel}:generateContent?key=${googleAiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [
                  {
                    fileData: {
                      mimeType: googleAiFile.mimeType || pdfMime,
                      fileUri: googleAiFile.uri,
                    },
                  },
                  { text: `${systemPrompt}\n\n${textPrompt}` },
                ],
              }],
              tools: [{
                functionDeclarations: [{
                  name: TOOL.function.name,
                  description: TOOL.function.description,
                  parameters: TOOL.function.parameters,
                }],
              }],
              toolConfig: {
                functionCallingConfig: {
                  mode: "ANY",
                  allowedFunctionNames: [TOOL.function.name],
                },
              },
            }),
            signal: ctrl.signal,
          },
        );

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error("Google AI direct error", aiRes.status, errText);
          const httpCode = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502;
          const friendly = aiRes.status === 429
            ? "Limite de requisições do Gemini excedido. Aguarde 1 min e tente novamente."
            : aiRes.status === 402
            ? "Créditos do provedor de IA esgotados."
            : `Falha no processamento de PDF grande via Google AI (HTTP ${aiRes.status}).`;
          await deleteGoogleAiFile(googleAiFile.name);
          return fail(httpCode, "llm_analysis", friendly, { detail: errText });
        }

        const json = await aiRes.json();
        await deleteGoogleAiFile(googleAiFile.name);
        call = json.candidates?.[0]?.content?.parts?.find((part: any) => part.functionCall?.name === TOOL.function.name)?.functionCall;
        usage = json.usageMetadata || {};
      } else {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            tools: [TOOL],
            tool_choice: { type: "function", function: { name: TOOL.function.name } },
          }),
          signal: ctrl.signal,
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error("Lovable AI error", aiRes.status, errText);
          const httpCode = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502;
          const friendly = aiRes.status === 429
            ? "Limite de requisições do Gemini excedido. Aguarde 1 min e tente novamente."
            : aiRes.status === 402
            ? "Créditos do Lovable AI esgotados. Adicione créditos em Settings > Workspace > Usage."
            : aiRes.status === 413 || /payload|too large|size/i.test(errText)
            ? `Gateway rejeitou o PDF por tamanho (HTTP ${aiRes.status}). Reenvie em partes menores ou como texto.`
            : `Falha no gateway de IA (HTTP ${aiRes.status}).`;
          return fail(httpCode, "llm_analysis", friendly, { detail: errText });
        }

        const json = await aiRes.json();
        call = json.choices?.[0]?.message?.tool_calls?.[0];
        usage = json.usage || {};
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (googleAiFile?.name) {
        await deleteGoogleAiFile(googleAiFile.name);
      }
      const aborted = e?.name === "AbortError";
      return fail(
        aborted ? 504 : 502,
        "llm_analysis",
        aborted
          ? `Gemini não respondeu em ${Math.round(LLM_TIMEOUT_MS / 1000)}s — provavelmente o PDF está grande/complexo demais para uma única chamada.`
          : `Falha de rede ao chamar a IA: ${e?.message || e}`,
        {
          options: aborted ? [
            "Dividir o PDF em partes menores e ingerir cada uma separadamente.",
            "Reenviar apenas abstract + conclusão como .md (muito mais rápido para o modelo digerir).",
            "Tentar novamente em alguns minutos — o provedor pode estar sob carga.",
          ] : undefined,
        },
      );
    }
    clearTimeout(timeoutId);

    if (!call) {
      return fail(502, "llm_analysis", "Gemini não retornou rascunho estruturado (tool_call ausente). Tente novamente ou cole abstract+conclusão como texto.");
    }
    pushTrace({
      stage: "llm_analysis",
      status: "success",
      duration_ms: Math.round(performance.now() - tLlm),
      detail: `${MODEL} · ${usage.total_tokens ?? usage.totalTokenCount ?? "?"} tokens`,
    });

    let draft: any;
    try {
      const rawArgs = call.function?.arguments ?? call.args;
      draft = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    } catch (e: any) {
      return fail(502, "structuring", `Falha ao parsear JSON do Gemini: ${e?.message || e}`);
    }

    // Filter suggested links to rules that actually exist (defense in depth).
    const validRuleIds = new Set((rules || []).map((r: any) => r.rule_id));
    draft.suggested_links = (draft.suggested_links || []).filter((l: any) =>
      validRuleIds.has(l.rule_id)
    );

    pushTrace({
      stage: "structuring",
      status: "success",
      detail: `${draft.key_claims?.length ?? 0} claims · ${draft.suggested_links?.length ?? 0} vínculos válidos`,
    });

    return new Response(
      JSON.stringify({ draft, source_url, pdf_storage_path, trace }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("extract-meta-study error", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error", trace }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});