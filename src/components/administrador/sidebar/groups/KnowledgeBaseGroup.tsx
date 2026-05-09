
import React from 'react';
import { BookOpen, Beaker, Target, Sparkles, Network, Settings, ChevronRight, Share2, ClipboardCheck, CircleCheck, PawPrint, FlaskConical, Database, Pill } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface KnowledgeBaseGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

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

const KnowledgeBaseGroup: React.FC<KnowledgeBaseGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos"} 
          onClick={() => handleStepClick("estudos")}
          className={currentStep === "estudos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <BookOpen className={`h-4 w-4 mr-2 ${currentStep === "estudos" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.studies')}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleCheck className="h-3.5 w-3.5 ml-1.5 text-emerald-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px] text-xs">
                    <p className="font-semibold text-emerald-600 mb-1">{t('admin.sidebar.knowledgeBase.studiesStatus')}</p>
                    <p className="text-muted-foreground">{t('admin.sidebar.knowledgeBase.studiesStatusTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {currentStep === "estudos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceuticals-unified"} 
          onClick={() => handleStepClick("nutraceuticals-unified")}
          className={currentStep === "nutraceuticals-unified" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "nutraceuticals-unified" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.nutraceuticalsUnified')}</span>
              <StatusBadge statusKey="admin.sidebar.knowledgeBase.nutraceuticalsStatus" tooltipKey="admin.sidebar.knowledgeBase.nutraceuticalsStatusTooltip" color="text-emerald-500" />
            </div>
            {currentStep === "nutraceuticals-unified" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "veterinary-targets"} 
          onClick={() => handleStepClick("veterinary-targets")}
          className={currentStep === "veterinary-targets" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Target className={`h-4 w-4 mr-2 ${currentStep === "veterinary-targets" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.veterinaryTargets')}</span>
              <StatusBadge statusKey="admin.sidebar.knowledgeBase.veterinaryTargetsStatus" tooltipKey="admin.sidebar.knowledgeBase.veterinaryTargetsStatusTooltip" color="text-emerald-500" />
            </div>
            {currentStep === "veterinary-targets" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* triplet-curation tab removed - curadoria agora integrada ao EstudoDetailDialog */}

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "knowledge-graph"} 
          onClick={() => handleStepClick("knowledge-graph")}
          className={currentStep === "knowledge-graph" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Share2 className={`h-4 w-4 mr-2 ${currentStep === "knowledge-graph" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.knowledgeGraph')}</span>
              <StatusBadge statusKey="admin.sidebar.knowledgeBase.knowledgeGraphStatus" tooltipKey="admin.sidebar.knowledgeBase.knowledgeGraphStatusTooltip" color="text-emerald-500" />
            </div>
            {currentStep === "knowledge-graph" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "ontology-audit"} 
          onClick={() => handleStepClick("ontology-audit")}
          className={currentStep === "ontology-audit" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <ClipboardCheck className={`h-4 w-4 mr-2 ${currentStep === "ontology-audit" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.ontologyAudit')}</span>
              <StatusBadge statusKey="admin.sidebar.knowledgeBase.ontologyAuditStatus" tooltipKey="admin.sidebar.knowledgeBase.ontologyAuditStatusTooltip" color="text-emerald-500" />
            </div>
            {currentStep === "ontology-audit" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "breeds-management"} 
          onClick={() => handleStepClick("breeds-management")}
          className={currentStep === "breeds-management" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <PawPrint className={`h-4 w-4 mr-2 ${currentStep === "breeds-management" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.breedsManagement')}</span>
            </div>
            {currentStep === "breeds-management" && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "lab-references"} 
          onClick={() => handleStepClick("lab-references")}
          className={currentStep === "lab-references" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FlaskConical className={`h-4 w-4 mr-2 ${currentStep === "lab-references" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.labReferences')}</span>
            </div>
            {currentStep === "lab-references" && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "base-knowledge"} 
          onClick={() => handleStepClick("base-knowledge")}
          className={currentStep === "base-knowledge" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Database className={`h-4 w-4 mr-2 ${currentStep === "base-knowledge" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.baseKnowledge')}</span>
            </div>
            {currentStep === "base-knowledge" && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "pharmacology"}
          onClick={() => handleStepClick("pharmacology")}
          className={currentStep === "pharmacology" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Pill className={`h-4 w-4 mr-2 ${currentStep === "pharmacology" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.pharmacology', 'Base Farmacológica')}</span>
            </div>
            {currentStep === "pharmacology" && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "relacoes"}
          onClick={() => handleStepClick("relacoes")}
          className={currentStep === "relacoes" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Network className={`h-4 w-4 mr-2 ${currentStep === "relacoes" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.relations')}</span>
              <StatusBadge statusKey="admin.sidebar.knowledgeBase.relationsStatus" tooltipKey="admin.sidebar.knowledgeBase.relationsStatusTooltip" color="text-emerald-500" />
            </div>
            {currentStep === "relacoes" && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "ai-insights"} 
          onClick={() => handleStepClick("ai-insights")}
          className={currentStep === "ai-insights" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Sparkles className={`h-4 w-4 mr-2 ${currentStep === "ai-insights" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.aiInsights')}</span>
            </div>
            {currentStep === "ai-insights" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "processamento-ia"} 
          onClick={() => handleStepClick("processamento-ia")}
          className={currentStep === "processamento-ia" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Sparkles className={`h-4 w-4 mr-2 ${currentStep === "processamento-ia" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.aiProcessing')}</span>
            </div>
            {currentStep === "processamento-ia" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "knowledge-base-settings"} 
          onClick={() => handleStepClick("knowledge-base-settings")}
          className={currentStep === "knowledge-base-settings" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Settings className={`h-4 w-4 mr-2 ${currentStep === "knowledge-base-settings" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.settings')}</span>
            </div>
            {currentStep === "knowledge-base-settings" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default KnowledgeBaseGroup;
