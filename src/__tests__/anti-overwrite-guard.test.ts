/**
 * Onda A+C': anti-overwrite guard para campos EXTRACT_OWNED_*.
 * Regressão contra destrutividade de re-run (21→11) e permissão de fill (0→N).
 */
import { describe, it, expect } from 'vitest';
import {
  mergeAnalysisData,
  mergeExtractedData,
  EXTRACT_OWNED_ANALYSIS,
  EXTRACT_OWNED_EXTRACTED,
} from '../../supabase/functions/_shared/analysisDataMerge';

const mkMechs = (n: number, tag: string) =>
  Array.from({ length: n }, (_, i) => ({ name: `${tag}-mech-${i + 1}`, action: 'activation' }));

describe('anti-overwrite guard — analysis_data (camelCase)', () => {
  it('21 → 11 sem force_reextract → preserva 21', () => {
    const current = { molecularMechanisms: mkMechs(21, 'rich') };
    const incoming = { molecularMechanisms: mkMechs(11, 'poor') };
    const merged = mergeAnalysisData(current, incoming);
    expect(merged.molecularMechanisms).toHaveLength(21);
    expect(merged.molecularMechanisms[0].name).toBe('rich-mech-1');
  });

  it('21 → 11 com force_reextract=true → substitui por 11', () => {
    const current = { molecularMechanisms: mkMechs(21, 'rich') };
    const incoming = { molecularMechanisms: mkMechs(11, 'poor') };
    const merged = mergeAnalysisData(current, incoming, { forceReextract: true });
    expect(merged.molecularMechanisms).toHaveLength(11);
    expect(merged.molecularMechanisms[0].name).toBe('poor-mech-1');
  });

  it('0 → 8 sem force_reextract → preenche com 8 (0→N permitido)', () => {
    const current = { molecularMechanisms: [] };
    const incoming = { molecularMechanisms: mkMechs(8, 'new') };
    const merged = mergeAnalysisData(current, incoming);
    expect(merged.molecularMechanisms).toHaveLength(8);
  });

  it('ausente → 5 sem force_reextract → preenche com 5', () => {
    const current = {};
    const incoming = { molecularMechanisms: mkMechs(5, 'new') };
    const merged = mergeAnalysisData(current, incoming);
    expect(merged.molecularMechanisms).toHaveLength(5);
  });

  it('cobre todas as 6 chaves EXTRACT_OWNED_ANALYSIS', () => {
    for (const key of EXTRACT_OWNED_ANALYSIS) {
      const current = { [key]: [{ marker: 'existing' }] };
      const incoming = { [key]: [{ marker: 'new' }, { marker: 'new2' }] };
      const kept = mergeAnalysisData(current, incoming);
      expect(kept[key]).toEqual([{ marker: 'existing' }]);
      const forced = mergeAnalysisData(current, incoming, { forceReextract: true });
      expect(forced[key]).toHaveLength(2);
    }
  });
});

describe('anti-overwrite guard — extracted_data (snake_case)', () => {
  it('21 → 11 sem force_reextract → preserva 21', () => {
    const current = { molecular_mechanisms: mkMechs(21, 'rich') };
    const incoming = { molecular_mechanisms: mkMechs(11, 'poor') };
    const merged = mergeExtractedData(current, incoming);
    expect(merged.molecular_mechanisms).toHaveLength(21);
  });

  it('21 → 11 com force_reextract=true → substitui', () => {
    const current = { molecular_mechanisms: mkMechs(21, 'rich') };
    const incoming = { molecular_mechanisms: mkMechs(11, 'poor') };
    const merged = mergeExtractedData(current, incoming, { forceReextract: true });
    expect(merged.molecular_mechanisms).toHaveLength(11);
  });

  it('0 → 8 sem force_reextract → preenche', () => {
    const merged = mergeExtractedData(
      { molecular_mechanisms: [] },
      { molecular_mechanisms: mkMechs(8, 'x') },
    );
    expect(merged.molecular_mechanisms).toHaveLength(8);
  });

  it('cobre todas as 6 chaves EXTRACT_OWNED_EXTRACTED', () => {
    for (const key of EXTRACT_OWNED_EXTRACTED) {
      const current = { [key]: [{ marker: 'existing' }] };
      const incoming = { [key]: [{ marker: 'new' }, { marker: 'new2' }] };
      const kept = mergeExtractedData(current, incoming);
      expect(kept[key]).toEqual([{ marker: 'existing' }]);
      const forced = mergeExtractedData(current, incoming, { forceReextract: true });
      expect(forced[key]).toHaveLength(2);
    }
  });
});

describe('paridade dos dois sets EXTRACT_OWNED_*', () => {
  it('camelCase e snake_case cobrem os mesmos 6 campos', () => {
    expect(EXTRACT_OWNED_ANALYSIS.size).toBe(6);
    expect(EXTRACT_OWNED_EXTRACTED.size).toBe(6);
  });
});
