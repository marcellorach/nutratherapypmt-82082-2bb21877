import React, { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, ClipboardCheck, Link2, Download, Search, Activity } from 'lucide-react';
import OverviewTab from './OverviewTab';

const OntologyAuditTab = lazy(() => import('@/components/administrador/auditoria/OntologyAuditTab'));
const OntologyMappingTab = lazy(() => import('@/components/administrador/OntologyMappingTab'));
const OntologyBulkImportTab = lazy(() => import('@/components/administrador/OntologyBulkImportTab'));
const ExternalSearchPanel = lazy(() => import('@/components/administrador/base-knowledge/ExternalSearchPanel'));

const VALID_SUBS = ['overview', 'mapping', 'bulk-import', 'search', 'audit'] as const;
type SubTab = typeof VALID_SUBS[number];

const ExternalSourcesHub: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const sub = (params.get('sub') as SubTab) || 'overview';
  const active: SubTab = VALID_SUBS.includes(sub) ? sub : 'overview';

  // Legacy deep-link: ?tab=ontology-audit → migrate silently
  useEffect(() => {
    if (params.get('tab') === 'ontology-audit') {
      const next = new URLSearchParams(params);
      next.set('tab', 'external-sources');
      if (!next.get('sub')) next.set('sub', 'audit');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const setSub = (s: string) => {
    const next = new URLSearchParams(params);
    next.set('sub', s);
    setParams(next, { replace: true });
  };

  const fallback = <Skeleton className="h-96 w-full" />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 pb-2 border-b">
        <Globe className="h-6 w-6 text-primary mt-0.5" />
        <div>
          <h2 className="text-xl font-semibold">{t('externalSources.hub.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('externalSources.hub.description')}</p>
        </div>
      </div>

      <Tabs value={active} onValueChange={setSub} className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><Activity className="h-3.5 w-3.5 mr-1.5" />{t('externalSources.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="mapping"><Link2 className="h-3.5 w-3.5 mr-1.5" />{t('externalSources.tabs.mapping')}</TabsTrigger>
          <TabsTrigger value="bulk-import"><Download className="h-3.5 w-3.5 mr-1.5" />{t('externalSources.tabs.bulkImport')}</TabsTrigger>
          <TabsTrigger value="search"><Search className="h-3.5 w-3.5 mr-1.5" />{t('externalSources.tabs.search')}</TabsTrigger>
          <TabsTrigger value="audit"><ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />{t('externalSources.tabs.audit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab onNavigateSub={setSub} />
        </TabsContent>
        <TabsContent value="mapping" className="mt-4">
          <Suspense fallback={fallback}><OntologyMappingTab /></Suspense>
        </TabsContent>
        <TabsContent value="bulk-import" className="mt-4">
          <Suspense fallback={fallback}><OntologyBulkImportTab /></Suspense>
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <Suspense fallback={fallback}><ExternalSearchPanel /></Suspense>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <Suspense fallback={fallback}><OntologyAuditTab /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExternalSourcesHub;