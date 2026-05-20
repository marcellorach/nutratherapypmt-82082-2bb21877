// extract-meta-study: extrai metadados arquiteturais de um texto/PDF e
// sugere vínculos com Regras-Core existentes. NÃO grava nada — retorna
// rascunho para revisão humana na FundamentosTab > Ingestão.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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

  try {
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    let { text, pdf_storage_path, source_url } = body as {
      text?: string;
      pdf_storage_path?: string;
      source_url?: string;
    };

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch existing Core Rules to give the model the catalog to map onto.
    const { data: rules, error: rErr } = await supabase
      .from("core_rules")
      .select("rule_id, title, category, justification")
      .order("rule_id");
    if (rErr) throw rErr;

    // If a PDF path was given, download and (best-effort) decode as text.
    if (!text && pdf_storage_path) {
      const { data: file, error: dErr } = await supabase.storage
        .from("meta_studies_pdfs")
        .download(pdf_storage_path);
      if (dErr) throw dErr;
      // We send raw bytes as a marker; for true PDF parsing we rely on the
      // user to paste extracted text. Keep this fallback short and explicit.
      const buf = new Uint8Array(await file.arrayBuffer());
      text = `[PDF binary received: ${buf.byteLength} bytes at ${pdf_storage_path}. ` +
        `If extraction quality is poor, paste the abstract/intro/conclusion as text.]`;
    }

    if (!text || text.length < 50) {
      return new Response(
        JSON.stringify({ error: "Provide 'text' (>=50 chars) or a valid 'pdf_storage_path'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const truncated = text.slice(0, 60_000);
    const rulesCatalog = (rules || [])
      .map((r: any) => `- ${r.rule_id} [${r.category}] ${r.title} — ${r.justification?.slice(0, 180) || ""}`)
      .join("\n");

    const systemPrompt =
      "You curate architectural/methodological references for a veterinary geroprotector platform's Meta-KG. " +
      "These are NOT clinical studies — they justify how the pipeline reasons (translational weighting, exclusion vs contraindication, fallback policies, etc.). " +
      "Extract a faithful draft and propose links to EXISTING Core Rules only (use their rule_id verbatim). " +
      "Use 'supports' when the study justifies the rule; 'contradicts' when it challenges it; 'modulates_weight' when it informs a numeric weight (e.g. canine→human translatability); 'inspires' when it motivated the rule conceptually. " +
      "Quotes must be literal substrings of the source text (<=300 chars). If unsure, omit the link.";

    const userPrompt =
      `EXISTING CORE RULES (link only to these rule_ids):\n${rulesCatalog || "(none)"}\n\n` +
      `SOURCE${source_url ? ` (${source_url})` : ""}:\n${truncated}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: TOOL.function.name } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Lovable AI error", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `AI gateway failed: ${aiRes.status}`, detail: errText }),
        { status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiRes.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "AI returned no structured draft" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draft = JSON.parse(call.function.arguments);

    // Filter suggested links to rules that actually exist (defense in depth).
    const validRuleIds = new Set((rules || []).map((r: any) => r.rule_id));
    draft.suggested_links = (draft.suggested_links || []).filter((l: any) =>
      validRuleIds.has(l.rule_id)
    );

    return new Response(
      JSON.stringify({ draft, source_url, pdf_storage_path }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("extract-meta-study error", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});