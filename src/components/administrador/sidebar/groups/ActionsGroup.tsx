
import React from 'react';
import { Zap, Gauge, ChevronRight, Activity, CircleCheck } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleCheck className="h-3.5 w-3.5 ml-1.5 text-orange-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px] text-xs">
                    <p className="font-semibold text-orange-600 mb-1">{t('admin.sidebar.actions.analyticsStatus')}</p>
                    <p className="text-muted-foreground">{t('admin.sidebar.actions.analyticsStatusTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
