import { describe, it, expect } from 'vitest';
import {
  compareWriters,
  buildStage1UserPrompt,
  filterEntitiesInText,
  normalizeEntityName,
} from '../../supabase/functions/_shared/writerConsistency';

describe('compareWriters', () => {
  it('caso real e3b79d33: PDF atrofia x Stage 1 osteoartrite → conflict', () => {
    const r = compareWriters({
      pdfConditions: [{ name: 'Age-Related Skeletal Muscle Atrophy' }],
      pdfNutraceuticals: [{ name: 'Ursolic Acid' }],
      stage1Conditions: [{ name: 'Osteoarthritis' }],
      stage1Nutraceuticals: [{ name: 'Astaxanthin' }],
    });
    expect(r.status).toBe('conflict');
    expect(r.conditions.status).toBe('conflict');
    expect(r.pdf).toContain('Age-Related Skeletal Muscle Atrophy');
    expect(r.stage1).toContain('Osteoarthritis');
  });

  it('sobreposição parcial → ok', () => {
    const r = compareWriters({
      pdfConditions: [{ name: 'Muscle Atrophy' }, { name: 'Sarcopenia' }],
      pdfNutraceuticals: [],
      stage1Conditions: [{ name: 'muscle atrophy' }, { name: 'Obesity' }],
      stage1Nutraceuticals: [],
    });
    expect(r.status).toBe('ok');
  });

  it('variação de grafia/acentos → ok', () => {
    const r = compareWriters({
      pdfConditions: [{ name: 'Age-related skeletal muscle atrophy' }],
      pdfNutraceuticals: [],
      stage1Conditions: [{ name: 'Skeletal Muscle Atrophy' }],
      stage1Nutraceuticals: [],
    });
    expect(r.status).toBe('ok');
  });

  it('uma lista vazia → insufficient', () => {
    const r = compareWriters({
      pdfConditions: [{ name: 'X' }], pdfNutraceuticals: [],
      stage1Conditions: [], stage1Nutraceuticals: [],
    });
    expect(r.status).toBe('insufficient');
  });
});

describe('guarda anti-placeholder', () => {
  const text = 'Dogs received ursolic acid (UA) for age-related skeletal muscle atrophy.';

  it('descarta entidades que não estão no texto', () => {
    const { kept, dropped } = filterEntitiesInText(
      [{ name: 'Ursolic Acid' }, { name: 'Astaxanthin' }], text);
    expect(kept.map((k) => k.name)).toEqual(['Ursolic Acid']);
    expect(dropped).toEqual(['Astaxanthin']);
  });

  it('anexa o documento quando o prompt não tem marcador', () => {
    const r = buildStage1UserPrompt('Extract entities.', text);
    expect(r.placeholderMissing).toBe(true);
    expect(r.prompt).toContain(text);
  });

  it('substitui o marcador quando existe', () => {
    const r = buildStage1UserPrompt('Doc: {{TEXT_CONTENT}}', 'abc');
    expect(r).toEqual({ prompt: 'Doc: abc', placeholderMissing: false });
  });

  it('normaliza acentos e pontuação', () => {
    expect(normalizeEntityName('Ácido  Ursólico!')).toBe('acido ursolico');
  });
});
