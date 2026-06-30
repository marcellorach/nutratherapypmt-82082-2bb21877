/**
 * Regression — read-by-ownership do Stage 3.
 * Testa a função pura buildRichStudyData; o hook é thin wrapper sobre ela.
 */
import { describe, it, expect } from 'vitest';
import {
  buildRichStudyData,
  shouldShowAnchoredMechanism,
  EXTRACT_OWNED_SNAKE_TO_CAMEL,
} from '../hooks/useStudyRichData.pure';

describe('buildRichStudyData — extract-owned read paths', () => {
  it('(i) extracted_data rico + analysis_data vazio → lê de extracted_data', () => {
    const estudo = { id: 's1', analysis_data: {} };
    const extraction = {
      extracted_data: {
        molecular_mechanisms: [{ name: 'NRF2 activation', action: 'activation' }],
        clinical_outcomes: [
          { outcome: 'reduced TNF-alpha', outcome_type: 'primary', anchored_mechanism: 'NRF2 activation' },
        ],
        hierarchical_relations: [{ source: 'curcumin', target: 'NRF2', relation_type: 'ACTIVATES' }],
        synergies: [],
      },
    };
    const rich = buildRichStudyData(estudo, extraction);
    expect(rich.source.extract).toBe('extracted_data');
    expect(rich.molecularMechanisms).toHaveLength(1);
    expect(rich.clinicalOutcomes[0].anchored_mechanism).toBe('NRF2 activation');
    // itens internos permanecem snake
    expect(rich.clinicalOutcomes[0].outcome_type).toBe('primary');
    expect(rich.hierarchicalRelations[0].relation_type).toBe('ACTIVATES');
  });

  it('(ii) sem study_extractions + analysis_data cheio → fallback analysis_data', () => {
    const estudo = {
      id: 's2',
      analysis_data: {
        molecularMechanisms: [{ name: 'mTOR inhibition', action: 'inhibition' }],
        clinicalOutcomes: [{ outcome: 'autophagy increase', outcome_type: 'secondary' }],
      },
    };
    const rich = buildRichStudyData(estudo, null);
    expect(rich.source.extract).toBe('analysis_data');
    expect(rich.molecularMechanisms[0].name).toBe('mTOR inhibition');
    expect(rich.clinicalOutcomes[0].outcome).toBe('autophagy increase');
  });

  it('(iii) ambos vazios → arrays vazios e source=none, sem throw', () => {
    const rich = buildRichStudyData({ id: 's3', analysis_data: {} }, null);
    expect(rich.source.extract).toBe('none');
    expect(rich.molecularMechanisms).toEqual([]);
    expect(rich.clinicalOutcomes).toEqual([]);
    expect(rich.hierarchicalRelations).toEqual([]);
    expect(rich.synergies).toEqual([]);
    expect(rich.detailedSideEffects).toEqual([]);
    expect(rich.extractionStages).toBeNull();
  });

  it('(iv) gemini-owned NUNCA é lido de extracted_data — sempre de analysis_data', () => {
    const estudo = {
      id: 's4',
      analysis_data: {
        // intencionalmente vazio em gemini-owned para provar que NÃO vaza do extracted_data
        extractedNutraceuticals: [],
        study_summary: null,
      },
    };
    const extraction = {
      extracted_data: {
        // extracted_data tem "nutraceuticals" — não deve vazar pra extractedNutraceuticals
        nutraceuticals: [{ name: 'curcumin (from extracted_data)' }],
        study_summary: { summary: 'should not leak' },
        molecular_mechanisms: [{ name: 'm1' }],
      },
    };
    const rich = buildRichStudyData(estudo, extraction);
    expect(rich.extractedNutraceuticals).toEqual([]);
    expect(rich.studySummary).toBeNull();
    // sanity: o extract-owned veio mesmo de extracted_data
    expect(rich.source.extract).toBe('extracted_data');
    expect(rich.molecularMechanisms).toHaveLength(1);
  });

  it('mapa snake→camel cobre todos os EXTRACT_OWNED do shared merge', () => {
    // guarda de drift — se alguém adicionar uma chave a EXTRACT_OWNED_ANALYSIS
    // sem refletir aqui, este teste segura pela contagem mínima conhecida.
    expect(Object.keys(EXTRACT_OWNED_SNAKE_TO_CAMEL)).toEqual(
      expect.arrayContaining([
        'molecular_mechanisms',
        'clinical_outcomes',
        'hierarchical_relations',
        'synergies',
        'extraction_stages',
        'detailed_side_effects',
      ]),
    );
  });
});

describe('shouldShowAnchoredMechanism — render do badge', () => {
  it('"NRF2 pathway" → mostra', () => {
    expect(shouldShowAnchoredMechanism('NRF2 pathway')).toBe(true);
  });
  it('"none" / "None" / "  none  " → não mostra (sem erro)', () => {
    expect(shouldShowAnchoredMechanism('none')).toBe(false);
    expect(shouldShowAnchoredMechanism('None')).toBe(false);
    expect(shouldShowAnchoredMechanism('  none  ')).toBe(false);
  });
  it('undefined / null / "" / não-string → não mostra', () => {
    expect(shouldShowAnchoredMechanism(undefined)).toBe(false);
    expect(shouldShowAnchoredMechanism(null)).toBe(false);
    expect(shouldShowAnchoredMechanism('')).toBe(false);
    expect(shouldShowAnchoredMechanism(42)).toBe(false);
    expect(shouldShowAnchoredMechanism({})).toBe(false);
  });
});