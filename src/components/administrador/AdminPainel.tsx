
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';

// Componentes das abas
import NutraceuticosTab from './NutraceuticosTab';
import NutraceuticoGerenciamentoTab from './pesquisa/NutraceuticoGerenciamentoTab';
import ConfiguracoesTab from './ConfiguracoesTab';
import DataAnalysisTab from './dataAnalysis/DataAnalysisTab';
import PromptConfigurationTab from './PromptConfigurationTab';

const AdminPainel = () => {
  return (
    <NutraceuticalProvider>
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="nutraceuticos">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="banco">Banco de Nutracêuticos</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="analise">Análise de Dados</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <NutraceuticosTab />
          </TabsContent>
          
          <TabsContent value="banco">
            <NutraceuticoGerenciamentoTab />
          </TabsContent>
          
          <TabsContent value="configuracoes">
            <ConfiguracoesTab />
          </TabsContent>
          
          <TabsContent value="analise">
            <DataAnalysisTab />
          </TabsContent>
          
          <TabsContent value="prompts">
            <PromptConfigurationTab />
          </TabsContent>
        </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default AdminPainel;
