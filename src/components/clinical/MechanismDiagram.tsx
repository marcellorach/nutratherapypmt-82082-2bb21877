import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MermaidBlock from '@/components/shared/MermaidBlock';

export interface MechanismTriplet {
  subject_name: string;
  predicate: string;
  object_name: string;
  intensity?: string | null;
  direction?: string | null;
  subject_layer?: string | null;
  object_layer?: string | null;
}

interface Props {
  triplets: MechanismTriplet[];
  maxEdges?: number;
}

/** Sanitize a label so it's safe inside a Mermaid node id and bracketed label. */
const safeId = (s: string) =>
  s.replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'n';
const safeLabel = (s: string) => s.replace(/["`\\]/g, '').slice(0, 60);

/** Map predicate to a Mermaid arrow with biological notation. */
const arrowFor = (predicate: string, direction?: string | null): { arrow: string; label: string } => {
  const p = (predicate || '').toUpperCase();
  const dir = (direction || '').toLowerCase();
  // Inhibition / negative
  if (
    /INHIB|SUPPRESS|BLOCK|DOWNREG|REDUCE|DECREASE|ANTAGON|PREVENT/.test(p) ||
    dir === 'inhibits' || dir === 'negative' || dir === 'downregulates'
  ) {
    return { arrow: '-.->|⊣ inibe|', label: predicate };
  }
  if (/ACTIVAT|UPREG|INCREASE|INDUCE|STIMUL|AGON|ENHANC|PROMOT/.test(p)) {
    return { arrow: '==>|→ ativa|', label: predicate };
  }
  if (/TREAT|IMPROVE|MITIGAT|PROTECT/.test(p)) {
    return { arrow: '-->|↓ trata|', label: predicate };
  }
  return { arrow: `-->|${safeLabel(predicate || 'rel')}|`, label: predicate };
};

const MechanismDiagram: React.FC<Props> = ({ triplets, maxEdges = 8 }) => {
  const { t } = useTranslation();
  const code = useMemo(() => {
    const edges = triplets.slice(0, maxEdges);
    if (edges.length === 0) return '';
    const lines: string[] = ['graph LR'];
    const seenNode = new Set<string>();
    for (const e of edges) {
      const sId = safeId(e.subject_name);
      const oId = safeId(e.object_name);
      if (!seenNode.has(sId)) {
        lines.push(`  ${sId}["${safeLabel(e.subject_name)}"]`);
        seenNode.add(sId);
      }
      if (!seenNode.has(oId)) {
        lines.push(`  ${oId}["${safeLabel(e.object_name)}"]`);
        seenNode.add(oId);
      }
      const { arrow } = arrowFor(e.predicate, e.direction);
      lines.push(`  ${sId} ${arrow} ${oId}`);
    }
    return lines.join('\n');
  }, [triplets, maxEdges]);

  if (!code) {
    return (
      <p className="text-[11px] text-gray-500 italic">
        {t('prioritization.multiSource.mechanism.empty', 'Sem mecanismo molecular disponível para esta consulta.')}
      </p>
    );
  }
  return (
    <div className="rounded border bg-white p-2 overflow-x-auto">
      <MermaidBlock code={code} />
      <p className="text-[10px] text-gray-500 mt-1">
        {t('prioritization.multiSource.mechanism.legend', 'Notação: → ativa · ⊣ inibe · ↓ trata. Construído a partir de triplets aprovados do KG.')}
      </p>
    </div>
  );
};

export default MechanismDiagram;