import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  treated: number;
  mirror: number;
  twins: number;
  variant?: 'full' | 'compact';
}

const SyntheticDataBadge: React.FC<Props> = ({ treated, mirror, twins, variant = 'full' }) => {
  const { t } = useTranslation();
  if (variant === 'compact') {
    return (
      <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1.5">
        <FlaskConical className="h-3 w-3" />
        {t('clinicalMonitoring.v2.syntheticBadge.compact')}
      </Badge>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm">
      <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="text-amber-800 dark:text-amber-200">
        <span className="font-medium">{t('clinicalMonitoring.v2.syntheticBadge.title')}</span>{' '}
        <span className="opacity-80">
          {t('clinicalMonitoring.v2.syntheticBadge.counts', {
            treated: treated.toLocaleString(),
            mirror: mirror.toLocaleString(),
            twins: twins.toLocaleString(),
          })}
        </span>
      </div>
    </div>
  );
};

export default SyntheticDataBadge;