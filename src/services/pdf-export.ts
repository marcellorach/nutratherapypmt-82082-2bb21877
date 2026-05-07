/**
 * Sprint 6 — PDF export of the treatment proposal.
 *
 * Pure-ish module: receives a fully-resolved proposal payload and produces a
 * Blob with @react-pdf/renderer. Kept free of React component imports so it
 * can be unit-tested in Node (vitest) without a DOM.
 *
 * No mock data: every section only renders when the underlying field exists.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import React from 'react';
import type { BuiltReference } from './references-builder';

export interface PdfProposalPayload {
  petName: string;
  petBreed: string;
  petAge: number;
  veterinarianName: string;
  createdAt?: string | null;
  conditions: Array<{ name?: string; condition_name?: string; severity?: string } | string>;
  compounds: Array<{ name?: string; dosage?: string; rationale?: string }>;
  rationale?: string | null;
  monthlyPriceBrl: number;
  subscriptionMonths: number;
  scenario?: {
    yearsWithoutProtocol?: number | null;
    yearsWithProtocol?: number | null;
    yearsGained?: number | null;
    source?: 'ai_kg_grounded' | 'heuristic_fallback' | string | null;
  } | null;
  references: BuiltReference[];
  generatedAt?: Date;
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0F172A' },
  header: { borderBottom: '1pt solid #94A3B8', paddingBottom: 8, marginBottom: 14 },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: '#475569' },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 14, marginBottom: 6, color: '#1E293B' },
  h3: { fontSize: 11, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  p: { fontSize: 10, lineHeight: 1.45, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  badge: {
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    marginRight: 4,
    marginBottom: 4,
  },
  scenarioRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  scenarioCard: {
    flex: 1,
    border: '1pt solid #CBD5E1',
    borderRadius: 4,
    padding: 8,
  },
  scenarioLabel: { fontSize: 8, color: '#64748B', marginBottom: 2 },
  scenarioValue: { fontSize: 14, fontWeight: 700 },
  compoundItem: { marginBottom: 6 },
  refItem: { marginBottom: 6 },
  citation: { color: '#475569' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#64748B',
    borderTop: '1pt solid #CBD5E1',
    paddingTop: 4,
    textAlign: 'center',
  },
});

const conditionName = (c: any): string =>
  typeof c === 'string' ? c : c?.name || c?.condition_name || '';

export const buildProposalPdfDocument = (
  payload: PdfProposalPayload,
): React.ReactElement => {
  const generatedAt = payload.generatedAt || new Date();
  const totalAnnual = payload.monthlyPriceBrl * payload.subscriptionMonths;
  const conditions = (payload.conditions || []).map(conditionName).filter(Boolean);
  const compounds = (payload.compounds || []).filter((c) => c?.name);
  const refs = payload.references || [];

  return React.createElement(
    Document,
    { title: `Protocolo — ${payload.petName}` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        React.createElement(Text, { style: styles.h1 }, `Protocolo de Longevidade — ${payload.petName}`),
        React.createElement(
          Text,
          { style: styles.meta },
          `${payload.petBreed} • ${payload.petAge} anos • Vet. responsável: ${payload.veterinarianName}`,
        ),
      ),
      // Conditions
      React.createElement(Text, { style: styles.h2 }, 'Condições clínicas'),
      conditions.length === 0
        ? React.createElement(Text, { style: styles.p }, 'Sem condições registradas.')
        : React.createElement(
            View,
            { style: styles.badgeRow },
            ...conditions.map((c, i) =>
              React.createElement(Text, { key: `c-${i}`, style: styles.badge }, c),
            ),
          ),
      // Scenario
      payload.scenario &&
        React.createElement(
          View,
          {},
          React.createElement(Text, { style: styles.h2 }, 'Cenário comparado (Gêmeo Digital)'),
          React.createElement(
            View,
            { style: styles.scenarioRow },
            React.createElement(
              View,
              { style: styles.scenarioCard },
              React.createElement(Text, { style: styles.scenarioLabel }, 'Sem o protocolo'),
              React.createElement(
                Text,
                { style: styles.scenarioValue },
                payload.scenario.yearsWithoutProtocol != null
                  ? `${payload.scenario.yearsWithoutProtocol.toFixed(1)} anos`
                  : '—',
              ),
            ),
            React.createElement(
              View,
              { style: styles.scenarioCard },
              React.createElement(Text, { style: styles.scenarioLabel }, 'Com o protocolo'),
              React.createElement(
                Text,
                { style: styles.scenarioValue },
                payload.scenario.yearsWithProtocol != null
                  ? `${payload.scenario.yearsWithProtocol.toFixed(1)} anos`
                  : '—',
              ),
            ),
          ),
          payload.scenario.yearsGained != null &&
            React.createElement(
              Text,
              { style: styles.p },
              `Anos ganhados projetados: ${payload.scenario.yearsGained > 0 ? '+' : ''}${payload.scenario.yearsGained.toFixed(1)} (fonte: ${
                payload.scenario.source === 'ai_kg_grounded' ? 'Gêmeo Digital ancorado no KG' : 'Estimativa heurística'
              }).`,
            ),
        ),
      // Compounds
      React.createElement(Text, { style: styles.h2 }, 'Compostos recomendados'),
      ...compounds.map((c, i) =>
        React.createElement(
          View,
          { key: `cp-${i}`, style: styles.compoundItem },
          React.createElement(Text, { style: styles.h3 }, c.name as string),
          c.dosage && React.createElement(Text, { style: styles.p }, `Posologia: ${c.dosage}`),
          c.rationale && React.createElement(Text, { style: styles.p }, c.rationale as string),
        ),
      ),
      // Rationale
      payload.rationale &&
        React.createElement(
          View,
          {},
          React.createElement(Text, { style: styles.h2 }, 'Racional clínico'),
          React.createElement(Text, { style: styles.p }, payload.rationale),
        ),
      // Pricing
      React.createElement(Text, { style: styles.h2 }, 'Investimento'),
      React.createElement(
        Text,
        { style: styles.p },
        `R$ ${payload.monthlyPriceBrl.toFixed(2).replace('.', ',')}/mês • ${payload.subscriptionMonths} meses • Total: R$ ${totalAnnual.toFixed(2).replace('.', ',')}`,
      ),
      // References (Vancouver)
      refs.length > 0 &&
        React.createElement(
          View,
          {},
          React.createElement(Text, { style: styles.h2 }, `Referências científicas (${refs.length})`),
          ...refs.map((r, i) =>
            React.createElement(
              View,
              { key: r.id, style: styles.refItem },
              React.createElement(
                Text,
                { style: styles.p },
                `[${i + 1}] ${r.vancouver}${r.pmid ? '' : ''}`,
              ),
            ),
          ),
        ),
      // Footer
      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        `Gerado em ${generatedAt.toLocaleString('pt-BR')} — VetGraphRAG · Lovable Cloud`,
      ),
    ),
  );
};

export const exportProposalToPdfBlob = async (
  payload: PdfProposalPayload,
): Promise<Blob> => {
  const doc = buildProposalPdfDocument(payload);
  return await pdf(doc as any).toBlob();
};

export const downloadProposalPdf = async (
  payload: PdfProposalPayload,
  filename?: string,
): Promise<void> => {
  const blob = await exportProposalToPdfBlob(payload);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename ||
    `protocolo-${payload.petName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Suppress unused import lint when Font is not used directly
void Font;