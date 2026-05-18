import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const TranslationAuditTab = lazy(() => import('@/components/administrador/auditoria/TranslationAuditTab'));
const TranslationManager = lazy(() => import('@/components/administrador/traducoes/TranslationManager'));

const TranslationsHub: React.FC = () => {
  const { t } = useTranslation();
  // Allow deep-link to a specific sub-tab via ?tab=translation-manager (legacy URLs).
  const initial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'translation-manager'
    ? 'manage'
    : 'audit';
  return (
    <div className="p-4">
      <Tabs defaultValue={initial} className="w-full">
        <TabsList>
          <TabsTrigger value="audit">{t('admin.sidebar.configuration.translationAudit')}</TabsTrigger>
          <TabsTrigger value="manage">{t('admin.sidebar.configuration.translationManager')}</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TranslationAuditTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="manage" className="mt-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TranslationManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TranslationsHub;