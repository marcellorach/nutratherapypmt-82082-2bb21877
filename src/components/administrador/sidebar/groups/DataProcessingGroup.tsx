
import React from 'react';
import { Import, Brain, BarChart3, Settings, ChevronRight, PawPrint } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from 'react-i18next';

interface DataProcessingGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const DataProcessingGroup: React.FC<DataProcessingGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "import"} 
          onClick={() => handleStepClick("import")}
          className={currentStep === "import" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Import className={`h-4 w-4 mr-2 ${currentStep === "import" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.import')}</span>
            </div>
            {currentStep === "import" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "analysis"} 
          onClick={() => handleStepClick("analysis")}
          className={currentStep === "analysis" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Brain className={`h-4 w-4 mr-2 ${currentStep === "analysis" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.multiAgentSimulation')}</span>
            </div>
            {currentStep === "analysis" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "visualization"} 
          onClick={() => handleStepClick("visualization")}
          className={currentStep === "visualization" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <BarChart3 className={`h-4 w-4 mr-2 ${currentStep === "visualization" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.visualization')}</span>
            </div>
            {currentStep === "visualization" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "pet-management"} 
          onClick={() => handleStepClick("pet-management")}
          className={currentStep === "pet-management" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <PawPrint className={`h-4 w-4 mr-2 ${currentStep === "pet-management" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.petManagement')}</span>
            </div>
            {currentStep === "pet-management" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "data-processing-settings"} 
          onClick={() => handleStepClick("data-processing-settings")}
          className={currentStep === "data-processing-settings" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Settings className={`h-4 w-4 mr-2 ${currentStep === "data-processing-settings" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.settings')}</span>
            </div>
            {currentStep === "data-processing-settings" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default DataProcessingGroup;
