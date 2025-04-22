
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brush, Cpu, BarChart } from "lucide-react";
import EnginesPromptsPanel from './panels/EnginesPromptsPanel';
import ConventionsPanel from './panels/ConventionsPanel';
import UsagePanel from './panels/UsagePanel';

const ResearchSettingsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('engines');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações - Pesquisa e Desenvolvimento</h2>
          <p className="text-sm text-gray-500">Configure engines, prompts e convenções específicas para Pesquisa e Desenvolvimento</p>
        </div>
        <Button>Salvar Configurações</Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engines" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>Engines & Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="conventions" className="flex items-center gap-2">
            <Brush className="h-4 w-4" />
            <span>Convenções</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Uso de API</span>
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
