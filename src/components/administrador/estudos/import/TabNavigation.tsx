
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Brain, BookOpen, ClipboardCheck, Loader2, FolderInput } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  isProcessing?: boolean;
  pendingCurationCount?: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, isProcessing, pendingCurationCount }) => {
  const { t } = useTranslation();
  
  const tabs = [
    { value: "library", icon: BookOpen, label: t('studies.import.libraryTab', 'Library') },
    { value: "file-upload", icon: Upload, label: t('studies.import.uploadTab') },
    { value: "audit-log", icon: FolderInput, label: t('studies.import.auditLogTab', 'Upload Audit Log') },
    { value: "ai-processing", icon: Brain, label: t('studies.import.aiProcessingTab') },
    { value: "curation", icon: ClipboardCheck, label: t('studies.import.curationTab', 'Curation') },
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
              {tab.value === "ai-processing" && isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <tab.icon className="h-4 w-4" />
              )}
              <span>{tab.label}</span>
              {tab.value === "curation" && pendingCurationCount != null && pendingCurationCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px] leading-4 min-w-[20px] justify-center">
                  {pendingCurationCount}
                </Badge>
              )}
            </TabsTrigger>
            {idx < tabs.length - 1 && (
              <span className={`font-bold mx-3 select-none ${
                idx === 0 
                  ? 'text-muted-foreground/40' 
                  : 'text-muted-foreground'
              }`}>
                {idx === 0 ? '⇢' : '→'}
              </span>
            )}
          </React.Fragment>
        ))}
      </TabsList>
    </div>
  );
};

export default TabNavigation;
