
import React from 'react';
import { Bot, Database, Cpu, ChevronRight, Check, Languages, ListTree, ShieldCheck, FileSearch, CheckCircle2, FileEdit, Palette, UserCog, Zap, Gauge } from "lucide-react";
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

  const ConfiguredCheck = () => (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-2 shrink-0" aria-label="Configurado" />
  );

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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "knowledge-base-settings" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "config-ia" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "prompts" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "actions" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "analytics" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "custo-beneficio" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "translation-audit" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "translation-manager"}
          onClick={() => handleStepClick("translation-manager")}
          className={currentStep === "translation-manager" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FileEdit className={`h-4 w-4 mr-2 ${currentStep === "translation-manager" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.translationManager')}</span>
            </div>
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "translation-manager" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "design-conventions"}
          onClick={() => handleStepClick("design-conventions")}
          className={currentStep === "design-conventions" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Palette className={`h-4 w-4 mr-2 ${currentStep === "design-conventions" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.designConventions')}</span>
            </div>
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "design-conventions" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "access-requests"}
          onClick={() => handleStepClick("access-requests")}
          className={currentStep === "access-requests" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <UserCog className={`h-4 w-4 mr-2 ${currentStep === "access-requests" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.accessRequests')}</span>
            </div>
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "access-requests" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "organograma" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
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
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "compliance-dashboard" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "technical-audits"}
          onClick={() => handleStepClick("technical-audits")}
          className={currentStep === "technical-audits" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FileSearch className={`h-4 w-4 mr-2 ${currentStep === "technical-audits" ? "text-primary" : ""}`} />
              <span>Auditorias Técnicas</span>
            </div>
            <div className="flex items-center ml-auto">
              <ConfiguredCheck />
              {currentStep === "technical-audits" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ConfigurationGroup;
