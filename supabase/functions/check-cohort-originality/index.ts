// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

const QUERY_MODEL = "google/gemini-2.5-flash";
const EMBED_MODEL = "google/gemini-embedding-001";

interface Body {
  suggestion_id?: string;
  title: string;
  rationale?: string;
  suggested_criteria?: Record<string, any>;
  use_perplexity?: boolean;
}

async function buildQueries(s: Body): Promise<{
  pubmed_query: string;
  google_scholar_query: string;
  keywords: string[];
  semantic_query: string;
}> {
  const prompt = `Veterinary cohort: "${s.title}"
Rationale: ${s.rationale ?? "-"}
Criteria: ${JSON.stringify(s.suggested_criteria ?? {})}

Build search queries to check if there is existing scientific literature on this exact cohort question (canine focus).
Return a JSON object with: pubmed_query (PubMed boolean syntax with [tiab] tags), google_scholar_query (plain keyword string), keywords (4-6 short terms), semantic_query (one short English sentence summarizing the research question for embedding search).`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: QUERY_MODEL,
      messages: [
        { role: "system", content: "You are a veterinary literature search expert. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`Query builder failed ${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return {
    pubmed_query: String(parsed.pubmed_query ?? `${s.title} canine dog`),
    google_scholar_query: String(parsed.google_scholar_query ?? s.title),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
    semantic_query: String(parsed.semantic_query ?? s.title),
  };
}

async function searchInternal(semanticQuery: string, service: any): Promise<{
  hits: number;
  max_similarity: number;
  top: { study_id: string; title: string | null; similarity: number }[];
  status: "ok" | "error";
  error?: string;
}> {
  try {
    const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: semanticQuery }),
    });
    if (!embedRes.ok) throw new Error(`embed ${embedRes.status}`);
    const embJson = await embedRes.json();
    const embedding: number[] = embJson?.data?.[0]?.embedding ?? [];
    if (!embedding.length) throw new Error("no embedding");

    const { data, error } = await service.rpc("search_study_chunks", {
      query_embedding: embedding as any,
      match_study_id: null,
      match_threshold: 0.6,
      match_count: 5,
    });
    if (error) throw error;
    const rows: any[] = data ?? [];
    // group unique studies, keep max similarity
    const byStudy = new Map<string, { similarity: number; title: string | null }>();
    for (const r of rows) {
      const cur = byStudy.get(r.study_id);
      if (!cur || r.similarity > cur.similarity) {
        byStudy.set(r.study_id, { similarity: r.similarity, title: null });
      }
    }
    // fetch titles
    const ids = Array.from(byStudy.keys());
    if (ids.length) {
      const { data: studies } = await service.from("scientific_studies").select("id, title").in("id", ids);
      for (const s of studies ?? []) {
        const cur = byStudy.get(s.id);
        if (cur) cur.title = s.title;
      }
    }
    const top = Array.from(byStudy.entries())
      .map(([study_id, v]) => ({ study_id, title: v.title, similarity: Number(v.similarity.toFixed(3)) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    return {
      hits: byStudy.size,
      max_similarity: top[0]?.similarity ?? 0,
      top,
      status: "ok",
    };
  } catch (e: any) {
    return { hits: 0, max_similarity: 0, top: [], status: "error", error: e?.message ?? "unknown" };
  }
}

async function searchPubMed(query: string): Promise<{
  hits: number;
  top: { pmid: string; title: string }[];
  status: "ok" | "error";
  error?: string;
}> {
  try {
    const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(query)}`;
    const r1 = await fetch(esearch);
    if (!r1.ok) throw new Error(`esearch ${r1.status}`);
    const j1 = await r1.json();
    const count = Number(j1?.esearchresult?.count ?? 0);
    const ids: string[] = j1?.esearchresult?.idlist ?? [];
    let top: { pmid: string; title: string }[] = [];
    if (ids.length) {
      const esum = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
      const r2 = await fetch(esum);
      if (r2.ok) {
        const j2 = await r2.json();
        top = ids.slice(0, 3).map((pmid) => ({
          pmid,
          title: j2?.result?.[pmid]?.title ?? "(sem título)",
        }));
      }
    }
    return { hits: count, top, status: "ok" };
  } catch (e: any) {
    return { hits: 0, top: [], status: "error", error: e?.message ?? "unknown" };
  }
}

async function searchPerplexity(question: string): Promise<{
  citations: string[];
  status: "ok" | "error" | "disabled";
  error?: string;
}> {
  if (!PERPLEXITY_API_KEY) return { citations: [], status: "disabled" };
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        search_mode: "academic",
        messages: [
          { role: "system", content: "List existing scientific evidence on the user's veterinary research question. Be terse. Cite sources." },
          { role: "user", content: question },
        ],
        max_tokens: 400,
        temperature: 0.1,
      }),
    });
    if (!resp.ok) throw new Error(`perplexity ${resp.status}`);
    const data = await resp.json();
    const citations: string[] = data?.citations ?? [];
    return { citations, status: "ok" };
  } catch (e: any) {
    return { citations: [], status: "error", error: e?.message ?? "unknown" };
  }
}

function computeScore(internal: any, pubmed: any, perplexity: any) {
  const internal_score = internal.status === "ok" ? Math.max(0, 100 - internal.max_similarity * 100) : null;
  const pubmed_score = pubmed.status === "ok" ? Math.max(0, Math.min(100, 100 - pubmed.hits * 2)) : null;
  const perplexity_score =
    perplexity.status === "ok" ? Math.max(0, Math.min(100, 100 - perplexity.citations.length * 8)) : null;

  const parts: { score: number; weight: number }[] = [];
  if (perplexity.status === "ok") {
    if (internal_score !== null) parts.push({ score: internal_score, weight: 0.3 });
    if (pubmed_score !== null) parts.push({ score: pubmed_score, weight: 0.4 });
    parts.push({ score: perplexity_score!, weight: 0.3 });
  } else {
    if (internal_score !== null) parts.push({ score: internal_score, weight: 0.4 });
    if (pubmed_score !== null) parts.push({ score: pubmed_score, weight: 0.6 });
  }
  if (!parts.length) return { score: null, internal_score, pubmed_score, perplexity_score };
  const totalW = parts.reduce((a, b) => a + b.weight, 0);
  const score = Math.round(parts.reduce((a, b) => a + b.score * b.weight, 0) / totalW);
  return { score, internal_score, pubmed_score, perplexity_score };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.title) {
      return new Response(JSON.stringify({ error: "title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const queries = await buildQueries(body);
    const question = `${body.title}. ${body.rationale ?? ""}`.slice(0, 500);

    const [internal, pubmed, perplexity] = await Promise.all([
      searchInternal(queries.semantic_query, service),
      searchPubMed(queries.pubmed_query),
      body.use_perplexity ? searchPerplexity(question) : Promise.resolve({ citations: [], status: "disabled" as const }),
    ]);

    const scoring = computeScore(internal, pubmed, perplexity);

    const breakdown = {
      queries,
      internal,
      pubmed,
      perplexity,
      scoring,
      google_scholar_url: `https://scholar.google.com/scholar?q=${encodeURIComponent(queries.google_scholar_query)}`,
    };
    const overall_status =
      internal.status === "error" && pubmed.status === "error" ? "error" : "ok";

    if (body.suggestion_id) {
      await service
        .from("cohort_suggestions")
        .update({
          originality_score: scoring.score,
          originality_breakdown: breakdown,
          originality_checked_at: new Date().toISOString(),
          originality_status: overall_status,
        })
        .eq("id", body.suggestion_id);
    }

    return new Response(
      JSON.stringify({ ok: true, score: scoring.score, status: overall_status, breakdown }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("check-cohort-originality error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});