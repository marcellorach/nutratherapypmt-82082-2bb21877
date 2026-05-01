
## Problem

**a) Recommendation stage missing timing**: The `stage6_recommendation` event emits `totalDurationMs` in its meta but NOT `durationMs`. The `handlePipelineEvent` handler in PetProfilePage only reads `e.meta?.durationMs`, so the recommendation stage never gets its time displayed.

**b) KG stratification**: The KG stage currently shows a single card ("93 triplets"). With more space available, we can split it into meaningful sub-stages for better visibility into what the KG query actually does.

---

## Plan

### Fix A: Add `durationMs` to stage6_recommendation

In `src/services/clinical-analysis-pipeline.ts` line ~1131, add `durationMs: performance.now() - ts6` to the meta object alongside the existing `totalDurationMs`. This is a one-line fix.

### Fix B: Stratify KG into sub-cards

Split the single "KG" stage into two visual cards in the pipeline:
1. **KG Query** — shows triplet count and query time (the actual Neo4j/graph lookup)
2. **KG Enrich** — shows pathway/projection count and enrichment time

This requires:

1. **`ClinicalPipelineWorkflow.tsx`**: Add a new `stage4b_kg_enrich` visual stage between KG and Interactions. Update the stages array to show two KG-related cards with distinct icons (Share2 for query, GitBranch or Network for enrichment).

2. **`PetProfilePage.tsx`**: 
   - Add `stage4b_kg_enrich` to the PipelineState type and initial state
   - Split the KG timing: the existing stage4_kg keeps the query time, and stage4b gets the enrichment time
   - Wire up the new counts (pathways/projections) to stage4b

3. **`clinical-analysis-pipeline.ts`**: 
   - Emit separate `stage-start`/`stage-end` events for the KG enrichment sub-phase (pathway extraction and projection calculation), using a new stage ID `stage4b_kg_enrich`
   - Include `durationMs` in its meta

4. **Translation keys**: Add `petProfile.pipeline.kgEnrich` and `petProfile.pipeline.pathways` in both PT and EN translation files. Increment `I18N_VERSION`.

5. **CHANGELOG.md**: Register both fixes.

### Technical Details

The pipeline type `PipelineStageId` in `clinical-analysis-pipeline.ts` needs a new literal `'stage4b_kg_enrich'`. The `PipelineState` type in `ClinicalPipelineWorkflow.tsx` needs a matching field. The visual layout naturally accommodates one more card since the user noted there is extra space.
