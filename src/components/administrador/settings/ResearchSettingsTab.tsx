
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brush, Cpu, BarChart } from "lucide-react";
import EnginesPromptsPanel from './panels/EnginesPromptsPanel';
import ConventionsPanel from './panels/ConventionsPanel';
import UsagePanel from './panels/UsagePanel';
import { useTranslation } from 'react-i18next';

const ResearchSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('engines');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('settingsTabs.researchTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('settingsTabs.researchDescription')}</p>
        </div>
        <Button>{t('settingsTabs.saveSettings')}</Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engines" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>{t('settingsTabs.enginesPrompts')}</span>
          </TabsTrigger>
          <TabsTrigger value="conventions" className="flex items-center gap-2">
            <Brush className="h-4 w-4" />
            <span>{t('settingsTabs.conventions')}</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>{t('settingsTabs.apiUsage')}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="engines" className="mt-6">
          <EnginesPromptsPanel section="research" />
        </TabsContent>
        <TabsContent value="conventions" className="mt-6">
          <ConventionsPanel section="research" />
        </TabsContent>
        <TabsContent value="usage" className="mt-6">
          <UsagePanel section="research" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResearchSettingsTab;
