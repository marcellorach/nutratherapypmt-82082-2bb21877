
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';
import { useTranslation } from 'react-i18next';

// Componentes dos painéis
import NutraceuticalManagementPanel from './panels/NutraceuticalManagementPanel';
import { DataManagementPanel } from '@/components/admin/DataManagementPanel';

const SettingsPanel = () => {
  const { t } = useTranslation();
  
  return (
    <NutraceuticalProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.settings.title')}</h2>
          <p className="text-gray-600">{t('admin.settings.description')}</p>
        </div>

        <Tabs defaultValue="nutraceuticals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nutraceuticals">{t('admin.tabs.nutraceuticals')}</TabsTrigger>
            <TabsTrigger value="data">{t('admin.tabs.dataManagement')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticals">
            <NutraceuticalManagementPanel />
          </TabsContent>
          
          <TabsContent value="data">
            <DataManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default SettingsPanel;
