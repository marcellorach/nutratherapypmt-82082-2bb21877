import { describe, it, expect } from 'vitest';
import {
  buildReferences,
  filterReferences,
  formatVancouver,
  RawStudy,
} from '../references-builder';

const sample = (over: Partial<RawStudy> = {}): RawStudy => ({
  id: over.id || 'id-' + Math.random(),
  title: 'A randomized trial of NMN in dogs',
  authors: 'Smith J; Doe A',
  journal: 'GeroScience',
  year: 2024,
  pmid: '12345678',
  doi: '10.1000/abc',
  link: null,
  ...over,
});

describe('references-builder', () => {
  it('deduplicates by PMID across multiple rows', () => {
    const rows = [
      sample({ id: 'a', pmid: '111' }),
      sample({ id: 'b', pmid: '111', title: 'Different title' }),
      sample({ id: 'c', pmid: '222' }),
    ];
    const out = buildReferences(rows);
    expect(out).toHaveLength(2);
  });

  it('falls back to DOI when PMID is missing', () => {
    const rows = [
      sample({ id: 'a', pmid: null, doi: '10.1/x' }),
      sample({ id: 'b', pmid: null, doi: '10.1/X' }), // case-insensitive
    ];
    const out = buildReferences(rows);
    expect(out).toHaveLength(1);
  });

  it('sorts newer year first', () => {
    const out = buildReferences([
      sample({ id: 'a', pmid: '1', year: 2018 }),
      sample({ id: 'b', pmid: '2', year: 2024 }),
      sample({ id: 'c', pmid: '3', year: 2020 }),
    ]);
    expect(out.map((r) => r.year)).toEqual([2024, 2020, 2018]);
  });

  it('produces a Vancouver-style citation with PMID', () => {
    const [r] = buildReferences([sample()]);
    expect(r.vancouver).toContain('Smith J');
    expect(r.vancouver).toContain('GeroScience');
    expect(r.vancouver).toContain('PMID: 12345678');
    expect(r.vancouver).toContain('2024');
  });

  it('truncates author list at 6 with "et al."', () => {
    const r = formatVancouver({
      id: 'x',
      pmid: null,
      doi: null,
      url: null,
      year: 2024,
      title: 'T',
      journal: 'J',
      authors: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
      vancouver: '',
      compounds: [],
      conditions: [],
    });
    expect(r).toContain('et al.');
    expect(r).toContain('A6');
    expect(r).not.toContain('A7');
  });

  it('builds canonical URL from PMID when link missing', () => {
    const [r] = buildReferences([sample({ pmid: '999', link: null })]);
    expect(r.url).toBe('https://pubmed.ncbi.nlm.nih.gov/999/');
  });

  it('merges compound/condition tags across duplicate PMIDs', () => {
    const out = buildReferences([
      sample({ id: 'a', pmid: '5', _compounds: ['NMN'], _conditions: ['OA'] }),
      sample({ id: 'b', pmid: '5', _compounds: ['Curcumin'], _conditions: ['OA'] }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].compounds.sort()).toEqual(['Curcumin', 'NMN']);
    expect(out[0].conditions).toEqual(['OA']);
  });

  it('filterReferences matches title, author, compound, condition and PMID', () => {
    const refs = buildReferences([
      sample({ id: 'a', pmid: '111', title: 'Curcumin and inflammation', _compounds: ['Curcumin'] }),
      sample({ id: 'b', pmid: '222', title: 'NMN longevity study', _compounds: ['NMN'] }),
    ]);
    expect(filterReferences(refs, 'curcumin')).toHaveLength(1);
    expect(filterReferences(refs, '222')).toHaveLength(1);
    expect(filterReferences(refs, 'Smith')).toHaveLength(2);
    expect(filterReferences(refs, '')).toHaveLength(2);
    expect(filterReferences(refs, 'no-match')).toHaveLength(0);
  });

  it('returns empty array for empty input without throwing', () => {
    expect(buildReferences([])).toEqual([]);
    expect(buildReferences(undefined as any)).toEqual([]);
  });
});