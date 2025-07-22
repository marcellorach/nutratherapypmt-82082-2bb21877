
import React from 'react';
import { Lightbulb, Gauge, Settings, ChevronRight } from "lucide-react";
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
          className={currentStep === "modelos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Lightbulb className={`h-4 w-4 mr-2 ${currentStep === "modelos" ? "text-primary" : ""}`} />
              <span>Modelos Preditivos</span>
            </div>
            {currentStep === "modelos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
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
              <span>Análise de ROI</span>
            </div>
            {currentStep === "custo-beneficio" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "predictive-analysis-settings"} 
          onClick={() => handleStepClick("predictive-analysis-settings")}
          className={currentStep === "predictive-analysis-settings" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Settings className={`h-4 w-4 mr-2 ${currentStep === "predictive-analysis-settings" ? "text-primary" : ""}`} />
              <span>Configurações</span>
            </div>
            {currentStep === "predictive-analysis-settings" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default PredictiveAnalysisGroup;
