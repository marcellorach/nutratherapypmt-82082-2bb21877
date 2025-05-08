
import React from 'react';
import { Lightbulb, Gauge, Settings } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface PredictiveAnalysisGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const PredictiveAnalysisGroup: React.FC<PredictiveAnalysisGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "modelos"} 
          onClick={() => handleStepClick("modelos")}
        >
          <Lightbulb />
          <span>Modelos Preditivos</span>
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
          isActive={currentStep === "predictive-analysis-settings"} 
          onClick={() => handleStepClick("predictive-analysis-settings")}
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default PredictiveAnalysisGroup;
