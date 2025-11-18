
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brush, Cpu, Database, BarChart, HardDrive } from "lucide-react";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';
import EnginesPromptsPanel from './panels/EnginesPromptsPanel';
import ConventionsPanel from './panels/ConventionsPanel';
import UsagePanel from './panels/UsagePanel';
import NutraceuticalManagementPanel from './panels/NutraceuticalManagementPanel';
import { DataManagementPanel } from '@/components/admin/DataManagementPanel';
import TabInfoButton from '../common/TabInfoButton';
import { adminTabsInfo } from '@/data/admin-tabs-info';

const KnowledgeBaseSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('engines');
  
  return (
    <NutraceuticalProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('admin.settings.knowledgeBase.title')}</h2>
            <p className="text-sm text-gray-500">{t('admin.settings.knowledgeBase.subtitle')}</p>
          </div>
          
          <div className="flex gap-2">
            <TabInfoButton
              tabId="knowledge-base-settings"
              title={t('admin.settings.knowledgeBase.title')}
              content={adminTabsInfo['knowledge-base-settings']}
            />
            
            <Button>{t('admin.settings.knowledgeBase.saveButton')}</Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="engines" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>{t('admin.settings.knowledgeBase.tabs.enginesPrompts')}</span>
            </TabsTrigger>
            <TabsTrigger value="conventions" className="flex items-center gap-2">
              <Brush className="h-4 w-4" />
              <span>{t('admin.settings.knowledgeBase.tabs.conventions')}</span>
            </TabsTrigger>
            <TabsTrigger value="nutraceuticals" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>{t('admin.settings.knowledgeBase.tabs.nutraceuticals')}</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>{t('admin.settings.knowledgeBase.tabs.usage')}</span>
            </TabsTrigger>
            <TabsTrigger value="data-management" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>{t('admin.settings.knowledgeBase.tabs.dataManagement')}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="engines" className="mt-6">
            <EnginesPromptsPanel section="knowledge-base" />
          </TabsContent>
          <TabsContent value="conventions" className="mt-6">
            <ConventionsPanel section="knowledge-base" />
          </TabsContent>
          <TabsContent value="nutraceuticals" className="mt-6">
            <NutraceuticalManagementPanel />
          </TabsContent>
          <TabsContent value="usage" className="mt-6">
            <UsagePanel section="knowledge-base" />
          </TabsContent>
          <TabsContent value="data-management" className="mt-6">
            <DataManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default KnowledgeBaseSettingsTab;
