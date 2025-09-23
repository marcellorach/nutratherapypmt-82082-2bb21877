
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Beaker, BookOpen, Database, Network, Settings, ListChecks, Microscope, ChevronRight } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

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
              <span>{t('admin.sidebar.items.scientificStudies')}</span>
            </div>
            {currentStep === "estudos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceu-gerenciamento"} 
          onClick={() => handleStepClick("nutraceu-gerenciamento")}
          className={currentStep === "nutraceu-gerenciamento" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Database className={`h-4 w-4 mr-2 ${currentStep === "nutraceu-gerenciamento" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.items.nutraceuticalDatabase')}</span>
            </div>
            {currentStep === "nutraceu-gerenciamento" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceuticos"} 
          onClick={() => handleStepClick("nutraceuticos")}
          className={currentStep === "nutraceuticos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "nutraceuticos" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.items.nutraceuticals')}</span>
            </div>
            {currentStep === "nutraceuticos" && (
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
              <span>{t('admin.sidebar.items.relations')}</span>
            </div>
            {currentStep === "relacoes" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "regras"} 
          onClick={() => handleStepClick("regras")}
          className={currentStep === "regras" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Microscope className={`h-4 w-4 mr-2 ${currentStep === "regras" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.items.clinicalRules')}</span>
            </div>
            {currentStep === "regras" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "outcomes-management"} 
          onClick={() => handleStepClick("outcomes-management")}
          className={currentStep === "outcomes-management" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <ListChecks className={`h-4 w-4 mr-2 ${currentStep === "outcomes-management" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.items.manageOutcomes')}</span>
            </div>
            {currentStep === "outcomes-management" && (
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
              <span>{t('admin.sidebar.items.settings')}</span>
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
