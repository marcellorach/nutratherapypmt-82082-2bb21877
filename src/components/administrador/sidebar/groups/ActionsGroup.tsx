
import React from 'react';
import { Zap, Gauge, Check } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface ActionsGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ActionsGroup: React.FC<ActionsGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "analytics"} 
          onClick={() => handleStepClick("analytics")}
          className={currentStep === "analytics" ? "bg-primary/10 text-primary" : ""}
        >
          <Zap className={currentStep === "analytics" ? "text-primary" : ""} />
          <span>Analytics</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "custo-beneficio"} 
          onClick={() => handleStepClick("custo-beneficio")}
        >
          <Gauge />
          <span>Análise de ROI</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "actions"} 
          onClick={() => handleStepClick("actions")}
          className={currentStep === "actions" ? "bg-primary/10 text-primary" : ""}
        >
          <Check className={currentStep === "actions" ? "text-primary" : ""} />
          <span>Ações em Massa</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ActionsGroup;
