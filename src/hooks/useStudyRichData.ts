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
import { buildRichStudyData, type RichStudyData } from './useStudyRichData.pure';

// Reexporta o núcleo puro para que callers continuem importando daqui.
export {
  EXTRACT_OWNED_SNAKE_TO_CAMEL,
  buildRichStudyData,
  shouldShowAnchoredMechanism,
  type RichStudyData,
} from './useStudyRichData.pure';

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