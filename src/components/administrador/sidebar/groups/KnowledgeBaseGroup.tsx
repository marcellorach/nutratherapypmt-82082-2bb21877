
import React from 'react';
import { BookOpen, Beaker, Target, Sparkles, Network, Settings, ChevronRight, GitPullRequest, Share2 } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from 'react-i18next';

interface KnowledgeBaseGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

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
            </div>
            {currentStep === "veterinary-targets" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "triplet-curation"} 
          onClick={() => handleStepClick("triplet-curation")}
          className={currentStep === "triplet-curation" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <GitPullRequest className={`h-4 w-4 mr-2 ${currentStep === "triplet-curation" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.knowledgeBase.tripletCuration')}</span>
            </div>
            {currentStep === "triplet-curation" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

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
            </div>
            {currentStep === "knowledge-graph" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
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
            </div>
            {currentStep === "relacoes" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
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
