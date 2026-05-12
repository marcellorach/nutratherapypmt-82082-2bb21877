import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

export interface AssessmentInterpretationData {
  canonical_conditions?: Array<{ name: string; stage?: string | null; confidence?: number | null }>;
  systems_affected?: string[];
  ontology_refs?: Array<{ system: string; code: string; label?: string | null }>;
}

interface Props {
  data?: AssessmentInterpretationData | null;
}

const AssessmentInterpretation: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  if (!data) return null;
  const cc = data.canonical_conditions ?? [];
  const sys = data.systems_affected ?? [];
  const onto = data.ontology_refs ?? [];
  if (cc.length === 0 && sys.length === 0 && onto.length === 0) return null;

  return (
    <div className="mt-2 rounded-md border border-dashed border-border bg-muted/30 p-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-medium">
        <Brain className="h-3 w-3" />
        {t('assessmentInterpretation.title', { defaultValue: 'Interpretação automática (LLM)' })}
      </p>
      {cc.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cc.map((c, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {c.name}
              {c.stage ? ` · ${c.stage}` : ''}
              {typeof c.confidence === 'number' ? ` · ${(c.confidence * 100).toFixed(0)}%` : ''}
            </Badge>
          ))}
        </div>
      )}
      {sys.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-muted-foreground">
            {t('assessmentInterpretation.systems', { defaultValue: 'Sistemas:' })}
          </span>
          {sys.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
        </div>
      )}
      {onto.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {onto.map((o, i) => (
            <span
              key={i}
              className="text-[10px] text-muted-foreground rounded border border-border px-1.5 py-0.5"
              title={o.label ?? ''}
            >
              {o.system}: {o.code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentInterpretation;