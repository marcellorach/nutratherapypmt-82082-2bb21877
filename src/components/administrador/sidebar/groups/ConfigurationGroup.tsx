
import React from 'react';
import { Bot, Database, Cpu, ChevronRight } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface ConfigurationGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ConfigurationGroup: React.FC<ConfigurationGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
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
              <span>Base de Conhecimento</span>
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
              <span>Config. de IA</span>
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
              <span>Prompts da IA</span>
            </div>
            {currentStep === "prompts" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ConfigurationGroup;
