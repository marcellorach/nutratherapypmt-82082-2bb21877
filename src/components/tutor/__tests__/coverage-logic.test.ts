import { describe, it, expect } from 'vitest';
import type { AICoverageEntry } from '@/hooks/usePetTrajectoryProjection';

// Mirrors the logic in TreatmentProposalCard for the KG-coverage badges.
// Kept as a pure helper test so it runs in node env without jsdom.
function buildCoverageMap(list: AICoverageEntry[]) {
  const map = new Map<string, AICoverageEntry>();
  for (const c of list) map.set((c.condition || '').toLowerCase().trim(), c);
  return map;
}

function countCovered(conditions: any[], coverage: AICoverageEntry[]) {
  const map = buildCoverageMap(coverage);
  return conditions.reduce((acc, c) => {
    const name = (c?.name || c?.condition_name || (typeof c === 'string' ? c : '')).toLowerCase().trim();
    return acc + (map.get(name)?.kg_covered ? 1 : 0);
  }, 0);
}

describe('TreatmentProposalCard coverage logic', () => {
  const coverage: AICoverageEntry[] = [
    { condition: 'Osteoarthritis', kg_covered: true, supporting_compounds: ['omega_3'] },
    { condition: 'Cellular Senescence', kg_covered: true, supporting_compounds: ['NMN'] },
    { condition: 'Pulmonary Hypertension', kg_covered: false },
  ];

  it('counts covered conditions across mixed shapes (string / object)', () => {
    const conditions = [
      { name: 'Osteoarthritis' },
      { condition_name: 'Cellular Senescence' },
      'Pulmonary Hypertension',
    ];
    expect(countCovered(conditions, coverage)).toBe(2);
  });

  it('matches case-insensitively and trims whitespace', () => {
    const conditions = [{ name: '  osteoarthritis  ' }];
    expect(countCovered(conditions, coverage)).toBe(1);
  });

  it('returns 0 when coverage list is empty', () => {
    expect(countCovered([{ name: 'Osteoarthritis' }], [])).toBe(0);
  });

  it('does not count conditions absent from coverage list', () => {
    const conditions = [{ name: 'Unknown Disease' }];
    expect(countCovered(conditions, coverage)).toBe(0);
  });

  it('does not count gap conditions even when present', () => {
    const conditions = [{ name: 'Pulmonary Hypertension' }];
    expect(countCovered(conditions, coverage)).toBe(0);
  });
});
