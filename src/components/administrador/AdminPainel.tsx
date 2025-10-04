
import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';
import { ComponentLoadingFallback } from '@/components/base';
import { useTranslation } from 'react-i18next';

// Lazy loading dos componentes das abas
const NutraceuticosTab = React.lazy(() => import('./NutraceuticosTab'));
const NutraceuticoGerenciamentoTab = React.lazy(() => import('./pesquisa/NutraceuticoGerenciamentoTab'));
const ConfiguracoesTab = React.lazy(() => import('./ConfiguracoesTab'));
const DataAnalysisTab = React.lazy(() => import('./dataAnalysis/DataAnalysisTab'));
const PromptConfigurationTab = React.lazy(() => import('./PromptConfigurationTab'));

const AdminPainel = () => {
  const { t } = useTranslation();
  return (
    <NutraceuticalProvider>
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="nutraceuticos">{t('admin.tabs.nutraceuticals')}</TabsTrigger>
            <TabsTrigger value="banco">{t('admin.tabs.database')}</TabsTrigger>
            <TabsTrigger value="configuracoes">{t('admin.tabs.settings')}</TabsTrigger>
            <TabsTrigger value="analise">{t('admin.tabs.dataAnalysis')}</TabsTrigger>
            <TabsTrigger value="prompts">{t('admin.tabs.prompts')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <Suspense fallback={<ComponentLoadingFallback />}>
              <NutraceuticosTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="banco">
            <Suspense fallback={<ComponentLoadingFallback />}>
              <NutraceuticoGerenciamentoTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="configuracoes">
            <Suspense fallback={<ComponentLoadingFallback />}>
              <ConfiguracoesTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="analise">
            <Suspense fallback={<ComponentLoadingFallback />}>
              <DataAnalysisTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="prompts">
            <Suspense fallback={<ComponentLoadingFallback />}>
              <PromptConfigurationTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default AdminPainel;
