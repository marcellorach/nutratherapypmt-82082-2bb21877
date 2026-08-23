/**
 * Axis-1 deep-merge with ownership for processed_studies.analysis_data
 * and study_extractions.extracted_data.
 *
 * SINGLE SOURCE OF TRUTH for who owns what between gemini-file-search
 * (rich first-pass extractor) and extract-study-entities (Stage 1/2/3).
 *
 * Pure functions, no Deno imports — safe to import from both edge functions
 * (Deno) and the vitest regression test (Node).
 */

// Keys that gemini-file-search owns in analysis_data.
// Extract may write them too, but only fills them if gemini left them empty.
export const GEMINI_OWNED_ANALYSIS = new Set<string>([
  'extractedNutraceuticals',
  'extractedMechanisms',
  'extractedEffects',
  'extractedSynergies',
  'extractedContraindications',
  'extractedDrugInteractions',
  'structured_dosages',
  'side_effects',
  'study_assessment',
  'studyAssessment',
  'study_summary',
  'studySummary',
  'extraction_summary',
  'biological_effects',
  'biomarkers',
  'study_population',
]);

// Keys that extract-study-entities owns in analysis_data (replace).
//
// READ-PATH OFICIAL: src/hooks/useStudyRichData.ts é o único leitor canônico
// destes campos na UI. NÃO ler `analysis_data.molecularMechanisms` (etc.)
// direto em components — o helper lida com o fallback de estudos legados
// que têm os campos populados em `study_extractions.extracted_data` mas não
// em `analysis_data`. Espelhar qualquer mudança aqui em
// EXTRACT_OWNED_SNAKE_TO_CAMEL no helper. Há guard de CI em
// scripts/check-ownership-reads.mjs.
export const EXTRACT_OWNED_ANALYSIS = new Set<string>([
  'molecularMechanisms',
  'clinicalOutcomes',
  'synergies',
  'hierarchicalRelations',
  'extractionStages',
  'detailedSideEffects',
]);

// Snake-case counterpart used in study_extractions.extracted_data. Mirror of
// EXTRACT_OWNED_ANALYSIS — same 6 fields, different key style. Kept in sync
// intentionally: both sets are protected by the anti-overwrite guard below.
export const EXTRACT_OWNED_EXTRACTED = new Set<string>([
  'molecular_mechanisms',
  'clinical_outcomes',
  'synergies',
  'hierarchical_relations',
  'extraction_stages',
  'detailed_side_effects',
]);

// Score keys — prefer the value already present (gemini LLM-derived) over
// any extract-side hardcoded fallback (e.g. extract's qualityScore = 3).
export const SCORE_KEYS = new Set<string>([
  'qualityScore',
  'relevanceScore',
  'noveltyScore',
]);

// Keys that gemini-file-search owns in study_extractions.extracted_data.
export const GEMINI_OWNED_EXTRACTED = new Set<string>([
  'nutraceuticals',
  'structured_dosages',
  'study_population',
  'biomarkers',
  'biological_effects',
  'drug_interactions',
  'study_summary',
  'study_assessment',
  'side_effects',
  'extraction_version',
  'extracted_at',
]);

function hasContent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return v !== 0;
  return true;
}

/**
 * gemini-file-search writes a SHIM under `clinical_outcomes` /
 * `clinicalOutcomes` derived from conditions:
 *   { condition, relationship, efficacy, treatability_score }
 * That shape has none of the statistical fields the UI renders, so the
 * anti-overwrite guard must NOT treat it as real extract-owned content —
 * otherwise Stage 3 outcomes are dropped and the UI shows blank cards.
 */
export function isClinicalOutcomeShim(v: unknown): boolean {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const o = item as Record<string, unknown>;
    return o.outcome === undefined && o.condition !== undefined;
  });
}

/** hasContent, but shape-aware for extract-owned outcome fields. */
function hasOwnedContent(key: string, v: unknown): boolean {
  if (!hasContent(v)) return false;
  if (key === 'clinical_outcomes' || key === 'clinicalOutcomes') {
    return !isClinicalOutcomeShim(v);
  }
  return true;
}

function dedupContraindications(a: unknown, b: unknown): unknown[] {
  const arrA = Array.isArray(a) ? a : [];
  const arrB = Array.isArray(b) ? b : [];
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const item of [...arrA, ...arrB]) {
    const raw = typeof item === 'string'
      ? item
      : (item as any)?.name || (item as any)?.contraindication || JSON.stringify(item);
    const key = String(raw).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function dedupDosages(a: unknown, b: unknown): unknown[] {
  const arrA = Array.isArray(a) ? a : [];
  const arrB = Array.isArray(b) ? b : [];
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const item of [...arrA, ...arrB]) {
    const it = (item || {}) as any;
    const dose = it.dose || it.dose_string
      || (it.amount != null ? `${it.amount}${it.unit ? ' ' + it.unit : ''}` : '');
    const key = [
      String(it.compound || it.nutraceutical || '').toLowerCase().trim(),
      String(dose).toLowerCase().trim(),
      String(it.route || '').toLowerCase().trim(),
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Deep-merge for processed_studies.analysis_data when extract-study-entities
 * finishes. Starts from the existing (gemini-written) row and applies extract's
 * output campo-a-campo. Gemini-only keys are PRESERVED.
 */
/**
 * Anti-overwrite semantics for EXTRACT_OWNED_* keys:
 *  - If the current value has non-empty content AND opts.forceReextract is
 *    NOT true → keep current (protects 21→11 destructive re-runs).
 *  - If current is empty/missing → let the new value fill (allows 0→N).
 *  - If opts.forceReextract === true → replace (curator explicit re-extract).
 */
export interface MergeOptions {
  forceReextract?: boolean;
}

export function mergeAnalysisData(current: any, extractOutput: any, opts: MergeOptions = {}): any {
  const c = (current && typeof current === 'object') ? current : {};
  const e = (extractOutput && typeof extractOutput === 'object') ? extractOutput : {};
  const merged: any = { ...c };

  for (const [k, v] of Object.entries(e)) {
    if (GEMINI_OWNED_ANALYSIS.has(k)) {
      // Only fill if gemini left it empty/missing.
      if (!hasContent(c[k])) merged[k] = v;
      continue;
    }
    if (EXTRACT_OWNED_ANALYSIS.has(k)) {
      // Anti-overwrite guard: protect non-empty extract-owned content unless
      // the caller explicitly requested a forced re-extract.
      if (opts.forceReextract || !hasOwnedContent(k, c[k])) {
        merged[k] = v;
      }
      continue;
    }
    if (SCORE_KEYS.has(k)) {
      // Prefer the existing (gemini/LLM-derived) numeric score.
      const existing = c[k];
      if (typeof existing === 'number' && existing > 0) {
        merged[k] = existing;
      } else if (hasContent(v)) {
        merged[k] = v;
      }
      continue;
    }
    if (k === 'contraindications') {
      merged[k] = dedupContraindications(c[k], v);
      continue;
    }
    if (k === 'dosages') {
      merged[k] = dedupDosages(c[k], v);
      continue;
    }
    // EXTRACT_OWNED_ANALYSIS or any other extract-written key → replace.
    merged[k] = v;
  }
  return merged;
}

/**
 * Deep-merge for study_extractions.extracted_data when extract-study-entities
 * upserts. Gemini-owned rich fields are preserved if present; extract owns
 * clinical_outcomes (statistical shape) and replaces.
 */
export function mergeExtractedData(current: any, extractOutput: any, opts: MergeOptions = {}): any {
  const c = (current && typeof current === 'object') ? current : {};
  const e = (extractOutput && typeof extractOutput === 'object') ? extractOutput : {};
  const merged: any = { ...c };

  for (const [k, v] of Object.entries(e)) {
    if (GEMINI_OWNED_EXTRACTED.has(k)) {
      if (!hasContent(c[k])) merged[k] = v;
      continue;
    }
    if (EXTRACT_OWNED_EXTRACTED.has(k)) {
      // Anti-overwrite guard (snake-case mirror). See MergeOptions above.
      if (opts.forceReextract || !hasOwnedContent(k, c[k])) {
        merged[k] = v;
      }
      continue;
    }
    if (k === 'contraindications') {
      merged[k] = dedupContraindications(c[k], v);
      continue;
    }
    if (k === 'dosages') {
      merged[k] = dedupDosages(c[k], v);
      continue;
    }
    // clinical_outcomes, molecular_mechanisms, synergies, hierarchical_relations,
    // mechanisms, conditions, findings, study_quality, exclusion_criteria,
    // evidence_gaps → extract replaces.
    merged[k] = v;
  }
  return merged;
}

/**
 * Merge na direção OPOSTA: o escritor é gemini-file-search (ou qualquer
 * escritor que NÃO é o extract-study-entities).
 *
 * Regras:
 *  - chaves extract-owned → PRESERVA o valor atual quando ele tem conteúdo
 *    real (shim de clinical_outcomes não conta como conteúdo);
 *  - qualquer outra chave → o escritor substitui (é dono ou é campo neutro).
 *
 * Usado por gemini-file-search, parse-study e generate-triplets para que uma
 * re-execução deles não apague Stage 2/3 do extract.
 */
export function mergeAnalysisDataFromOtherWriter(current: any, output: any): any {
  const c = (current && typeof current === 'object') ? current : {};
  const o = (output && typeof output === 'object') ? output : {};
  const merged: any = { ...c };

  for (const [k, v] of Object.entries(o)) {
    if (EXTRACT_OWNED_ANALYSIS.has(k) && hasOwnedContent(k, c[k])) continue;
    merged[k] = v;
  }
  return merged;
}

/** Mesma direção, para study_extractions.extracted_data (chaves snake_case). */
export function mergeExtractedDataFromOtherWriter(current: any, output: any): any {
  const c = (current && typeof current === 'object') ? current : {};
  const o = (output && typeof output === 'object') ? output : {};
  const merged: any = { ...c };

  for (const [k, v] of Object.entries(o)) {
    if (EXTRACT_OWNED_EXTRACTED.has(k) && hasOwnedContent(k, c[k])) continue;
    merged[k] = v;
  }
  return merged;
}

/** Convenience for logging. */
export function sortedKeys(obj: any): string[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).sort();
}
