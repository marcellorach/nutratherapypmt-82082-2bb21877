

# Recovering Biological Pathway and Scientific Evidence Panels

## Problem
The **Biological Pathway** and **Scientific Evidence** tabs are empty because `extractKgEvidence()` in `clinical-analysis-pipeline.ts` is too restrictive:
- **Triplets**: Only captures `TREATS`, `PREVENTS`, `ALLEVIATES`, `SUPPORTS` — misses `INHIBITS`, `MODULATES`, `ACTIVATES`, `CONTRAINDICATES`
- **Pathways**: Only builds one minimal chain per condition (first compound → first mechanism → first effect → outcome), ignoring relationship labels

The data is there in the KG results but gets filtered out.

## Plan

### 1. Enrich `extractKgEvidence()` in `clinical-analysis-pipeline.ts`

**Triplets** — expand predicate filter to include ALL clinically relevant predicates:
`TREATS, PREVENTS, AMELIORATES, INHIBITS, MODULATES, ACTIVATES, CONTRAINDICATES, INTERACTS_WITH, SUPPORTS, CAUSES, AGGRAVATES`

This populates the Scientific Evidence panel with rich data including inhibition (⊣), modulation (- -→), and contraindications.

**Pathways** — build ALL possible chains (not just the first compound). For each compound found in the KG results, trace through mechanisms and effects to build a complete pathway chain. Include the relationship predicate as a label between steps so the UI can show `[inibe]`, `[modula]`, `[ativa]`, etc.

### 2. Enhance `BiologicalPathway.tsx` component

- Add a new `predicate` field to `PathwayStep` interface to carry the relationship type between steps
- Display the predicate as a labeled arrow between steps (e.g., `↓ [INHIBITS]`, `↓ [MODULATES]`) with color-coding matching the standard biomedical notation (red for inhibits, orange for modulates, blue for activates, green for treats)
- Add a new step type `contraindication` with red styling
- Support rendering multiple pathways per condition (currently limited to one)

### 3. Enhance `ScientificEvidencePanel.tsx`

- Add `CONTRAINDICATES` and `CAUSES` to `predicateBadgeColors` and `predicateSymbols` maps
- Add a "Contraindications" section separated visually from treatments (red border/background) so they stand out
- Add a "Synergistic Treatments" section at the bottom showing compounds that treat 2+ conditions simultaneously (data already available from `condition-insights`)

### 4. Wire synergistic and contraindication data

- Pass `conditionInsights.data?.synergisticCompounds` to the Scientific Evidence tab so it can display synergistic treatments alongside the triplet evidence
- Pass contraindication triplets separately so they render in a warning section

### Technical Details

**`PathwayStep` interface change:**
```typescript
interface PathwayStep {
  label: string;
  type: 'compound' | 'mechanism' | 'effect' | 'outcome' | 'contraindication';
  predicate?: string; // e.g. 'INHIBITS', 'MODULATES'
}
```

**`extractKgEvidence` pathway building logic:**
- Iterate ALL compounds (not just `[0]`)
- For each compound, find connected mechanisms via relationships, then effects, then outcomes
- Store the predicate on each step transition
- Deduplicate by compound+condition key

**Files to modify:**
1. `src/services/clinical-analysis-pipeline.ts` — `extractKgEvidence()`: expand predicate filters, build richer pathways
2. `src/components/pet/BiologicalPathway.tsx` — show predicate labels between steps, support contraindication type, color-coded arrows
3. `src/components/pet/ScientificEvidencePanel.tsx` — add contraindication section, synergistic treatments section, expand predicate maps
4. `src/pages/veterinario/PetProfilePage.tsx` — pass synergistic compound data to Scientific Evidence tab

