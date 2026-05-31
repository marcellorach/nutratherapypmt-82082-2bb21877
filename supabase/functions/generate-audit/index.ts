// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Best available reasoning model on the gateway that still responds in <60s
const PRIMARY_MODEL = "google/gemini-3.1-pro-preview";
const FALLBACK_MODEL = "openai/gpt-5-mini";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { version, scope, system_version, system_changelog_date } = body as {
      version: string; scope: string; system_version?: string; system_changelog_date?: string;
    };
    if (!version || !scope) {
      return new Response(JSON.stringify({ error: "version and scope required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Gather DB snapshot (best-effort; ignore failures)
    const snapshot: Record<string, any> = {};
    try {
      const [{ count: tripletCount }, { count: edgeCount }, { count: nodeCount }, { count: studyCount }, { count: petCount }] = await Promise.all([
        service.from("medical_knowledge_graph").select("*", { count: "exact", head: true }),
        service.from("medical_knowledge_graph_edges").select("*", { count: "exact", head: true }),
        service.from("knowledge_graph_nodes").select("*", { count: "exact", head: true }).then((r: any) => r).catch(() => ({ count: null })),
        service.from("studies").select("*", { count: "exact", head: true }),
        service.from("pets").select("*", { count: "exact", head: true }),
      ]);
      snapshot.triplets = tripletCount;
      snapshot.edges = edgeCount;
      snapshot.nodes = nodeCount;
      snapshot.studies = studyCount;
      snapshot.pets = petCount;
    } catch (e) {
      console.warn("snapshot collection failed", e);
    }

    // Fetch last 50 changelog entries from prior audits / changelog table if available
    let changelogContext = "";
    try {
      const { data: prevAudits } = await service
        .from("technical_audits")
        .select("version, audit_date, system_version, summary, scope")
        .order("audit_date", { ascending: false })
        .limit(3);
      changelogContext = JSON.stringify(prevAudits ?? []);
    } catch (_) { /* noop */ }

    const systemPrompt = `Você é o auditor técnico interno da plataforma Senex AI (PetMoreTime). Gere uma auditoria técnica COMPLETA, em português, sobre a versão informada. NÃO mencione "Lovable", "Lovable AI" ou qualquer ferramenta de desenvolvimento. Use o nome "Senex AI" e o motor "PetMoreTime". A saída deve ser HTML semântico, autocontido (com <style> embutido elegante e minimalista), pronto para iframe.

Inclua: capa, sumário executivo, escopo, snapshot de métricas, conformidade regulatória (FDA, EMA, AVMA, GMLP) com matriz (covered/partial/missing), forças, lacunas (gaps), riscos, recomendações priorizadas, conclusão. Use seções h2/h3, tabelas, listas. Sem emojis em excesso. Tipografia: serif para títulos (ex: Georgia), sans para corpo. Cores sóbrias.`;

    const userPrompt = `Versão da auditoria: ${version}
Sistema (i18n): ${system_version ?? "n/a"}
Última entrada do changelog: ${system_changelog_date ?? "n/a"}

ESCOPO SOLICITADO:
${scope}

SNAPSHOT DO BANCO:
${JSON.stringify(snapshot, null, 2)}

AUDITORIAS ANTERIORES (contexto):
${changelogContext.slice(0, 6000)}

Gere o relatório HTML completo agora.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "emit_audit",
          description: "Emite a auditoria completa: HTML do relatório + resumo estruturado.",
          parameters: {
            type: "object",
            properties: {
              html: { type: "string", description: "HTML completo, autocontido, com <style> embutido." },
              summary: {
                type: "object",
                properties: {
                  strengths: { type: "number" },
                  gaps: { type: "number" },
                  risks: { type: "number" },
                  pages: { type: "number" },
                  generator: { type: "string" },
                  parity: { type: "string" },
                  highlights: { type: "array", items: { type: "string" } },
                  compliance: {
                    type: "object",
                    properties: {
                      fda: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false },
                      ema: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false },
                      avma: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, points: { type: "number" } }, required: ["covered","partial","missing","points"], additionalProperties: false },
                      gmlp: { type: "object", properties: { covered: { type: "number" }, partial: { type: "number" }, missing: { type: "number" }, principles: { type: "number" } }, required: ["covered","partial","missing","principles"], additionalProperties: false },
                    },
                    required: ["fda","ema","avma","gmlp"],
                    additionalProperties: false,
                  },
                },
                required: ["strengths","gaps","risks","pages","generator","parity","highlights","compliance"],
                additionalProperties: false,
              },
            },
            required: ["html", "summary"],
            additionalProperties: false,
          },
        },
      },
    ];

    async function callModel(model: string) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "emit_audit" } },
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`${model} → ${r.status}: ${t.slice(0, 300)}`);
      }
      const d = await r.json();
      const args = d?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error(`${model} returned no tool_call`);
      return JSON.parse(args);
    }

    let parsed: any;
    try {
      parsed = await callModel(PRIMARY_MODEL);
    } catch (e) {
      console.warn("Primary model failed, falling back:", e);
      parsed = await callModel(FALLBACK_MODEL);
    }

    const html: string = parsed.html;
    const summary: any = { ...(parsed.summary ?? {}), generator: "senex-ai", model: PRIMARY_MODEL };

    // Upload HTML to storage
    const path = `${version}/auditoria.html`;
    const { error: upErr } = await service.storage
      .from("audit-reports")
      .upload(path, new TextEncoder().encode(html), {
        upsert: true,
        contentType: "text/html; charset=utf-8",
      });
    if (upErr) throw upErr;
    const { data: pub } = service.storage.from("audit-reports").getPublicUrl(path);
    const htmlUrl = pub.publicUrl;

    // Insert audit row
    const auditId = version.toLowerCase().startsWith("v") ? version.toLowerCase() : `v${version.toLowerCase()}`;
    const numericVersion = auditId.replace(/^v/, "");

    const { data: inserted, error: insErr } = await service
      .from("technical_audits")
      .upsert({
        id: auditId,
        version: numericVersion,
        audit_date: new Date().toISOString().slice(0, 10),
        system_version: system_version ?? "",
        system_changelog_date: system_changelog_date ?? null,
        scope,
        scope_history: [],
        html_path: htmlUrl,
        pdf_path: null,
        docx_path: null,
        summary,
        superseded_by: null,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, audit: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-audit error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});