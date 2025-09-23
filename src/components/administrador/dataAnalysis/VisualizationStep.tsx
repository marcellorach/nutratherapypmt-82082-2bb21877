
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Componentes de visualização
import HealthConditionsTab from './visualizations/HealthConditionsTab';
import TreatmentsTab from './visualizations/TreatmentsTab';
import NutraceuticalsTab from './visualizations/NutraceuticalsTab';
import OverviewTab from './visualizations/OverviewTab';

const VisualizationStep: React.FC = () => {
  const { t } = useTranslation();
  const [timeFrame, setTimeFrame] = useState('6m');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.visualization.title')}</h2>
          <p className="text-gray-600">{t('admin.visualization.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{t('admin.visualization.period')}</span>
          <Select defaultValue="6m" onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('admin.visualization.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">{t('admin.visualization.periods.1m')}</SelectItem>
              <SelectItem value="3m">{t('admin.visualization.periods.3m')}</SelectItem>
              <SelectItem value="6m">{t('admin.visualization.periods.6m')}</SelectItem>
              <SelectItem value="1y">{t('admin.visualization.periods.1y')}</SelectItem>
              <SelectItem value="all">{t('admin.visualization.periods.all')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{t('admin.visualization.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="conditions">{t('admin.visualization.tabs.conditions')}</TabsTrigger>
          <TabsTrigger value="treatments">{t('admin.visualization.tabs.treatments')}</TabsTrigger>
          <TabsTrigger value="nutraceuticals">{t('admin.visualization.tabs.nutraceuticals')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="conditions">
          <HealthConditionsTab />
        </TabsContent>
        
        <TabsContent value="treatments">
          <TreatmentsTab />
        </TabsContent>
        
        <TabsContent value="nutraceuticals">
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Componente de visualização de nutracêuticos em desenvolvimento
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisualizationStep;
