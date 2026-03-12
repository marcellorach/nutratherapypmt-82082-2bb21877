

# Plan: Bilingual Clinical System + Enhanced Condition Reasoning + Compound Chat

## Problem Analysis

### a) Portuguese hardcoded everywhere
- `evidence-levels.ts`: All levels hardcoded in PT ("Muito Alta", "Média-Baixa", etc.)
- `generateMockCompounds()` in `VetRecommendationPanel.tsx`: Names ("Curcumina", "Ômega-3"), conditions ("Artrite", "Estresse Oxidativo"), and rationales all in Portuguese
- `ClinicalAlertsPanel.tsx`: Lab alert `clinical_significance` comes from DB in PT
- `PredispositionTag.tsx`: `conditionName` comes from DB — needs `name_en` field support

### b) Condition cards lack clinical reasoning
- Current `ConditionInsightCard` expands to show KG treatments and causal links, but no clinical reasoning explaining *why* this condition was diagnosed or how it connects to the patient's overall profile
- No suggested complementary exams (e.g., "Before treating Cellular Senescence, consider: Telomere Length Assay, Inflammatory Markers Panel")

### c) Recommendation compounds need sophistication
- Mock data is in Portuguese — needs bilingual support
- No per-compound expandable chat with biological pathway awareness
- `CompoundSpecificChat` exists but is a separate tab — should be inline as a collapsible section per compound

## Changes

### 1. `evidence-levels.ts` — Full i18n
- Replace hardcoded PT strings with i18n keys
- Accept a `t` function parameter or return keys instead of strings
- Add EN/PT translations for all 7 evidence levels + recommendation strengths

### 2. `VetRecommendationPanel.tsx` — Bilingual mock data
- `generateMockCompounds()` should use `t()` for names, conditions, rationales
- Add all compound translations to EN/PT locale files

### 3. `CompoundDosageSlider.tsx` — Inline expandable chat + rationale
- Add a collapsible "Discuss this recommendation" section below each compound
- When expanded, shows:
  - **Scientific rationale** with KG-backed evidence (study count, predicate)
  - **Inline chat** (reuse CompoundSpecificChat logic) pre-loaded with full patient context + biological pathway awareness
- System prompt includes: patient profile, all conditions, all medications, the specific compound's KG evidence, and instruction to reference biological pathways

### 4. `ConditionInsightCard.tsx` — Clinical reasoning + suggested exams
- Add a "Clinical Reasoning" section showing *why* this condition is relevant:
  - Link to breed predispositions (if breed is predisposed)
  - Connection to other conditions (from causal links)
  - Age-related plausibility
- Add "Suggested Pre-Treatment Exams" section:
  - Map conditions to relevant lab tests (e.g., Osteoarthritis → Inflammatory Markers, X-ray; Cellular Senescence → Telomere Length, Oxidative Stress Markers)
  - Store mappings in a const or fetch from KG where available

### 5. `PredispositionTag.tsx` — Bilingual condition names
- Accept optional `conditionNameEn` prop
- Use `useLocalizedField` pattern to show EN or PT based on language

### 6. Translation files — Add all missing keys
- Evidence levels: "Very High", "High", "Medium-High", "Medium", "Medium-Low", "Low", "Very Low"
- Recommendation strengths: "Strong", "Moderate", "Weak"
- Mock compound data in EN
- Suggested exam names in EN/PT
- Clinical reasoning labels

## Files

| File | Action |
|---|---|
| `src/rules/general/evidence-levels.ts` | Refactor to accept `t()` or return i18n keys |
| `src/components/pet/VetRecommendationPanel.tsx` | Bilingual mock data with `t()` |
| `src/components/pet/CompoundDosageSlider.tsx` | Add collapsible rationale + inline chat |
| `src/components/pet/ConditionInsightCard.tsx` | Add clinical reasoning + suggested exams sections |
| `src/components/administrador/tags/PredispositionTag.tsx` | Support bilingual condition names |
| `src/locales/en/translation.json` | Add ~50 keys for evidence, compounds, exams |
| `src/locales/pt/translation.json` | Add matching PT keys |

