

# Fixing Individualized Recommendations and Enriching Clinical Discovery

## Two Critical Problems Identified

### Problem A: Only breed predispositions shown — no insights from exams/history/anamnesis

The ClinicalAlertsPanel currently shows breed predispositions and abnormal lab results, but does NOT show **cross-referencing discoveries** — patterns the VetGraphRAG should identify by correlating exams + conditions + medications + breed risks. For example:
- Rex has WBC 12,500 (flagged high) + Osteoarthritis + Cellular Senescence + takes Meloxicam → the system should note "Elevated WBC may indicate chronic inflammatory response linked to Osteoarthritis" and "Long-term Meloxicam use requires hepatorenal monitoring"
- This is the NON-OBVIOUS pattern detection that differentiates VetGraphRAG

Additionally, the exam data is too sparse for meaningful cross-referencing — Rex only has an X-Ray and a CBC. To demonstrate the power of the system, we need richer clinical data.

### Problem B: All animals get the same recommendations (Curcumin, NMN, Resveratrol, Omega-3)

Root cause identified: **the `hybrid-recommendation` edge function ignores all individualized context**. The function's interface only accepts `mode, petProfile, condition, kgData` — it completely discards the `clinicalContext` object (predispositions, lab alerts, current medications) that the pipeline sends.

Furthermore, the KG query uses a generic `context` query type that returns ALL relationships matching a condition name pattern. Every pet with "Osteoarthritis" gets the exact same KG nodes, producing the same compounds.

The LLM prompt in `enrich` mode only says "add clinical considerations" without any patient-specific data.

## Plan

### 1. Enrich seed exam/clinical data for demo pets (Migration)

Add richer, differentiated clinical data for each of the 5 demo pets:

- **Rex** (Labrador, 8y): Add Geriatric Panel (ALT elevated 85, Creatinine borderline 1.4), Inflammatory Markers (CRP 18, IL-6 elevated), Oxidative Stress Panel (MDA elevated, SOD low)
- **Mel** (Golden, 10y): Add Thyroid Panel (T4 low-normal), Kidney Panel (BUN borderline), Liver Panel (ALT elevated)
- **Luna** (CKCS, 6y): Add Cardiac Biomarkers (NT-proBNP elevated, troponin I elevated)
- **Max** (Beagle, 9y): Add Neurocognitive Markers, Geriatric Panel with specific cognitive markers
- **Thor** (GSD, 5y): Add Complete metabolic panel, Joint-specific inflammatory markers

This creates distinct clinical profiles that force differentiated recommendations.

### 2. Add "Clinical Discoveries" section to ClinicalAlertsPanel

Add a new section between "Abnormal Lab Results" and "Interaction Alerts" called **"Clinical Discoveries"** (Descobertas Clínicas). This section will show AI-identified cross-references:

- Correlations between elevated lab values and existing conditions (e.g., "Elevated CRP may be linked to active Osteoarthritis")
- Medication-condition interactions (e.g., "Long-term Meloxicam — monitor renal function given borderline creatinine")
- Breed-predisposition + lab confirmation patterns (e.g., "Labrador predisposition to Hip Dysplasia confirmed by X-Ray grade 3")

These discoveries will be generated in the pipeline by a new `generateClinicalDiscoveries()` function that cross-references predispositions, lab alerts, conditions, and medications.

### 3. Fix hybrid-recommendation to use ALL patient context

Update the edge function to:
- Accept `clinicalContext` in the request interface (predispositions, labAlerts, currentMedications, existingConditions, examResults)
- Inject this full context into BOTH the `enrich` and `fallback` LLM prompts
- Instruct the LLM to differentiate recommendations based on: (a) specific lab abnormalities, (b) current medications (avoid redundancy/interactions), (c) breed-specific risks, (d) age-appropriate dosing
- Use `tool_choice` to force structured JSON output with per-condition compound mapping

### 4. Make KG queries condition-specific with compound deduplication

Update `queryKnowledgeGraph()` to query each condition separately AND filter out compounds already prescribed as medications. The pipeline should also weight KG results by relevance to the specific patient's lab findings (e.g., if CRP is elevated, prioritize anti-inflammatory compounds; if oxidative stress markers are abnormal, prioritize antioxidants).

Add a new `prioritizeByLabFindings()` function that re-ranks KG-returned compounds based on which lab abnormalities they address.

### 5. Map compounds to specific conditions (not just primaryCondition)

Currently line 532: `condition: primaryCondition` — ALL compounds are assigned to the first condition only. Fix to map each compound to the condition it was retrieved for, using the per-condition KG results.

## Files to modify

1. **Migration SQL** — Insert richer exam data for all 5 demo pets
2. **`src/services/clinical-analysis-pipeline.ts`** — Add `generateClinicalDiscoveries()`, `prioritizeByLabFindings()`, fix compound-to-condition mapping
3. **`src/components/pet/ClinicalAlertsPanel.tsx`** — Add "Clinical Discoveries" section with cross-reference insights
4. **`supabase/functions/hybrid-recommendation/index.ts`** — Accept and use `clinicalContext`, differentiate prompts per patient
5. **`src/pages/veterinario/PetProfilePage.tsx`** — Pass clinical discoveries to alerts panel, wire new data flow

