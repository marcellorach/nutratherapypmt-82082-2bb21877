
import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { NutraceuticalProvider } from '@/contexts/NutraceuticalContext';

// Importação dos painéis
import NutraceuticalManagementPanel from './panels/NutraceuticalManagementPanel';
import PromptManagementPanel from './panels/PromptManagementPanel';
import OutcomeManagementPanel from './panels/OutcomeManagementPanel';

const SettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('nutraceuticals');

  return (
    <NutraceuticalProvider>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Configurações</h2>
        
        <Tabs defaultValue="nutraceuticals" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticals">
            <NutraceuticalManagementPanel />
          </TabsContent>
          
          <TabsContent value="outcomes">
            <OutcomeManagementPanel />
          </TabsContent>
          
          <TabsContent value="prompts">
            <PromptManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </NutraceuticalProvider>
  );
};

export default SettingsContent;
