import { describe, it, expect } from 'vitest';

// Replicates the subgraph condition/compound derivation logic used by
// TreatmentProposalCard before passing data to PatientKnowledgeSubgraph.
function deriveConditions(conditions: any[]): string[] {
  return (conditions || [])
    .map((c: any) => (typeof c === 'string' ? c : c?.name || c?.condition_name))
    .filter(Boolean);
}
function deriveCompounds(compounds: any[]): string[] {
  return (compounds || []).map((c: any) => c?.name).filter(Boolean);
}
function shouldRender(triplets: any[], pathways: any[]) {
  return triplets.length > 0 || pathways.length > 0;
}

describe('subgraph derivation', () => {
  it('extracts condition names from mixed shapes', () => {
    expect(deriveConditions([
      'Osteoarthritis',
      { name: 'Cellular Senescence' },
      { condition_name: 'Renal Failure' },
      null,
    ])).toEqual(['Osteoarthritis', 'Cellular Senescence', 'Renal Failure']);
  });
  it('extracts compound names', () => {
    expect(deriveCompounds([{ name: 'NMN' }, { name: 'Curcumin' }, {}]))
      .toEqual(['NMN', 'Curcumin']);
  });
  it('hides subgraph when no triplets and no pathways', () => {
    expect(shouldRender([], [])).toBe(false);
  });
  it('renders subgraph when triplets exist', () => {
    expect(shouldRender([{ subject: 'a' }], [])).toBe(true);
  });
  it('renders subgraph when pathways exist', () => {
    expect(shouldRender([], [{ steps: [] }])).toBe(true);
  });
  it('handles empty / undefined inputs safely', () => {
    expect(deriveConditions(undefined as any)).toEqual([]);
    expect(deriveCompounds(undefined as any)).toEqual([]);
  });
});
