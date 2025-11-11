
import React from 'react';
import { Zap, Gauge, ChevronRight, Activity } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from 'react-i18next';

interface ActionsGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ActionsGroup: React.FC<ActionsGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "analytics"} 
          onClick={() => handleStepClick("analytics")}
          className={currentStep === "analytics" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Zap className={`h-4 w-4 mr-2 ${currentStep === "analytics" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.actions.analytics')}</span>
            </div>
            {currentStep === "analytics" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "custo-beneficio"} 
          onClick={() => handleStepClick("custo-beneficio")}
          className={currentStep === "custo-beneficio" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Gauge className={`h-4 w-4 mr-2 ${currentStep === "custo-beneficio" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.actions.roiAnalysis')}</span>
            </div>
            {currentStep === "custo-beneficio" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "acompanhamento"} 
          onClick={() => handleStepClick("acompanhamento")}
          className={currentStep === "acompanhamento" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Activity className={`h-4 w-4 mr-2 ${currentStep === "acompanhamento" ? "text-primary" : ""}`} />
              <span>{t('campaignManagement')}</span>
            </div>
            {currentStep === "acompanhamento" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "clinical-monitoring"} 
          onClick={() => handleStepClick("clinical-monitoring")}
          className={currentStep === "clinical-monitoring" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Activity className={`h-4 w-4 mr-2 ${currentStep === "clinical-monitoring" ? "text-primary" : ""}`} />
              <span>{t('clinicalMonitoring.title')}</span>
            </div>
            {currentStep === "clinical-monitoring" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ActionsGroup;
