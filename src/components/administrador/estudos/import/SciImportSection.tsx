
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

import TabHeader from './TabHeader';
import TabNavigation from './TabNavigation';
import FileUploadTab from './FileUploadTab';
import SciSpace2StepImport from './SciSpace2StepImport';
import HistoryTab from './HistoryTab';
import AIProcessingTab from './AIProcessingTab';
import StudiesLibraryTab from '../library/StudiesLibraryTab';

const SCISPACE_LOGO_URL = "/lovable-uploads/1abbfa4b-69b7-42ab-8e69-bf156f88568a.png";

const SciImportSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("library");
  const { toast } = useToast();
  const { t } = useTranslation();

  // Listen for custom event to navigate to AI Processing tab
  useEffect(() => {
    const handleStudyImportedToAI = (e: CustomEvent) => {
      if (e.detail?.navigateToAI) {
        setActiveTab('ai-processing');
      }
    };
    
    window.addEventListener('studyImportedToAI', handleStudyImportedToAI as EventListener);
    return () => window.removeEventListener('studyImportedToAI', handleStudyImportedToAI as EventListener);
  }, []);

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
        title: t('studies.toast.selectStudies'),
        description: t('studies.toast.selectStudiesDesc')
      });
    }
  };

  return (
    <Card>
      <Tabs value={activeTab} className="w-full">
        <TabHeader activeTab={activeTab} scispaceLogo={SCISPACE_LOGO_URL} />
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="p-6">
          <TabsContent value="library">
            <StudiesLibraryTab onNavigateToUpload={() => handleTabChange('file-upload')} />
          </TabsContent>

          <TabsContent value="file-upload">
            <FileUploadTab />
          </TabsContent>

          <TabsContent value="scispace-api">
            <SciSpace2StepImport />
          </TabsContent>
          
          <TabsContent value="import-history">
            <HistoryTab onProcessWithAI={handleProcessWithAI} />
          </TabsContent>

          <TabsContent value="ai-processing">
            <AIProcessingTab />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default SciImportSection;
