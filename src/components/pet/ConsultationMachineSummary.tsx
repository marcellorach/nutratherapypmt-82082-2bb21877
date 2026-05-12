import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import type { AssessmentInterpretationData } from './AssessmentInterpretation';

interface Props {
  tags?: string[] | null;
  machineSummary?: string | null;
  interpretation?: AssessmentInterpretationData | null;
}

/**
 * Yellow callout shown at the bottom of each consultation card. Aggregates
 * everything the system understood from the visit:
 *  - tags (PT clinical chips)
 *  - 1-2 sentence LLM synthesis (`machine_summary`)
 *  - canonical reference terms ready for VetGraphRAG
 */
const ConsultationMachineSummary: React.FC<Props> = ({ tags, machineSummary, interpretation }) => {
  const { t } = useTranslation();
  const canonical = interpretation?.canonical_conditions ?? [];
  const hasContent = (tags?.length ?? 0) > 0 || !!machineSummary || canonical.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mt-3 border-l-4 border-amber-400 bg-amber-50/70 dark:bg-amber-900/20 rounded-md p-3 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1 text-amber-900 dark:text-amber-200">
        <Sparkles className="h-3.5 w-3.5" />
        {t('machineSummary.title', { defaultValue: 'Interpretação automática desta consulta' })}
      </p>
      {machineSummary && (
        <p className="text-xs text-foreground leading-relaxed">{machineSummary}</p>
      )}
      {(tags?.length ?? 0) > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {t('machineSummary.tags', { defaultValue: 'Tags clínicas' })}
          </p>
          <div className="flex flex-wrap gap-1">
            {tags!.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] rounded-full border border-amber-300 bg-amber-100/60 dark:bg-amber-800/30 px-2 py-0.5 text-amber-900 dark:text-amber-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
      {canonical.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {t('machineSummary.canonical', { defaultValue: 'Termos canônicos (VetGraphRAG)' })}
          </p>
          <div className="flex flex-wrap gap-1">
            {canonical.map((c, i) => (
              <span
                key={i}
                className="text-[10px] rounded border border-amber-300 bg-background/60 px-1.5 py-0.5 text-foreground"
              >
                {c.name}{c.stage ? ` · ${c.stage}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground italic">
        {t('machineSummary.disclaimer', {
          defaultValue: 'Esses dados alimentam a análise VetGraphRAG. O texto original do veterinário não é alterado.',
        })}
      </p>
    </div>
  );
};

export default ConsultationMachineSummary;