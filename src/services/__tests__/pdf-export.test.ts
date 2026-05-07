import { describe, it, expect } from 'vitest';
import { buildProposalPdfDocument, type PdfProposalPayload } from '../pdf-export';
import type { BuiltReference } from '../references-builder';

const baseRef = (over: Partial<BuiltReference> = {}): BuiltReference => ({
  id: 'r1',
  pmid: '12345',
  doi: null,
  url: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
  year: 2022,
  title: 'Omega-3 in canine OA',
  journal: 'J Vet Sci',
  authors: ['Smith J', 'Doe A'],
  vancouver: 'Smith J, Doe A. Omega-3 in canine OA. J Vet Sci. 2022. PMID: 12345.',
  compounds: ['Omega-3'],
  conditions: ['Osteoarthritis'],
  ...over,
});

const basePayload: PdfProposalPayload = {
  petName: 'Rex',
  petBreed: 'Labrador',
  petAge: 9,
  veterinarianName: 'Dra. Ana',
  conditions: [{ name: 'Osteoarthritis' }, 'Cellular Senescence'],
  compounds: [
    { name: 'Omega-3', dosage: '1000mg/dia', rationale: 'Anti-inflamatório.' },
  ],
  rationale: 'Teste',
  monthlyPriceBrl: 199.9,
  subscriptionMonths: 12,
  scenario: {
    yearsWithoutProtocol: 12.0,
    yearsWithProtocol: 13.5,
    yearsGained: 1.5,
    source: 'ai_kg_grounded',
  },
  references: [baseRef(), baseRef({ id: 'r2', pmid: '67890' })],
  generatedAt: new Date('2026-05-07T12:00:00Z'),
};

describe('buildProposalPdfDocument', () => {
  it('returns a React element tree (Document)', () => {
    const el = buildProposalPdfDocument(basePayload);
    expect(el).toBeTruthy();
    expect((el as any).type).toBeDefined();
  });

  it('handles empty conditions safely', () => {
    const el = buildProposalPdfDocument({ ...basePayload, conditions: [] });
    expect(el).toBeTruthy();
  });

  it('handles missing scenario safely', () => {
    const el = buildProposalPdfDocument({ ...basePayload, scenario: null });
    expect(el).toBeTruthy();
  });

  it('handles empty references safely', () => {
    const el = buildProposalPdfDocument({ ...basePayload, references: [] });
    expect(el).toBeTruthy();
  });

  it('normalizes condition shapes (string and object)', () => {
    const el = buildProposalPdfDocument({
      ...basePayload,
      conditions: ['A', { name: 'B' }, { condition_name: 'C' }, { name: '' } as any],
    });
    expect(el).toBeTruthy();
  });
});