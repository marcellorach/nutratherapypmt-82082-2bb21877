/**
 * Axis-1 regression: deep-merge with ownership for analysis_data &
 * extracted_data must not drop gemini-rich keys when extract-study-entities
 * runs afterwards.
 *
 * Fixtures come from the LIVE BACKUP captured in
 *   public.processed_studies_backup_axis1
 *   public.study_extractions_backup_axis1
 * for studies 91aefb05 (gemini-rich) and 5e1fcad9 (extract-only).
 */
import { describe, it, expect } from 'vitest';
import {
  mergeAnalysisData,
  mergeExtractedData,
} from '../../supabase/functions/_shared/analysisDataMerge';

import gemAnalysis from './fixtures/axis1/91aefb05.analysis_data.json';
import gemExtracted from './fixtures/axis1/91aefb05.extracted_data.json';
import extAnalysis from './fixtures/axis1/5e1fcad9.analysis_data.json';
import extExtracted from './fixtures/axis1/5e1fcad9.extracted_data.json';

/**
 * Simulated frontendData produced by extract-study-entities. We use the
 * extract-only study (5e1fcad9) as a stand-in for what extract would write
 * on the second pass against the gemini-rich study (91aefb05).
 */
const simulatedExtractFrontendData = {
  ...extAnalysis,
  // Force extract's hardcoded score fallback to prove gemini's real score wins.
  qualityScore: 3,
  relevanceScore: 3,
};

describe('axis1 deep-merge — analysis_data', () => {
  const before = Object.keys(gemAnalysis).sort();
  const merged = mergeAnalysisData(gemAnalysis, simulatedExtractFrontendData);
  const after = Object.keys(merged).sort();

  it('logs BEFORE/AFTER key counts for 91aefb05', () => {
    // eslint-disable-next-line no-console
    console.log('[axis1-test] 91aefb05 analysis_data BEFORE keys:', before.length, before);
    // eslint-disable-next-line no-console
    console.log('[axis1-test] 91aefb05 analysis_data AFTER  keys:', after.length, after);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  it('preserves every gemini-rich key (none deleted)', () => {
    const RICH_KEYS = [
      'extractedEffects',
      'extractedMechanisms',
      'extractedSynergies',
      'extractedContraindications',
      'extractedDrugInteractions',
      'extraction_summary',
      'biological_effects',
      'biomarkers',
      'structured_dosages',
      'study_population',
      'study_summary',
      'study_assessment',
    ];
    for (const k of RICH_KEYS) {
      if (k in (gemAnalysis as any)) {
        expect(merged, `lost gemini key: ${k}`).toHaveProperty(k);
      }
    }
  });

  it('keeps the rich shape of extractedNutraceuticals (>=4 fields)', () => {
    const arr = (merged as any).extractedNutraceuticals;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBeGreaterThan(0);
    const first = arr[0];
    const richFieldCount = Object.keys(first).length;
    expect(richFieldCount, `extractedNutraceuticals[0] degraded to ${JSON.stringify(first)}`).toBeGreaterThanOrEqual(4);
  });

  it('preserves gemini noveltyScore and never lets extract overwrite with 3', () => {
    expect((merged as any).noveltyScore).toBe((gemAnalysis as any).noveltyScore);
    // qualityScore should be the LLM-derived value, not extract's hardcoded 3.
    const gemQ = (gemAnalysis as any).qualityScore;
    if (typeof gemQ === 'number' && gemQ > 0) {
      expect((merged as any).qualityScore).toBe(gemQ);
    }
  });

  it('writes extract-owned keys (molecularMechanisms, clinicalOutcomes, extractionStages)', () => {
    expect(merged).toHaveProperty('molecularMechanisms');
    expect(merged).toHaveProperty('clinicalOutcomes');
    expect(merged).toHaveProperty('extractionStages');
  });

  it('appends + dedups contraindications across both sources', () => {
    const gemC = Array.isArray((gemAnalysis as any).contraindications) ? (gemAnalysis as any).contraindications : [];
    const extC = Array.isArray((simulatedExtractFrontendData as any).contraindications) ? (simulatedExtractFrontendData as any).contraindications : [];
    const got = (merged as any).contraindications;
    expect(Array.isArray(got)).toBe(true);
    expect(got.length).toBeGreaterThanOrEqual(Math.max(gemC.length, extC.length));
  });
});

describe('axis1 deep-merge — analysis_data (extract-only baseline)', () => {
  it('5e1fcad9 (no gemini) → extract output flows through with extract-owned keys', () => {
    const merged = mergeAnalysisData({}, extAnalysis);
    expect(merged).toHaveProperty('molecularMechanisms');
    expect(merged).toHaveProperty('clinicalOutcomes');
    expect(merged).toHaveProperty('extractionStages');
    // eslint-disable-next-line no-console
    console.log('[axis1-test] 5e1fcad9 analysis_data merged keys:', Object.keys(merged).length);
  });
});

describe('axis1 deep-merge — study_extractions.extracted_data', () => {
  it('preserves gemini structured_dosages / study_population / biomarkers / study_summary', () => {
    const merged = mergeExtractedData(gemExtracted, extExtracted);
    for (const k of ['structured_dosages', 'study_population', 'biomarkers', 'study_summary']) {
      if (k in (gemExtracted as any)) {
        expect(merged, `lost gemini extracted_data key: ${k}`).toHaveProperty(k);
      }
    }
  });

  it('extract owns clinical_outcomes — protegido por default, substitui só com forceReextract', () => {
    // Novo contrato (onda A+C'): EXTRACT_OWNED_EXTRACTED é protegido de
    // sobrescrita destrutiva quando current já tem conteúdo não-vazio.
    // Sem force → preserva o que já estava (mesmo que seja shim gemini).
    const kept = mergeExtractedData(gemExtracted, extExtracted);
    expect(kept.clinical_outcomes).toEqual((gemExtracted as any).clinical_outcomes ?? undefined);
    // Com force_reextract=true → curador manda ver, extract substitui.
    const forced = mergeExtractedData(gemExtracted, extExtracted, { forceReextract: true });
    expect(forced.clinical_outcomes).toEqual((extExtracted as any).clinical_outcomes);
  });
});

describe('axis1 — hierarchicalRelations ownership (extract → replace)', () => {
  it('mergeAnalysisData preserves hierarchicalRelations from extract output', () => {
    const currentWithGemini = {
      extractedNutraceuticals: [{ name: 'curcumin', confidence: 0.9, x: 1, y: 2 }],
      study_summary: { summary: 'gemini wrote this' },
    };
    const extractOutputWithHR = {
      hierarchicalRelations: [
        { source: 'curcumin', target: 'NRF2', relation_type: 'ACTIVATES' },
        { source: 'NRF2', target: 'antioxidant_response', relation_type: 'UPREGULATES' },
      ],
      molecularMechanisms: [{ name: 'NRF2 activation', action: 'activation' }],
      clinicalOutcomes: [
        { outcome: 'reduced inflammation', outcome_type: 'primary', anchored_mechanism: 'NRF2 activation' },
      ],
    };
    const merged: any = mergeAnalysisData(currentWithGemini, extractOutputWithHR);
    expect(Array.isArray(merged.hierarchicalRelations)).toBe(true);
    expect(merged.hierarchicalRelations).toHaveLength(2);
    expect(merged.hierarchicalRelations[0].relation_type).toBe('ACTIVATES');
    // gemini-owned não pode ter sido apagado
    expect(merged.extractedNutraceuticals[0].name).toBe('curcumin');
    expect(merged.study_summary.summary).toBe('gemini wrote this');
    // extract-owned replace, não merge fantasma
    expect(merged.clinicalOutcomes[0].anchored_mechanism).toBe('NRF2 activation');
  });
});