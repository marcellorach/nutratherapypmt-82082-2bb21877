import { describe, it, expect } from 'vitest';
import {
  mergeAnalysisDataFromOtherWriter,
  mergeExtractedDataFromOtherWriter,
} from '../../supabase/functions/_shared/analysisDataMerge';

const realOutcomes = [
  { outcome: 'reduced joint pain', type: 'primary', p_value: 0.01, effect_size: 0.42, significance: 'significant' },
];
const shimOutcomes = [
  { condition: 'osteoarthritis', relationship: 'treats', efficacy: 'moderate', treatability_score: 3 },
];

describe('ownership guard for non-extract writers', () => {
  it('preserva Stage 2/3 quando gemini/parse/triplets re-escrevem analysis_data', () => {
    const current = {
      molecularMechanisms: [{ mechanism: 'AMPK activation' }, { mechanism: 'NRF2' }],
      clinicalOutcomes: realOutcomes,
      hierarchicalRelations: [{ a: 1 }],
      extractedNutraceuticals: [{ name: 'curcumin' }],
    };
    const geminiOutput = {
      extractedNutraceuticals: [{ name: 'curcumin', dose: '200mg' }],
      biomarkers: [{ name: 'CRP' }],
      // gemini não deveria mandar isto, mas se mandar não pode apagar
      molecularMechanisms: [],
      clinicalOutcomes: shimOutcomes,
    };

    const merged = mergeAnalysisDataFromOtherWriter(current, geminiOutput);

    expect(merged.molecularMechanisms).toHaveLength(2);
    expect(merged.clinicalOutcomes).toEqual(realOutcomes);
    // campos próprios do escritor são atualizados normalmente
    expect(merged.extractedNutraceuticals[0].dose).toBe('200mg');
    expect(merged.biomarkers).toHaveLength(1);
  });

  it('permite preencher campo extract-owned vazio', () => {
    const merged = mergeAnalysisDataFromOtherWriter(
      { molecularMechanisms: [] },
      { molecularMechanisms: [{ mechanism: 'x' }] },
    );
    expect(merged.molecularMechanisms).toHaveLength(1);
  });

  it('shim atual não bloqueia sobrescrita (não conta como conteúdo)', () => {
    const merged = mergeAnalysisDataFromOtherWriter(
      { clinicalOutcomes: shimOutcomes },
      { clinicalOutcomes: realOutcomes },
    );
    expect(merged.clinicalOutcomes).toEqual(realOutcomes);
  });

  it('extracted_data: preserva clinical_outcomes estatístico do extract', () => {
    const merged = mergeExtractedDataFromOtherWriter(
      { clinical_outcomes: realOutcomes, molecular_mechanisms: [{ m: 1 }] },
      { clinical_outcomes: shimOutcomes, nutraceuticals: [{ name: 'nmn' }] },
    );
    expect(merged.clinical_outcomes).toEqual(realOutcomes);
    expect(merged.molecular_mechanisms).toHaveLength(1);
    expect(merged.nutraceuticals).toHaveLength(1);
  });

  it('parse-study não apaga chaves ricas ao gravar seções', () => {
    const current = { molecularMechanisms: [{ m: 1 }], biomarkers: [{ name: 'ALT' }] };
    const merged = mergeAnalysisDataFromOtherWriter(current, { sections: [], tables: [] });
    expect(merged.molecularMechanisms).toHaveLength(1);
    expect(merged.biomarkers).toHaveLength(1);
    expect(merged.sections).toEqual([]);
  });
});
