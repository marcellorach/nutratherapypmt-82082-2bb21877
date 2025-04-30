
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import TabHeader from './TabHeader';
import TabNavigation from './TabNavigation';
import FileUploadTab from './FileUploadTab';
import SciSpace2StepImport from './SciSpace2StepImport';
import HistoryTab from './HistoryTab';

const SCISPACE_LOGO_URL = "/lovable-uploads/1abbfa4b-69b7-42ab-8e69-bf156f88568a.png";

const SciImportSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("file-upload");
  const { toast } = useToast();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleProcessWithAI = () => {
    const ntaiSection = document.getElementById('ntai-processing-section');
    if (ntaiSection) {
      ntaiSection.scrollIntoView({ behavior: 'smooth' });
      ntaiSection.classList.add('highlight-section');
      setTimeout(() => {
        ntaiSection.classList.remove('highlight-section');
      }, 2000);
      toast({
        title: "Selecione os estudos para processamento",
        description: "Selecione os estudos importados e adicione-os à fila de processamento NTAI."
      });
    }
  };

  return (
    <Card>
      <Tabs value={activeTab} className="w-full">
        <TabHeader activeTab={activeTab} scispaceLogo={SCISPACE_LOGO_URL} />
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="p-6">
          <TabsContent value="file-upload">
            <FileUploadTab />
          </TabsContent>

          <TabsContent value="scispace-api">
            <SciSpace2StepImport />
          </TabsContent>
          
          <TabsContent value="import-history">
            <HistoryTab onProcessWithAI={handleProcessWithAI} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default SciImportSection;
