
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';
import CatalogTab from './nutraceuticals-unified/CatalogTab';
import RelationsTab from './nutraceuticals-unified/RelationsTab';
import MatrixTab from './nutraceuticals-unified/MatrixTab';

const NutraceuticalsUnifiedTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <NutraceuticalProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.sidebar.knowledgeBase.nutraceuticalsUnified')}</h2>
          <p className="text-muted-foreground">
            {t('nutraceuticalsUnified.subtitle')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">
            🗂️ {t('nutraceuticalsUnified.tabs.catalog')}
          </TabsTrigger>
          <TabsTrigger value="relations">
            🔗 {t('nutraceuticalsUnified.tabs.relations')}
          </TabsTrigger>
          <TabsTrigger value="matrix">
            📊 {t('nutraceuticalsUnified.tabs.matrix')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-6">
          <CatalogTab />
        </TabsContent>

        <TabsContent value="relations" className="mt-6">
          <RelationsTab />
        </TabsContent>

        <TabsContent value="matrix" className="mt-6">
          <MatrixTab />
        </TabsContent>
      </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default NutraceuticalsUnifiedTab;
