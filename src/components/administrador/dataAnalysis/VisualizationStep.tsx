
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Componentes de visualização
import HealthConditionsTab from './visualizations/HealthConditionsTab';
import TreatmentsTab from './visualizations/TreatmentsTab';
import NutraceuticalsTab from './visualizations/NutraceuticalsTab';
import OverviewTab from './visualizations/OverviewTab';

const VisualizationStep: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('6m');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visualização de Dados</h2>
          <p className="text-gray-600">Análise e visualização dos padrões identificados</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Período:</span>
          <Select defaultValue="6m" onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conditions">Condições de Saúde</TabsTrigger>
          <TabsTrigger value="treatments">Tratamentos</TabsTrigger>
          <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
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
