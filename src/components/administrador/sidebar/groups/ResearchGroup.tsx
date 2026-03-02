
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Beaker, FlaskConical, CheckCheck, Database, Lightbulb, ChevronRight, CircleCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

const StatusBadge: React.FC<{ statusKey: string; tooltipKey: string; color: string }> = ({ statusKey, tooltipKey, color }) => {
  const { t } = useTranslation();
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CircleCheck className={`h-3.5 w-3.5 ml-1.5 ${color} flex-shrink-0 cursor-help`} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[220px] text-xs">
          <p className={`font-semibold mb-1 ${color}`}>{t(statusKey)}</p>
          <p className="text-muted-foreground">{t(tooltipKey)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ currentStep, handleStepClick }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "sugestoes-ai"}
          onClick={() => handleStepClick("sugestoes-ai")}
          className={currentStep === "sugestoes-ai" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "sugestoes-ai" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.research.proposedStudies')}</span>
              <StatusBadge statusKey="admin.sidebar.research.proposedStudiesStatus" tooltipKey="admin.sidebar.research.proposedStudiesStatusTooltip" color="text-yellow-500" />
            </div>
            {currentStep === "sugestoes-ai" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-planejados"}
          onClick={() => handleStepClick("estudos-planejados")}
          className={currentStep === "estudos-planejados" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "estudos-planejados" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.research.plannedStudies')}</span>
              <StatusBadge statusKey="admin.sidebar.research.plannedStudiesStatus" tooltipKey="admin.sidebar.research.plannedStudiesStatusTooltip" color="text-emerald-400" />
            </div>
            {currentStep === "estudos-planejados" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-andamento"}
          onClick={() => handleStepClick("estudos-andamento")}
          className={currentStep === "estudos-andamento" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FlaskConical className={`h-4 w-4 mr-2 ${currentStep === "estudos-andamento" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.research.ongoingStudies')}</span>
              <StatusBadge statusKey="admin.sidebar.research.ongoingStudiesStatus" tooltipKey="admin.sidebar.research.ongoingStudiesStatusTooltip" color="text-emerald-400" />
            </div>
            {currentStep === "estudos-andamento" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-concluidos"}
          onClick={() => handleStepClick("estudos-concluidos")}
          className={currentStep === "estudos-concluidos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CheckCheck className={`h-4 w-4 mr-2 ${currentStep === "estudos-concluidos" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.research.completedStudies')}</span>
            </div>
            {currentStep === "estudos-concluidos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "modelos"} 
          onClick={() => handleStepClick("modelos")}
          className={currentStep === "modelos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Lightbulb className={`h-4 w-4 mr-2 ${currentStep === "modelos" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.research.predictiveModels')}</span>
            </div>
            {currentStep === "modelos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
