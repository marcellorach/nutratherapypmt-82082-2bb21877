import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_DIM = 768;
const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

// Fixed semantic queries chosen to match topics we KNOW exist in the legacy
// vectorized corpus (titles confirmed in DB). If the index is healthy, each
// query should retrieve at least one chunk with similarity >= ~0.55.
const DEFAULT_QUERIES = [
  "quercetin effects on canine metabolic homeostasis",
  "SGLT2 inhibitor senolytic effect on senescent cells",
  "milk thistle silymarin hepatoprotective effect in dogs",
  "pyrroloquinoline quinone PQQ mitochondrial function",
  "pterostilbene antioxidant disease prevention",
];

async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: TARGET_DIM,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Embed failed (${resp.status}): ${await resp.text()}`);
  }
  const json = await resp.json();
  let vec = json.embedding?.values as number[] | undefined;
  if (!vec) throw new Error("No embedding returned");
  if (vec.length > TARGET_DIM) vec = vec.slice(0, TARGET_DIM);
  if (vec.length < TARGET_DIM) {
    vec = [...vec, ...new Array(TARGET_DIM - vec.length).fill(0)];
  }
  return vec;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const queries: string[] =
      Array.isArray(body?.queries) && body.queries.length > 0
        ? body.queries
        : DEFAULT_QUERIES;

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Corpus stats
    const { count: chunkCount } = await supabase
      .from("study_embeddings")
      .select("*", { count: "exact", head: true });

    const results: Array<{
      query: string;
      topSimilarity: number;
      avgTop5: number;
      hits: Array<{ similarity: number; studyId: string; preview: string }>;
      error?: string;
    }> = [];

    for (const q of queries) {
      try {
        const vec = await embedQuery(q, GOOGLE_AI_API_KEY);
        const { data, error } = await supabase.rpc("search_study_chunks", {
          query_embedding: JSON.stringify(vec),
          match_study_id: null,
          match_threshold: 0.0,
          match_count: 5,
        });
        if (error) throw error;
        const rows = (data ?? []) as Array<{
          similarity: number;
          study_id: string;
          chunk_text: string;
        }>;
        const sims = rows.map((r) => Number(r.similarity) || 0);
        results.push({
          query: q,
          topSimilarity: sims[0] ?? 0,
          avgTop5: sims.length ? sims.reduce((a, b) => a + b, 0) / sims.length : 0,
          hits: rows.map((r) => ({
            similarity: Number(r.similarity) || 0,
            studyId: r.study_id,
            preview: (r.chunk_text || "").slice(0, 140),
          })),
        });
      } catch (e) {
        results.push({
          query: q,
          topSimilarity: 0,
          avgTop5: 0,
          hits: [],
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const validTops = results.filter((r) => !r.error).map((r) => r.topSimilarity);
    const avgTop = validTops.length
      ? validTops.reduce((a, b) => a + b, 0) / validTops.length
      : 0;

    let verdict: "pass" | "marginal" | "fail";
    if (avgTop >= 0.55) verdict = "pass";
    else if (avgTop >= 0.4) verdict = "marginal";
    else verdict = "fail";

    return new Response(
      JSON.stringify({
        verdict,
        avgTopSimilarity: avgTop,
        chunkCount: chunkCount ?? 0,
        embeddingModel: "gemini-embedding-001@768d",
        taskType: "RETRIEVAL_QUERY",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});