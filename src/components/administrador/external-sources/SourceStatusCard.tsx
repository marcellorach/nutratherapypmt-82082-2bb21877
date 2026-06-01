import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SourceStatus {
  id: string;
  name: string;
  category: 'ontology' | 'literature' | 'ai';
  requires_key: boolean;
  secret_name: string | null;
  configured: boolean;
  reachable: boolean | null;
  latency_ms: number | null;
  entries: number | null;
  last_error: string | null;
  docs_url: string;
}

interface Props {
  source: SourceStatus;
  onOpenSubTab?: () => void;
}

const SourceStatusCard: React.FC<Props> = ({ source, onOpenSubTab }) => {
  const { t } = useTranslation();
  const ok = source.configured && source.reachable !== false;
  const Icon = ok ? CheckCircle2 : source.configured ? AlertCircle : XCircle;
  const color = ok ? 'text-emerald-600' : source.configured ? 'text-amber-600' : 'text-red-600';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{source.name}</div>
            <Badge variant="outline" className="text-[10px] mt-1">{source.category}</Badge>
          </div>
          <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('externalSources.card.configured')}</span>
            <span className={source.configured ? 'text-emerald-600' : 'text-red-600'}>
              {source.configured ? '✓' : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('externalSources.card.reachable')}</span>
            <span>
              {source.reachable === null ? '—' : source.reachable ? `✓ ${source.latency_ms}ms` : '✗'}
            </span>
          </div>
          {source.entries !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('externalSources.card.entries')}</span>
              <span className="font-mono">{source.entries.toLocaleString()}</span>
            </div>
          )}
        </div>

        {source.last_error && (
          <div className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 rounded p-2 break-words">
            {source.last_error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {onOpenSubTab && (
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={onOpenSubTab}>
              {t('externalSources.card.open')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
            <a href={source.docs_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SourceStatusCard;