
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
  
  const tabs = [
    { value: "library", icon: BookOpen, label: t('studies.import.libraryTab', 'Library') },
    { value: "file-upload", icon: Upload, label: t('studies.import.uploadTab') },
    { value: "import-history", icon: FolderInput, label: t('studies.import.importsTab', 'Imports') },
    { value: "ai-processing", icon: Brain, label: t('studies.import.aiProcessingTab') },
  ];

  return (
    <div className="px-6 pt-4">
      <TabsList className="w-full justify-start gap-0">
        {tabs.map((tab, idx) => (
          <React.Fragment key={tab.value}>
            <TabsTrigger 
              value={tab.value} 
              className="flex items-center gap-1"
              onClick={() => onTabChange(tab.value)}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
            {idx < tabs.length - 1 && (
              <span className="text-muted-foreground/50 mx-1 select-none">→</span>
            )}
          </React.Fragment>
        ))}
      </TabsList>
    </div>
  );
};

export default TabNavigation;
