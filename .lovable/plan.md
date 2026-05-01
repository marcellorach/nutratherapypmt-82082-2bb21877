
# Fix: Translation Keys, Bilingual Logs, and Condition Names

## Problem Summary

1. **Broken keys in VetGraphRAG pipeline** (screenshot 1): `petProfile.pipeline.kgQuery`, `petProfile.pipeline.kgEnrich`, and `petProfile.pipeline.pathways` display as raw keys in the EN locale because they were never added there.

2. **Clinical pipeline log messages hardcoded in Portuguese** (screenshot 2): All `onProgress` messages in `clinical-analysis-pipeline.ts` are Portuguese-only (e.g., "Verificando interacoes...", "Gerando recomendacao hibrida...").

3. **Condition names always in English** (screenshot 3): `VetGraphRAGInsightsPanel.tsx` uses `condition_name` directly from the DB (English). Also has hardcoded PT strings like "Condição diagnosticada:", "Correlação detectada entre exames laboratoriais...".

---

## Plan

### 1. Fix missing EN translation keys

Add to `src/locales/en/translation.json` under `petProfile.pipeline`:
- `kgQuery`: "KG Query"
- `kgEnrich`: "KG Enrich"  
- `pathways`: "pathways"

### 2. Bilingualize clinical pipeline log messages (~20 messages)

In `src/services/clinical-analysis-pipeline.ts`, all `onProgress` message strings are hardcoded PT. The service doesn't have access to `t()` (it's not a React component).

**Approach**: Accept a `locale` parameter (or a small translation helper) in the pipeline. Create a lightweight dictionary object for the ~20 pipeline messages with PT/EN variants. The pipeline will use the current locale to pick the right message.

File: `src/services/clinical-pipeline-messages.ts` (new) — Contains a bilingual message dictionary keyed by message ID.

File: `src/services/clinical-analysis-pipeline.ts` — Import the dictionary, accept `locale` param, use localized messages.

File: `src/pages/veterinario/PetProfilePage.tsx` — Pass `i18n.language` to the pipeline call.

### 3. Bilingualize condition names

The `condition_name` field in the DB is English. The DB also has `condition_name_pt` (or we use a translation map).

**Approach**: Check if `pet_conditions` table has a `condition_name_pt` field. If not, use a client-side canonicalization dictionary (`src/services/clinical-name-canonicalizer.ts` already exists) to provide PT names. Update `VetGraphRAGInsightsPanel.tsx` to use `useLocalizedField` or a similar approach to show the bilingual name.

Also fix the ~5 hardcoded Portuguese strings in `VetGraphRAGInsightsPanel.tsx` (lines 51, 56-57, 74-75) by moving them to translation keys.

### 4. Governance

- Increment `I18N_VERSION` to `1.50.0`
- Update `CHANGELOG.md` and run `npm run sync:changelog`

---

## Files Changed

| File | Change |
|------|--------|
| `src/locales/en/translation.json` | Add missing `kgQuery`, `kgEnrich`, `pathways` keys |
| `src/locales/pt/translation.json` | Add pipeline log message keys + condition description keys |
| `src/locales/en/translation.json` | Add pipeline log message keys + condition description keys |
| `src/services/clinical-pipeline-messages.ts` | New: bilingual message dictionary |
| `src/services/clinical-analysis-pipeline.ts` | Accept locale, use localized messages |
| `src/pages/veterinario/PetProfilePage.tsx` | Pass locale to pipeline |
| `src/components/pet/VetGraphRAGInsightsPanel.tsx` | Use `t()` for hardcoded strings, bilingual condition names |
| `src/i18n.ts` | Bump version to 1.50.0 |
| `CHANGELOG.md` | New entry |
