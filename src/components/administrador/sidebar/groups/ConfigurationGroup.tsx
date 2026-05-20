
import React from 'react';
import { Bot, Database, Cpu, ChevronRight, Check, Languages, ListTree, ShieldCheck, FileSearch, CheckCircle2, Palette, UserCog, Zap, Gauge, Info, Sparkles } from "lucide-react";
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
              {currentStep === "custo-beneficio" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "translations" || currentStep === "translation-audit" || currentStep === "translation-manager"}
          onClick={() => handleStepClick("translations")}
          className={(currentStep === "translations" || currentStep === "translation-audit" || currentStep === "translation-manager") ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Languages className={`h-4 w-4 mr-2 ${(currentStep === "translations" || currentStep === "translation-audit" || currentStep === "translation-manager") ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.translationsHub')}</span>
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
              {(currentStep === "translations" || currentStep === "translation-audit" || currentStep === "translation-manager") && (
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <span>{t('admin.sidebar.configuration.organograma')}</span>
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
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
              <span>
                {t('admin.sidebar.configuration.complianceDashboard')}
                <CheckCircle2 className="inline-block h-3.5 w-3.5 text-emerald-500 ml-1.5 align-middle" aria-label="Configurado" />
              </span>
            </div>
            <div className="flex items-center ml-auto">
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
              <span>{t('admin.sidebar.configuration.technicalAudits')}</span>
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
              {currentStep === "technical-audits" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "about-senex"}
          onClick={() => handleStepClick("about-senex")}
          className={currentStep === "about-senex" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Info className={`h-4 w-4 mr-2 ${currentStep === "about-senex" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.aboutSenex')}</span>
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
              {currentStep === "about-senex" && (
                <ChevronRight className="h-4 w-4 ml-auto text-primary" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "fundamentos"}
          onClick={() => handleStepClick("fundamentos")}
          className={currentStep === "fundamentos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Sparkles className={`h-4 w-4 mr-2 ${currentStep === "fundamentos" ? "text-primary" : ""}`} />
              <span>{t('admin.sidebar.configuration.fundamentos', 'Fundamentos Arquiteturais')}</span>
              <ConfiguredCheck />
            </div>
            <div className="flex items-center ml-auto">
              {currentStep === "fundamentos" && (
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
