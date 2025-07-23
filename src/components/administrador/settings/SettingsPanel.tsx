
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';

// Componentes dos painéis
import NutraceuticalManagementPanel from './panels/NutraceuticalManagementPanel';
import { DataManagementPanel } from '@/components/admin/DataManagementPanel';

const SettingsPanel = () => {
  return (
    <NutraceuticalProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-gray-600">Gerencie nutracêuticos e configurações do sistema</p>
        </div>

        <Tabs defaultValue="nutraceuticals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="data">Gestão de Dados</TabsTrigger>
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
