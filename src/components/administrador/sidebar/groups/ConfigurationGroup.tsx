
import React from 'react';
import { Bot, Database, Cpu, ChevronRight, Check, Languages, ListTree, ShieldCheck } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from 'react-i18next';

interface ConfigurationGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ConfigurationGroup: React.FC<ConfigurationGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "knowledge-base-settings"} 
          onClick={() => handleStepClick("knowledge-base-settings")}
          className={currentStep === "knowledge-base-settings" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Database className={`h-4 w-4 mr-2 ${currentStep === "knowledge-base-settings" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.knowledgeBase')}</span>
            </div>
            {currentStep === "knowledge-base-settings" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "config-ia"} 
          onClick={() => handleStepClick("config-ia")}
          className={currentStep === "config-ia" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Cpu className={`h-4 w-4 mr-2 ${currentStep === "config-ia" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.aiConfig')}</span>
            </div>
            {currentStep === "config-ia" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "prompts"} 
          onClick={() => handleStepClick("prompts")}
          className={currentStep === "prompts" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Bot className={`h-4 w-4 mr-2 ${currentStep === "prompts" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.aiPrompts')}</span>
            </div>
            {currentStep === "prompts" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "actions"} 
          onClick={() => handleStepClick("actions")}
          className={currentStep === "actions" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Check className={`h-4 w-4 mr-2 ${currentStep === "actions" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.actions.bulkActions')}</span>
            </div>
            {currentStep === "actions" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "translation-audit"} 
          onClick={() => handleStepClick("translation-audit")}
          className={currentStep === "translation-audit" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Languages className={`h-4 w-4 mr-2 ${currentStep === "translation-audit" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.translationAudit')}</span>
            </div>
            {currentStep === "translation-audit" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "organograma"}
          onClick={() => handleStepClick("organograma")}
          className={currentStep === "organograma" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <ListTree className={`h-4 w-4 mr-2 ${currentStep === "organograma" ? "text-primary" : ""}`} />
              <span>Organograma</span>
            </div>
            {currentStep === "organograma" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "compliance-dashboard"}
          onClick={() => handleStepClick("compliance-dashboard")}
          className={currentStep === "compliance-dashboard" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <ShieldCheck className={`h-4 w-4 mr-2 ${currentStep === "compliance-dashboard" ? "text-primary" : ""}`} />
              <span>Conformidade FDA/EMA/AVMA</span>
            </div>
            {currentStep === "compliance-dashboard" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ConfigurationGroup;
