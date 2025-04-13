
import React from 'react';
import { Bot, Zap, Check } from "lucide-react";
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
          isActive={currentStep === "prompts"} 
          onClick={() => handleStepClick("prompts")}
        >
          <Bot />
          <span>Prompts da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "analytics"} 
          onClick={() => handleStepClick("analytics")}
        >
          <Zap />
          <span>Analytics</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "actions"} 
          onClick={() => handleStepClick("actions")}
        >
          <Check />
          <span>Ações em Massa</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ConfigurationGroup;
