/**
 * useStudyRichData — leitor oficial de Stage 3 "extract-owned" + passthrough
 * de campos "gemini-owned". Espelha o contrato de ownership de
 * `supabase/functions/_shared/analysisDataMerge.ts` (EXTRACT_OWNED_ANALYSIS
 * e GEMINI_OWNED_ANALYSIS).
 *
 * Por que existe: o escritor (extract-study-entities) preenche os campos
 * extract-owned tanto em `study_extractions.extracted_data` (snake_case)
 * quanto em `processed_studies.analysis_data` (camelCase). Para estudos
 * legados (~31), o caminho `analysis_data` está vazio nesses campos mas o
 * `extracted_data` está íntegro. Este hook lê o caminho rico e cai para
 * `analysis_data` quando necessário — sem reprocessar nada.
 *
 * Regra TUDO-OU-NADA na camada extract-owned por estudo: se algum campo
 * extract-owned tem conteúdo em `extracted_data`, TODOS os extract-owned
 * vêm de lá; caso contrário, TODOS vêm de `analysis_data` (fallback).
 *
 * Campos gemini-owned (`extractedNutraceuticals`, `studySummary`,
 * `studyAssessment`, `structured_dosages`, `study_population`, `biomarkers`,
 * `biological_effects`, scores) NUNCA passam pelo adapter snake→camel e
 * são SEMPRE lidos de `analysis_data`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClinicalOutcome } from '@/types/vetgraphrag';

/**
 * Mapa snake→camel APENAS das chaves de topo extract-owned. Itens dentro
 * dos arrays permanecem em snake_case (assim como o resto da UI já consome:
 * `outcome.outcome_type`, `mech.downstream_effects`, etc).
 *
 * Espelho de EXTRACT_OWNED_ANALYSIS em
 * supabase/functions/_shared/analysisDataMerge.ts — manter os dois sincronizados.
 */
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

export type RichStudyData = {
  // extract-owned (chaves camel no topo, itens em snake)
  clinicalOutcomes: ClinicalOutcome[];
  molecularMechanisms: any[];
  hierarchicalRelations: any[];
  synergies: any[];
  detailedSideEffects: any[];
  extractionStages: Record<string, unknown> | null;

  // gemini-owned (passthrough de analysis_data)
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

  // proveniência da camada extract-owned
  source: { extract: 'extracted_data' | 'analysis_data' | 'none' };
};

/**
 * Função pura — testável sem React/Query. O hook abaixo é só um thin wrapper
 * que injeta o resultado do fetch.
 */
export function buildRichStudyData(
  estudo: any,
  extraction: { extracted_data?: any } | null,
): RichStudyData {
  const analysisData = (estudo?.analysis_data || {}) as Record<string, any>;
  const extracted = (extraction?.extracted_data || null) as Record<string, any> | null;

  // Regra tudo-ou-nada: extracted_data ganha se QUALQUER campo extract-owned
  // tiver conteúdo lá. Senão, fallback total para analysis_data.
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

/**
 * Decide se o badge de mecanismo ancorado deve ser renderizado para um
 * outcome. "none" (case-insensitive, com trim) → não mostrar. String vazia /
 * undefined / não-string → não mostrar. Qualquer outra string → mostrar.
 */
export function shouldShowAnchoredMechanism(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim().toLowerCase();
  return s.length > 0 && s !== 'none';
}

/**
 * Hook leitor por ownership. Centraliza o snake↔camel e o fallback.
 * Todo componente que precisar de Stage 3 ou de campos gemini-owned ricos
 * deve consumir este hook ao invés de ler `analysis_data` direto.
 */
export function useStudyRichData(estudo: any): RichStudyData {
  const { data: extraction } = useQuery({
    queryKey: ['study-extraction-rich', estudo?.id],
    queryFn: async () => {
      if (!estudo?.id) return null;
      const { data, error } = await supabase
        .from('study_extractions')
        .select('extracted_data')
        .eq('study_id', estudo.id)
        .maybeSingle();
      if (error) {
        console.error('[useStudyRichData] fetch error:', error);
        return null;
      }
      return data || null;
    },
    enabled: !!estudo?.id,
    staleTime: 60_000,
  });

  return buildRichStudyData(estudo, extraction || null);
}