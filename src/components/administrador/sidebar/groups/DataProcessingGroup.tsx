
import React from 'react';
import { Import, BarChart3, Settings, ChevronRight, PawPrint, CircleCheck, ArrowRight } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
          isActive={currentStep === "visualization"} 
          onClick={() => handleStepClick("visualization")}
          className={currentStep === "visualization" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <BarChart3 className={`h-4 w-4 mr-2 ${currentStep === "visualization" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.dataProcessing.visualization')}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleCheck className="h-3.5 w-3.5 ml-1.5 text-yellow-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px] text-xs">
                    <p className="font-semibold text-yellow-600 mb-1">{t('admin.sidebar.dataProcessing.visualizationStatus')}</p>
                    <p className="text-muted-foreground">{t('admin.sidebar.dataProcessing.visualizationStatusTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <span className="flex items-center mr-2">
                <PawPrint className={`h-4 w-4 ${currentStep === "pet-management" ? "text-primary" : "text-foreground"}`} />
                <ArrowRight className={`h-3 w-3 mx-0.5 ${currentStep === "pet-management" ? "text-primary" : "text-muted-foreground"}`} />
                <PawPrint className={`h-4 w-4 ${currentStep === "pet-management" ? "text-primary" : "text-foreground"}`} />
              </span>
              <span>{t('admin.sidebar.dataProcessing.petManagement')}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleCheck className="h-3.5 w-3.5 ml-1.5 text-yellow-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px] text-xs">
                    <p className="font-semibold text-yellow-600 mb-1">{t('admin.sidebar.dataProcessing.petManagementStatus')}</p>
                    <p className="text-muted-foreground">{t('admin.sidebar.dataProcessing.petManagementStatusTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
