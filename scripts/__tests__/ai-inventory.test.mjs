import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

// Rotinas de IA ainda sem tarefa registrada (Fase 2 do plano de governança).
// Se uma rotina NOVA chamar IA sem ser registrada em src/config/ai-tasks.ts,
// este teste falha. Ao registrar uma daqui, remova-a da lista.
const KNOWN_UNREGISTERED = [
  'analyze-all-cohorts-patterns', 'analyze-cohort-patterns', 'chat-meta-study',
  'check-cohort-originality', 'check-insight-originality', 'evaluate-meta-study-reliability',
  'generate-audit', 'generate-meta-study-cover', 'generate-showcase', 'generate-synthetic-cohort',
  'query-perplexity', 'suggest-cohort-ideas', 'triplet-verification-runner', 'vectorize-study',
];

describe('AI inventory', () => {
  it('generated file is up to date', () => {
    expect(() =>
      execFileSync('node', ['scripts/generate-ai-inventory.mjs', '--check'], { cwd: ROOT, stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('no new AI routine without a registered task', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/data/aiInventory.generated.ts'), 'utf8');
    const rows = JSON.parse(src.split('AI_INVENTORY: AIInventoryRow[] = ')[1].replace(/;\s*$/, ''));
    const unregistered = rows.filter((r) => r.status === 'unregistered').map((r) => r.fn);
    const unexpected = unregistered.filter((fn) => !KNOWN_UNREGISTERED.includes(fn));
    expect(unexpected).toEqual([]);
  });
});
