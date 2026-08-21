/**
 * Núcleo PURO de useStudyRichData — sem React, sem supabase.
 * Existe separado para que os testes possam importar sem arrastar o cliente
 * Supabase (que precisa de `localStorage` no carregamento e quebra em Node).
 * O hook em `./useStudyRichData.ts` reexporta tudo daqui.
 */
import type { ClinicalOutcome } from '@/types/vetgraphrag';

export const EXTRACT_OWNED_SNAKE_TO_CAMEL = {
  molecular_mechanisms: 'molecularMechanisms',
  clinical_outcomes: 'clinicalOutcomes',
  hierarchical_relations: 'hierarchicalRelations',
  synergies: 'synergies',
  extraction_stages: 'extractionStages',
  detailed_side_effects: 'detailedSideEffects',
} as const;

const EXTRACT_OWNED_CAMEL_KEYS = Object.values(EXTRACT_OWNED_SNAKE_TO_CAMEL) as readonly string[];

function hasContent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return v !== 0;
  return true;
}

/**
 * gemini-file-search grava um SHIM em `clinical_outcomes` derivado de
 * conditions ({condition, relationship, efficacy, treatability_score}).
 * Esse shape não tem os campos estatísticos que a UI renderiza — tratá-lo
 * como conteúdo faz o card sair em branco. Espelha `isClinicalOutcomeShim`
 * em `supabase/functions/_shared/analysisDataMerge.ts`.
 */
export function isClinicalOutcomeShim(v: unknown): boolean {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const o = item as Record<string, unknown>;
    return o.outcome === undefined && o.condition !== undefined;
  });
}

function hasOwnedContent(key: string, v: unknown): boolean {
  if (!hasContent(v)) return false;
  if (key === 'clinical_outcomes' || key === 'clinicalOutcomes') {
    return !isClinicalOutcomeShim(v);
  }
  return true;
}

export type RichStudyData = {
  clinicalOutcomes: ClinicalOutcome[];
  molecularMechanisms: any[];
  hierarchicalRelations: any[];
  synergies: any[];
  detailedSideEffects: any[];
  extractionStages: Record<string, unknown> | null;

  extractedNutraceuticals: any[];
  extractedConditions: any[];
  extractedInteractions: any[];
  extractedSideEffects: any[];
  structuredDosages: any[];
  studyPopulation: any;
  biomarkers: any[];
  biologicalEffects: any[];
  studySummary: any;
  studyAssessment: any;
  qualityScore: number | null;
  relevanceScore: number | null;
  noveltyScore: number | null;

  source: { extract: 'extracted_data' | 'analysis_data' | 'none' };
};

export function buildRichStudyData(
  estudo: any,
  extraction: { extracted_data?: any } | null,
): RichStudyData {
  const analysisData = (estudo?.analysis_data || {}) as Record<string, any>;
  const extracted = (extraction?.extracted_data || null) as Record<string, any> | null;

  const extractedHasAny =
    !!extracted &&
    Object.keys(EXTRACT_OWNED_SNAKE_TO_CAMEL).some((snake) => hasContent(extracted[snake]));

  let extractSource: RichStudyData['source']['extract'] = 'none';
  const extractOwned: Record<string, any> = {};

  if (extractedHasAny && extracted) {
    extractSource = 'extracted_data';
    for (const [snake, camel] of Object.entries(EXTRACT_OWNED_SNAKE_TO_CAMEL)) {
      const v = extracted[snake];
      extractOwned[camel] = v ?? (camel === 'extractionStages' ? null : []);
    }
  } else {
    const fallbackHasAny = EXTRACT_OWNED_CAMEL_KEYS.some((c) => hasContent(analysisData[c]));
    if (fallbackHasAny) extractSource = 'analysis_data';
    for (const camel of EXTRACT_OWNED_CAMEL_KEYS) {
      const v = analysisData[camel];
      extractOwned[camel] = v ?? (camel === 'extractionStages' ? null : []);
    }
  }

  return {
    clinicalOutcomes: (extractOwned.clinicalOutcomes as ClinicalOutcome[]) || [],
    molecularMechanisms: extractOwned.molecularMechanisms || [],
    hierarchicalRelations: extractOwned.hierarchicalRelations || [],
    synergies: extractOwned.synergies || [],
    detailedSideEffects: extractOwned.detailedSideEffects || [],
    extractionStages: extractOwned.extractionStages || null,

    extractedNutraceuticals: analysisData.extractedNutraceuticals || [],
    extractedConditions: analysisData.extractedConditions || [],
    extractedInteractions: analysisData.extractedInteractions || [],
    extractedSideEffects: analysisData.extractedSideEffects || [],
    structuredDosages: analysisData.structured_dosages || [],
    studyPopulation: analysisData.study_population || null,
    biomarkers: analysisData.biomarkers || [],
    biologicalEffects: analysisData.biological_effects || [],
    studySummary: analysisData.study_summary || analysisData.studySummary || null,
    studyAssessment: analysisData.study_assessment || analysisData.studyAssessment || null,
    qualityScore: typeof analysisData.qualityScore === 'number' ? analysisData.qualityScore : null,
    relevanceScore: typeof analysisData.relevanceScore === 'number' ? analysisData.relevanceScore : null,
    noveltyScore: typeof analysisData.noveltyScore === 'number' ? analysisData.noveltyScore : null,

    source: { extract: extractSource },
  };
}

export function shouldShowAnchoredMechanism(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim().toLowerCase();
  return s.length > 0 && s !== 'none';
}