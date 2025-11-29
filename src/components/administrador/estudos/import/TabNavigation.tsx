
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FolderInput, Brain, BookOpen } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="px-6 pt-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger 
          value="library" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("library")}
        >
          <BookOpen className="h-4 w-4" />
          <span>{t('studies.import.libraryTab', 'Library')}</span>
        </TabsTrigger>
        <TabsTrigger 
          value="file-upload" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("file-upload")}
        >
          <Upload className="h-4 w-4" />
          <span>{t('studies.import.uploadTab')}</span>
        </TabsTrigger>
        <TabsTrigger 
          value="import-history" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("import-history")}
        >
          <FolderInput className="h-4 w-4" />
          <span>{t('studies.import.importsTab', 'Imports')}</span>
        </TabsTrigger>
        <TabsTrigger 
          value="ai-processing" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("ai-processing")}
        >
          <Brain className="h-4 w-4" />
          <span>{t('studies.import.aiProcessingTab')}</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default TabNavigation;
