
import React from 'react';
import { ChevronRight, Check, Languages, CheckCircle2, Palette, UserCog, Zap, Gauge } from "lucide-react";
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
    </>
  );
};

export default ConfigurationGroup;
