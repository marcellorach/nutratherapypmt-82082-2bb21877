// triplet-verification-runner
// Block 2 — Independent verification of approved triplets and negative controls.
//
// Flow:
//   1. Build a SAMPLE of approved triplets according to sampling_strategy
//      (stratified by confidence band + enrichment_source).
//   2. Load ACTIVE verification_controls (layered negative-control bank +
//      optional vet gold-set). Backbone-swap controls are only included if
//      swap_validated = true.
//   3. For each item, recover up to top-k chunks via search_study_chunks
//      (embedding of "subject predicate object" against study_embeddings).
//   4. Call the 'triplet_verification' task via ai-task-router with a forced
//      tool_call ('submit_verification') — different model family from the
//      extractor (default openai/gpt-5.4-mini).
//   5. Persist one row per call into triplet_verifications, update the run's
//      summary (verdict histogram, FP/specificity, model agreement).
//
// Inputs (JSON body):
//   {
//     dry_run?: boolean,                       // default false — does NOT persist verifications
//     verifier_model?: string,                 // default openai/gpt-5.4-mini
//     sample?: {
//       approved_in_band?: [number, number],   // confidence band, default [0.50, 0.84]
//       approved_high?: [number, number],      // default [0.85, 1.00]
//       n_per_band?: number,                   // default 40
//       stratify_by_enrichment?: boolean       // default true
//     },
//     include_controls?: boolean,              // default true
//     control_layers?: string[],               // default ALL active layers
//     max_total?: number,                      // hard cap, default 200
//     top_k_chunks?: number                    // chunks recalled per item, default 3
//   }
//
// Output: { run_id, n_triplets, n_controls, summary }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callAITask } from "../_shared/ai-task-router.ts";
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const DEFAULT_VERIFIER = "openai/gpt-5.4-mini";
const EMBED_MODEL = "google/gemini-embedding-001";

type Verdict = "keep" | "correct" | "discard" | "unverifiable";

interface VerificationItem {
  kind: "triplet" | "control";
  id: string;
  triplet_id?: string;
  control_id?: string;
  subject_name: string;
  predicate: string;
  object_name: string;
  study_id?: string | null;
  direct_chunk_id?: string | null;
  expected_verdict?: Verdict | null;
  layer?: string;
  band?: string;
  enrichment_source?: string;
}

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!r.ok) {
      console.warn("[verify] embed failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j?.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.warn("[verify] embed error", e);
    return null;
  }
}

async function recallChunks(
  item: VerificationItem,
  topK: number,
): Promise<{ chunk_id: string; chunk_text: string; method: string; similarity?: number }[]> {
  // direct_chunk takes precedence (controls with explicit source_chunk_id)
  if (item.direct_chunk_id) {
    const { data } = await admin
      .from("study_embeddings")
      .select("id, chunk_text")
      .eq("id", item.direct_chunk_id)
      .maybeSingle();
    if (data) return [{ chunk_id: data.id, chunk_text: data.chunk_text, method: "direct_chunk" }];
  }

  const query = `${item.subject_name} ${item.predicate} ${item.object_name}`;
  const emb = await embed(query);
  if (emb) {
    const { data, error } = await admin.rpc("search_study_chunks", {
      query_embedding: emb,
      match_study_id: item.study_id ?? null,
      match_threshold: 0.4,
      match_count: topK,
    });
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        chunk_id: r.chunk_id,
        chunk_text: r.chunk_text,
        method: "embedding_top_k",
        similarity: typeof r.similarity === "number" ? r.similarity : undefined,
      }));
    }
  }

  // ilike fallback (acknowledged-fragile, instrumented for telemetry)
  if (item.study_id) {
    const { data } = await admin
      .from("study_embeddings")
      .select("id, chunk_text")
      .eq("study_id", item.study_id)
      .or(
        `chunk_text.ilike.%${item.subject_name.slice(0, 40)}%,chunk_text.ilike.%${item.object_name.slice(0, 40)}%`,
      )
      .limit(topK);
    if (data && data.length > 0) {
      return data.map((r: any) => ({
        chunk_id: r.id,
        chunk_text: r.chunk_text,
        method: "ilike_fallback",
      }));
    }
  }
  return [];
}

const VERIFY_TOOL = {
  type: "function",
  function: {
    name: "submit_verification",
    description:
      "Submit the independent verdict for the candidate triplet against the recalled source chunks.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["verdict", "confidence", "rationale", "chunk_support"],
      properties: {
        verdict: {
          type: "string",
          enum: ["keep", "correct", "discard", "unverifiable"],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        rationale: { type: "string" },
        chunk_support: {
          type: "array",
          items: { type: "integer", minimum: 0 },
        },
        corrected_triplet: {
          type: "object",
          properties: {
            subject: { type: "string" },
            predicate: { type: "string" },
            object: { type: "string" },
          },
        },
      },
    },
  },
};

async function verifyOne(
  item: VerificationItem,
  verifierModel: string,
  topK: number,
): Promise<{
  verdict: Verdict;
  confidence: number | null;
  rationale: string;
  chunk_ids: string[];
  chunk_method: string;
  recalled_chunks: any[];
  recall_similarity_top: number | null;
  tool_choice_used: boolean;
  abstain_reason: string | null;
  latency_ms: number;
  cost_estimate: number;
  raw: any;
}> {
  const recalled = await recallChunks(item, topK);
  const chunkText = recalled
    .map((c, i) => `[CHUNK ${i}] ${c.chunk_text}`)
    .join("\n\n");

  const userMsg = recalled.length === 0
    ? `CANDIDATE TRIPLET:\n  subject: ${item.subject_name}\n  predicate: ${item.predicate}\n  object: ${item.object_name}\n\nNO CHUNKS RECALLED from the source study. Decide accordingly (unverifiable is the honest answer when retrieval gave you nothing).`
    : `CANDIDATE TRIPLET:\n  subject: ${item.subject_name}\n  predicate: ${item.predicate}\n  object: ${item.object_name}\n\nRECALLED CHUNKS (top-${recalled.length} from source study):\n\n${chunkText}\n\nDecide. Call submit_verification.`;

  const systemPrompt = await fetchSystemPrompt("triplet_verification");

  const res = await callAITask("triplet_verification", {
    caller: "triplet-verification-runner",
    override_model: verifierModel,
    override_system_prompt: systemPrompt,
    messages: [{ role: "user", content: userMsg }],
    tools: [VERIFY_TOOL],
    tool_choice: { type: "function", function: { name: "submit_verification" } },
    temperature: 0,
    fallback: {
      model_id: verifierModel,
      system_prompt: systemPrompt,
    },
  });

  const call = res.tool_calls?.[0];
  let parsed: any = {};
  const toolChoiceUsed = !!call?.function?.arguments;
  try {
    parsed = JSON.parse(call?.function?.arguments ?? "{}");
  } catch (_e) { /* leave empty → unverifiable */ }

  const verdict: Verdict = (parsed.verdict as Verdict) ?? "unverifiable";
  const chunkSupport: number[] = Array.isArray(parsed.chunk_support) ? parsed.chunk_support : [];
  const chunkIds = chunkSupport
    .filter((i: number) => i >= 0 && i < recalled.length)
    .map((i: number) => recalled[i].chunk_id);

  const topSim = recalled.reduce<number | null>(
    (acc, c) => (typeof c.similarity === "number" && (acc === null || c.similarity > acc) ? c.similarity : acc),
    null,
  );

  let abstainReason: string | null = null;
  if (verdict === "unverifiable") {
    if (!toolChoiceUsed) abstainReason = "tool_call_missing";
    else if (recalled.length === 0) abstainReason = "no_chunks";
    else if (topSim !== null && topSim < 0.55) abstainReason = "low_similarity";
    else if (chunkIds.length === 0) abstainReason = "chunks_off_topic";
    else abstainReason = "other";
  }

  return {
    verdict,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    chunk_ids: chunkIds.length > 0 ? chunkIds : recalled.map((c) => c.chunk_id),
    chunk_method: recalled[0]?.method ?? "embedding_top_k",
    recalled_chunks: recalled.map((c, i) => ({
      idx: i,
      chunk_id: c.chunk_id,
      similarity: c.similarity ?? null,
      method: c.method,
      snippet: (c.chunk_text ?? "").slice(0, 320),
      supported: chunkSupport.includes(i),
    })),
    recall_similarity_top: topSim,
    tool_choice_used: toolChoiceUsed,
    abstain_reason: abstainReason,
    latency_ms: res.latency_ms,
    cost_estimate: res.cost_estimate,
    raw: { tool_call_args: parsed, recalled_n: recalled.length },
  };
}

async function buildSample(
  body: any,
): Promise<VerificationItem[]> {
  const items: VerificationItem[] = [];
  const sample = body.sample ?? {};
  const bandGray: [number, number] = sample.approved_in_band ?? [0.50, 0.84];
  const bandHigh: [number, number] = sample.approved_high ?? [0.85, 1.00];
  const n = Math.max(1, Math.min(200, sample.n_per_band ?? 40));

  for (const [band, range] of [["gray", bandGray], ["high", bandHigh]] as const) {
    const { data } = await admin
      .from("triplet_extractions")
      .select("id, subject_name, predicate, object_name, study_id, enrichment_source, extraction_confidence")
      .eq("curation_status", "approved")
      .gte("extraction_confidence", range[0])
      .lte("extraction_confidence", range[1])
      .limit(n * 3); // oversample, shuffle, take n
    const rows = (data ?? []).sort(() => Math.random() - 0.5).slice(0, n);
    for (const r of rows) {
      items.push({
        kind: "triplet",
        id: r.id,
        triplet_id: r.id,
        subject_name: r.subject_name,
        predicate: r.predicate,
        object_name: r.object_name,
        study_id: r.study_id,
        band,
        enrichment_source: r.enrichment_source ?? "none",
      });
    }
  }
  return items;
}

async function loadControls(layers?: string[]): Promise<VerificationItem[]> {
  let q = admin
    .from("verification_controls")
    .select("id, layer, subject_name, predicate, object_name, source_study_id, source_chunk_id, expected_verdict, swap_validated")
    .eq("active", true);
  if (layers && layers.length > 0) q = q.in("layer", layers);
  const { data } = await q;
  const rows = (data ?? []).filter((c: any) =>
    c.layer !== "backbone_swap" || c.swap_validated === true
  );
  return rows.map((c: any) => ({
    kind: "control" as const,
    id: c.id,
    control_id: c.id,
    subject_name: c.subject_name,
    predicate: c.predicate,
    object_name: c.object_name,
    study_id: c.source_study_id,
    direct_chunk_id: c.source_chunk_id,
    expected_verdict: c.expected_verdict,
    layer: c.layer,
  }));
}

function buildSummary(rows: any[]): Record<string, any> {
  const hist: Record<string, number> = { keep: 0, correct: 0, discard: 0, unverifiable: 0 };
  let controls = 0, controlsMatched = 0;
  const byBand: Record<string, Record<string, number>> = {};
  const byLayer: Record<string, { n: number; matched: number; verdicts: Record<string, number> }> = {};
  for (const r of rows) {
    hist[r.verdict] = (hist[r.verdict] ?? 0) + 1;
    if (r.control_id) {
      controls += 1;
      if (r.matched_expected) controlsMatched += 1;
      const layer = r.raw_response?.layer ?? "unknown";
      byLayer[layer] ??= { n: 0, matched: 0, verdicts: {} };
      byLayer[layer].n += 1;
      if (r.matched_expected) byLayer[layer].matched += 1;
      byLayer[layer].verdicts[r.verdict] = (byLayer[layer].verdicts[r.verdict] ?? 0) + 1;
    } else {
      const band = r.raw_response?.band ?? "unknown";
      byBand[band] ??= { keep: 0, correct: 0, discard: 0, unverifiable: 0 };
      byBand[band][r.verdict] = (byBand[band][r.verdict] ?? 0) + 1;
    }
  }
  return {
    verdict_histogram: hist,
    by_band: byBand,
    by_control_layer: byLayer,
    control_specificity: controls > 0 ? Number((controlsMatched / controls).toFixed(3)) : null,
    n_total: rows.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const dryRun = body.dry_run === true;
    const verifierModel = body.verifier_model ?? DEFAULT_VERIFIER;
    const includeControls = body.include_controls !== false;
    const topK = Math.max(1, Math.min(10, body.top_k_chunks ?? 3));
    const maxTotal = Math.max(1, Math.min(500, body.max_total ?? 200));

    const tripletItems = await buildSample(body);
    const controlItems = includeControls ? await loadControls(body.control_layers) : [];
    const all = [...tripletItems, ...controlItems].slice(0, maxTotal);

    // Stratification snapshot (verdade-base do que foi efetivamente sorteado)
    const strat: any = {
      triplets_by_band: {} as Record<string, number>,
      triplets_by_enrichment: {} as Record<string, number>,
      controls_by_layer: {} as Record<string, number>,
      top_k_chunks: topK,
      verifier_model: verifierModel,
      tool_choice: { type: "function", function: "submit_verification" },
    };
    for (const it of tripletItems) {
      const b = it.band ?? "unknown";
      strat.triplets_by_band[b] = (strat.triplets_by_band[b] ?? 0) + 1;
      const e = it.enrichment_source ?? "none";
      strat.triplets_by_enrichment[e] = (strat.triplets_by_enrichment[e] ?? 0) + 1;
    }
    for (const it of controlItems) {
      const l = it.layer ?? "unknown";
      strat.controls_by_layer[l] = (strat.controls_by_layer[l] ?? 0) + 1;
    }

    // Create run row
    const { data: run, error: runErr } = await admin
      .from("triplet_verification_runs")
      .insert({
        label: body.label ?? `verify-${new Date().toISOString()}`,
        sampling_strategy: body.sample ?? {},
        stratification_snapshot: strat,
        verifier_model_id: verifierModel,
        n_triplets: tripletItems.length,
        n_controls: controlItems.length,
        status: dryRun ? "completed" : "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (runErr) throw runErr;

    if (dryRun) {
      return new Response(
        JSON.stringify({
          run_id: run.id,
          dry_run: true,
          would_verify: all.length,
          n_triplets: tripletItems.length,
          n_controls: controlItems.length,
          sample_preview: all.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const writes: any[] = [];
    for (const item of all) {
      try {
        const res = await verifyOne(item, verifierModel, topK);
        const matched = item.expected_verdict
          ? res.verdict === item.expected_verdict
          : null;
        writes.push({
          run_id: run.id,
          triplet_id: item.triplet_id ?? null,
          control_id: item.control_id ?? null,
          verifier_model_id: verifierModel,
          source_chunk_ids: res.chunk_ids,
          chunk_recall_method: res.chunk_method,
          verdict: res.verdict,
          confidence: res.confidence,
          rationale: res.rationale,
          expected_verdict: item.expected_verdict ?? null,
          matched_expected: matched,
          latency_ms: res.latency_ms,
          cost_estimate: res.cost_estimate,
          tool_choice_used: res.tool_choice_used,
          abstain_reason: res.abstain_reason,
          recalled_chunks: res.recalled_chunks,
          recall_similarity_top: res.recall_similarity_top,
          raw_response: { ...res.raw, band: item.band, layer: item.layer, enrichment_source: item.enrichment_source },
        });
      } catch (e) {
        console.error("[verify] item failed", item.id, e);
        writes.push({
          run_id: run.id,
          triplet_id: item.triplet_id ?? null,
          control_id: item.control_id ?? null,
          verifier_model_id: verifierModel,
          source_chunk_ids: [],
          chunk_recall_method: "embedding_top_k",
          verdict: "unverifiable",
          confidence: null,
          rationale: `Verifier error: ${e instanceof Error ? e.message : String(e)}`,
          expected_verdict: item.expected_verdict ?? null,
          matched_expected: false,
          tool_choice_used: false,
          abstain_reason: "verifier_error",
          recalled_chunks: [],
          recall_similarity_top: null,
          raw_response: { error: true, band: item.band, layer: item.layer },
        });
      }
    }

    if (writes.length > 0) {
      const { error: insErr } = await admin.from("triplet_verifications").insert(writes);
      if (insErr) console.error("[verify] persist failed", insErr);
    }

    const summary = buildSummary(writes);
    await admin
      .from("triplet_verification_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        summary,
      })
      .eq("id", run.id);

    return new Response(
      JSON.stringify({
        run_id: run.id,
        n_triplets: tripletItems.length,
        n_controls: controlItems.length,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[verify] fatal", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});