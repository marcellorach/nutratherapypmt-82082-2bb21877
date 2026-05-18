import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const OntologyAuditTab = lazy(() => import('@/components/administrador/auditoria/OntologyAuditTab'));
const OntologyMappingTab = lazy(() => import('@/components/administrador/OntologyMappingTab'));

const OntologyHub: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">{t('admin.sidebar.knowledgeBase.ontologyAudit')}</TabsTrigger>
          <TabsTrigger value="mapping">{t('admin.sidebar.knowledgeBase.ontologyMapping')}</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <OntologyAuditTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="mapping" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <OntologyMappingTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OntologyHub;