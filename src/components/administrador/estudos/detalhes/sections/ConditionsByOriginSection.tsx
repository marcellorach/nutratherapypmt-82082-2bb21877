import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buildConditionsByOrigin } from '@/lib/conditionsByOrigin';

interface Props {
  analysisData: unknown;
  ingestionStages: unknown;
}

const ConditionsByOriginSection: React.FC<Props> = ({ analysisData, ingestionStages }) => {
  const { t } = useTranslation();
  const { items, conflict } = buildConditionsByOrigin(analysisData, ingestionStages);
  if (items.length === 0 && !conflict) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Target className="w-4 h-4" />
        {t('estudoDetailSections.healthConditions')}
      </h4>
      {conflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('writerConsistency.conflictTitle')}</AlertTitle>
          <AlertDescription>{t('writerConsistency.conflictBody')}</AlertDescription>
        </Alert>
      )}
      <ul className="flex flex-wrap gap-2">
        {items.map((c, idx) => (
          <li key={`${c.origin}-${idx}`} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
            <span>{c.name}</span>
            {c.score !== null && <span className="text-muted-foreground">({c.score})</span>}
            <Badge variant={c.origin === 'pdf' ? 'secondary' : 'outline'} className="text-xs">
              {t(`writerConsistency.origin.${c.origin}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ConditionsByOriginSection;
