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

const REFERENCE_SECTION_HINTS = [
  "sumário executivo",
  "glossário",
  "metodologia",
  "visão arquitetural",
  "pipeline de digestão",
  "vetorização e embeddings",
  "banco relacional e rls",
  "uso de llm por edge function",
  "knowledge graph",
  "análise do paciente",
  "recomendação híbrida",
  "digital twin",
  "conformidade fda",
  "conformidade ema",
  "conformidade avma",
  "gmlp",
  "forças",
  "gaps e riscos",
  "roadmap",
  "apêndice a",
  "apêndice b",
  "apêndice c",
  "apêndice d",
  "bibliografia",
];

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assessAuditHtml(html: string) {
  const normalized = html.toLowerCase();
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  const h2 = (html.match(/<h2\b/gi) ?? []).length;
  const tables = (html.match(/<table\b/gi) ?? []).length;
  const missingSections = REFERENCE_SECTION_HINTS.filter((section) => !normalized.includes(section));
  const issues: string[] = [];

  if (words < 2400) issues.push(`texto curto demais (${words} palavras; mínimo 2400)`);
  if (h2 < 24) issues.push(`estrutura curta demais (${h2} seções h2; mínimo 24)`);
  if (tables < 6) issues.push(`poucas tabelas (${tables}; mínimo 6)`);
  if (missingSections.length > 5) issues.push(`faltam seções-chave: ${missingSections.slice(0, 8).join(", ")}`);
  if (/teste rápido|smoke|paridade parcial|auditoria curta|delta-only/i.test(html)) {
    issues.push("o HTML descreve a auditoria como teste rápido/parcial/delta-only");
  }

  return { ok: issues.length === 0, words, h2, tables, missingSections, issues };
}

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
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Maintenance action: re-upload existing HTMLs with proper text/html content-type.
    if ((body as any)?.action === "fix_mime") {
      const { data: rows } = await service
        .from("technical_audits")
        .select("id, html_path")
        .not("html_path", "is", null);
      const results: any[] = [];
      for (const r of (rows ?? []) as Array<{ id: string; html_path: string }>) {
        const m = r.html_path.match(/audit-reports\/(.+)$/);
        if (!m) { results.push({ id: r.id, skipped: true }); continue; }
        const objectPath = m[1];
        const dl = await fetch(r.html_path);
        if (!dl.ok) { results.push({ id: r.id, error: `download ${dl.status}` }); continue; }
        const html = await dl.text();
        const { error: upErr } = await service.storage
          .from("audit-reports")
          .upload(objectPath, new TextEncoder().encode(html), {
            upsert: true,
            contentType: "text/html; charset=utf-8",
          });
        results.push({ id: r.id, ok: !upErr, error: upErr?.message });
      }
      return new Response(JSON.stringify({ fixed: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { version, scope, system_version, system_changelog_date } = body as {
      version: string; scope: string; system_version?: string; system_changelog_date?: string;
    };
    if (!version || !scope) {
      return new Response(JSON.stringify({ error: "version and scope required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

POLÍTICA OBRIGATÓRIA A PARTIR DA V5.2.0:
- Toda auditoria é standalone e cumulativa.
- Nunca gere versão "teste rápido", "smoke", "resumo curto", "paridade parcial" ou somente delta.
- Mesmo se o escopo vier curto ou experimental, expanda para um relatório completo no padrão da v5.2.0 e trate o escopo recebido apenas como ênfase adicional.
- O documento precisa parecer adequado para revisão externa/regulatória.

ESTRUTURA MÍNIMA ESPERADA:
1. Sumário executivo
2. Mudanças desde a versão anterior
3. Glossário
4. Metodologia
5. Visão arquitetural
6. Pipeline de digestão
7. Vetorização e embeddings
8. Banco relacional e RLS
9. Uso de LLM por Edge Function
10. Knowledge Graph
11. Análise do paciente
12. Recomendação híbrida
13. Digital Twin
14. Jornadas/fluxos reais e roadmap
15. Comparação histórica
16. FDA
17. EMA
18. AVMA
19. GMLP
20. Forças
21. Gaps e riscos
22. Roadmap priorizado
23. Apêndices A-D
24. Bibliografia

REQUISITOS DE QUALIDADE:
- pelo menos 24 seções h2
- pelo menos 6 tabelas
- texto denso, analítico e auto-suficiente
- snapshot real do banco citado quando disponível
- resumo estruturado coerente com o HTML final`;

    const userPrompt = `Versão da auditoria: ${version}
Sistema (i18n): ${system_version ?? "n/a"}
Última entrada do changelog: ${system_changelog_date ?? "n/a"}

ESCOPO SOLICITADO:
${scope}

SNAPSHOT DO BANCO:
${JSON.stringify(snapshot, null, 2)}

AUDITORIAS ANTERIORES (contexto):
${changelogContext.slice(0, 6000)}

Gere o relatório HTML completo agora. Lembre: o padrão de referência é a auditoria standalone cumulativa v5.2.0, nunca um relatório simplificado.`;

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

    async function callModel(model: string, repairInstruction?: string) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            ...(repairInstruction ? [{ role: "user", content: `REFAÇA COMPLETAMENTE a auditoria corrigindo estes problemas obrigatórios: ${repairInstruction}` }] : []),
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

    // Geração é assíncrona — passa de 150s de timeout do edge runtime.
    // Inserimos um placeholder e disparamos a geração via EdgeRuntime.waitUntil.
    const auditId = version.toLowerCase().startsWith("v") ? version.toLowerCase() : `v${version.toLowerCase()}`;
    const numericVersion = auditId.replace(/^v/, "");
    const pendingHtml = `<!doctype html><meta charset="utf-8"><title>Gerando ${auditId}…</title><style>body{font-family:system-ui;padding:48px;color:#444;text-align:center}</style><h1>Auditoria ${auditId} em geração…</h1><p>Este relatório está sendo produzido em segundo plano. Atualize a lista em alguns minutos.</p>`;
    const placeholderPath = `${version}/pending.html`;
    await service.storage.from("audit-reports").upload(placeholderPath, new TextEncoder().encode(pendingHtml), { upsert: true, contentType: "text/html; charset=utf-8" });
    const { data: pendPub } = service.storage.from("audit-reports").getPublicUrl(placeholderPath);

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
        html_path: pendPub.publicUrl,
        pdf_path: null,
        docx_path: null,
        summary: { status: "processing", generator: "senex-ai", model: PRIMARY_MODEL },
        superseded_by: null,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    const backgroundJob = (async () => {
      try {
        let parsed: any;
        try {
          parsed = await callModel(PRIMARY_MODEL);
        } catch (e) {
          console.warn("Primary model failed, falling back:", e);
          parsed = await callModel(FALLBACK_MODEL);
        }
        let html: string = parsed.html;
        let validation = assessAuditHtml(html);
        if (!validation.ok) {
          console.warn("Audit HTML below baseline, retrying with repair instructions", validation);
          try {
            parsed = await callModel(PRIMARY_MODEL, `Mantenha o padrão standalone cumulativo da v5.2.0. Problemas detectados: ${validation.issues.join("; ")}. Inclua as seções ausentes e reescreva tudo em formato completo.`);
          } catch (_e) {
            parsed = await callModel(FALLBACK_MODEL, `Mantenha o padrão standalone cumulativo da v5.2.0. Problemas detectados: ${validation.issues.join("; ")}. Inclua as seções ausentes e reescreva tudo em formato completo.`);
          }
          html = parsed.html;
          validation = assessAuditHtml(html);
          if (!validation.ok) {
            throw new Error(`Auditoria recusada por regressão de formato: ${validation.issues.join(" | ")}`);
          }
        }
        const summary: any = { ...(parsed.summary ?? {}), generator: "senex-ai", model: PRIMARY_MODEL, status: "ready" };
        const path = `${version}/auditoria.html`;
        const { error: upErr } = await service.storage.from("audit-reports").upload(path, new TextEncoder().encode(html), { upsert: true, contentType: "text/html; charset=utf-8" });
        if (upErr) throw upErr;
        const { data: pub } = service.storage.from("audit-reports").getPublicUrl(path);
        await service.from("technical_audits").update({ html_path: pub.publicUrl, summary }).eq("id", auditId);
      } catch (err: any) {
        console.error("background audit generation failed:", err);
        await service.from("technical_audits").update({
          summary: { status: "failed", error: err?.message ?? String(err), generator: "senex-ai" },
        }).eq("id", auditId);
      }
    })();

    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundJob);
    }

    return new Response(JSON.stringify({ ok: true, audit: inserted, status: "processing" }), {
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