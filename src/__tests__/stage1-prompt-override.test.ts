import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildStage1UserPrompt } from '../../supabase/functions/_shared/writerConsistency';

// Cópia exata de ai_configurations.prompt_extraction_stage1_user (Contrato A2).
// O aceite confere por SQL (length + md5) que o banco é idêntico a este arquivo.
const value = readFileSync(
  resolve(__dirname, 'fixtures/prompt_extraction_stage1_user.txt'),
  'utf8',
);

const EXAMPLE_TERMS = [
  'astaxanthin', 'osteoarthritis', '0.5 mg/kg', 'affected with osteoarthritis',
  'AST"', '3,3-dihydroxy', 'C40H52O4', 'canine', 'musculoskeletal', 'moderate',
  'labrador', '12M/12F', '"adult"', ': 24',
];

describe('prompt_extraction_stage1_user (Contrato A2)', () => {
  it('contém {{TEXT_CONTENT}} exatamente uma vez', () => {
    expect(value.split('{{TEXT_CONTENT}}').length - 1).toBe(1);
  });

  it('não contém nenhum termo de exemplo', () => {
    const lower = value.toLowerCase();
    for (const t of EXAMPLE_TERMS) expect(lower).not.toContain(t.toLowerCase());
  });

  it('buildStage1UserPrompt não sinaliza placeholder ausente e injeta o texto', () => {
    const doc = 'ARTICLE BODY ursolic acid';
    const { prompt, placeholderMissing } = buildStage1UserPrompt(value, doc);
    expect(placeholderMissing).toBe(false);
    expect(prompt).toContain(doc);
    expect(prompt).not.toContain('{{TEXT_CONTENT}}');
  });
});
