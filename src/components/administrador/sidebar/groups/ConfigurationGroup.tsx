
import React from 'react';
import { Bot, Database, Cpu } from "lucide-react";
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
          <Database className={currentStep === "knowledge-base-settings" ? "text-primary" : ""} />
          <span>Base de Conhecimento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "config-ia"} 
          onClick={() => handleStepClick("config-ia")}
          className={currentStep === "config-ia" ? "bg-primary/10 text-primary" : ""}
        >
          <Cpu className={currentStep === "config-ia" ? "text-primary" : ""} />
          <span>Config. de IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "prompts"} 
          onClick={() => handleStepClick("prompts")}
          className={currentStep === "prompts" ? "bg-primary/10 text-primary" : ""}
        >
          <Bot className={currentStep === "prompts" ? "text-primary" : ""} />
          <span>Prompts da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ConfigurationGroup;
