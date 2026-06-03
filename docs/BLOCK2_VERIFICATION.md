# Block 2 — Independent Triplet Verification

> Status: **infra built, not yet executed**. Awaiting layered control bank
> (vet gold-set + validated backbone swaps) before the first measurement run.

## What exists

- **Tables** (migration applied)
  - `triplet_verification_runs` — batch metadata + summary.
  - `verification_controls` — layered control bank (see below).
  - `triplet_verifications` — one row per `{triplet|control} × run` with verdict,
    confidence, recalled chunks, model used, latency, cost.
- **Edge function** `triplet-verification-runner`
  - Stratified sample of approved triplets (gray band 0.50–0.84 + high band
    0.85–1.00, n configurable, stratified by `enrichment_source`).
  - Loads active controls (backbone-swap excluded unless `swap_validated=true`).
  - Recalls top-k chunks via embedding of `"{subject} {predicate} {object}"`
    against `study_embeddings` (`search_study_chunks` RPC). Falls back to
    `ilike` and instruments which method was used per row.
  - Calls the `triplet_verification` system prompt with `tool_choice` forced
    on `submit_verification` — verifier is a different model FAMILY
    (default `openai/gpt-5.4-mini`) than the extractor (Gemini 3 Pro).
  - Persists verdicts, computes per-band and per-layer summaries
    (verdict histogram, control specificity).
- **System prompt** `triplet_verification`
  - Honest-abstain mandatory: chunks don't address claim → `unverifiable`.
  - Downgrade rules: preliminary/cross-species/breed-generalised → `correct`.
  - Null-result phrasing → `discard`.
  - No outside-knowledge rescue.

## Layered control design (REFINED — not just hand-built pairs)

Hand-built negatives (`aspirin → renal`, `turmeric → parvo`) are floor only
— too easy. Real specificity comes from controls that look like REAL errors.

| Layer | What it is | What it tests | Status |
| --- | --- | --- | --- |
| `backbone_swap` | Real triplet + real chunk that does NOT support it (provenance mismatch). **Must be human-validated to confirm swap didn't create a true relation by accident.** | Verifier's basic provenance discipline. | Bank empty — needs build + `swap_validated=true` gate. |
| `pubmed_null` | Real null-result PubMed abstract, claim phrased as positive. | RC-001/002: catches "no significant difference" being asserted as effect. | Bank empty — leverage existing `kg-evidence-gap-fill` PubMed pipeline. |
| `realistic_cross_species` | Rodent/human finding asserted as canine. | RC-003 translational modulator. | Bank empty. |
| `realistic_breed_general` | Breed-specific finding generalised to all dogs. | Real extractor failure mode. | Bank empty. |
| `realistic_preliminary` | In-vitro / preliminary asserted as established clinical. | Real extractor failure mode (observed in 10 rejected triplets — abstract chains masquerading as causal claims). | Bank empty. |
| `synthetic_floor` | ~5–8 hand-built sanity-check pairs. | Floor — does verifier do ANYTHING? | Bank empty — cap at 8. |
| `gold_set` | ~20 REAL triplets labelled `keep`/`discard` by a vet. | Concordance with ground truth — most valuable layer. | **Highest priority, needs vet time.** |

The chain: **controls validate the verifier → validated verifier measures the
sample → sample reconciles the thresholds (RC-007 ≥0.5 / RC-013 ≥0.7 /
code ≥0.85+0.50) with data, not opinion.**

## What we know from the existing 10 rejected triplets

All confidence ≤ 0.59. Pattern: abstraction chains like
`Neurological Protection PRODUCES Cellular Damage` — semantic glue, not
falsifiable claims. **This means the easy errors are already being caught
at curation.** The risk zone is the 3,924 approved (esp. 0.50–0.84 band)
with concrete clinical wording like `Curcumin TREATS Sarcopenia` —
exactly where Layer 2 controls (preliminary / cross-species / breed-general)
model the realistic failure mode.

## Not yet done (next turn — control bank build)

1. Vet gold-set: ~20 real triplets labelled by hand.
2. Backbone-swap builder: pick approved triplet, swap its chunk for another
   real chunk from the same study; human checks the swap is genuinely false.
3. PubMed null-result fetcher: extend `kg-evidence-gap-fill` to flag null
   abstracts and instantiate controls.
4. Layer 2 builders: cross-species / breed-general / preliminary, ~10 each.
5. First measurement run, then publish FP-rate curve by confidence bin.

## Cost notes

- `openai/gpt-5.4-mini`: ~$0.0015/1k in + $0.006/1k out. A 200-item run
  with ~800 input + 200 output tokens each ≈ ~$0.50.
- Embedding recall (`google/gemini-embedding-001`) adds ~200 × $0.000125
  ≈ negligible.