import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import SourceStatusCard, { SourceStatus } from './SourceStatusCard';
import ApiKeysPanel from './ApiKeysPanel';
import OverviewIntro from './OverviewIntro';
import UsageMap from './UsageMap';

interface Props { onNavigateSub: (sub: string) => void }

const SUB_MAP: Record<string, string> = {
  umls: 'mapping', snomed: 'mapping',
  mesh: 'bulk-import', omia: 'bulk-import',
  chebi: 'search', pubmed: 'audit', perplexity: 'audit',
};

const OverviewTab: React.FC<Props> = ({ onNavigateSub }) => {
  const { t } = useTranslation();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['external-sources-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('external-sources-status');
      if (error) throw error;
      return data as { sources: SourceStatus[]; summary: { total_conditions: number; total_nutraceuticals: number }; generated_at: string };
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const sources = data?.sources ?? [];

  return (
    <div className="space-y-6">
      <OverviewIntro />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('externalSources.overview.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('externalSources.overview.description')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('externalSources.overview.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sources.map(s => (
          <SourceStatusCard
            key={s.id}
            source={s}
            onOpenSubTab={SUB_MAP[s.id] ? () => onNavigateSub(SUB_MAP[s.id]) : undefined}
          />
        ))}
      </div>

      {data && (
        <Card>
          <CardContent className="p-4 text-xs text-muted-foreground flex items-center justify-between">
            <span>{t('externalSources.overview.lastUpdate')}: {new Date(data.generated_at).toLocaleString()}</span>
            <span>{data.summary.total_conditions} {t('externalSources.overview.conditions')} · {data.summary.total_nutraceuticals} {t('externalSources.overview.nutraceuticals')}</span>
          </CardContent>
        </Card>
      )}

      <ApiKeysPanel sources={sources} />
      <UsageMap />
    </div>
  );
};

export default OverviewTab;