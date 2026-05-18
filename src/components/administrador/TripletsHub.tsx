import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const TripletCurationBoard = lazy(() => import('@/components/administrador/estudos/curation/TripletCurationBoard'));
const TripletQualityDashboard = lazy(() => import('@/components/administrador/analytics/TripletQualityDashboard'));

const TripletsHub: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <Tabs defaultValue="curation" className="w-full">
        <TabsList>
          <TabsTrigger value="curation">{t('admin.sidebar.knowledgeBase.tripletCuration')}</TabsTrigger>
          <TabsTrigger value="quality">{t('admin.sidebar.knowledgeBase.tripletQuality')}</TabsTrigger>
        </TabsList>
        <TabsContent value="curation" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TripletCurationBoard />
          </Suspense>
        </TabsContent>
        <TabsContent value="quality" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TripletQualityDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripletsHub;