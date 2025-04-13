
import React from 'react';
import { Import, Database, Brain, BarChart3 } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface DataProcessingGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const DataProcessingGroup: React.FC<DataProcessingGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "import"} 
          onClick={() => handleStepClick("import")}
        >
          <Import />
          <span>Importar Dados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "fontes"} 
          onClick={() => handleStepClick("fontes")}
        >
          <Database />
          <span>Fontes de Dados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "analysis"} 
          onClick={() => handleStepClick("analysis")}
        >
          <Brain />
          <span>Simulação Multi-Agente</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "visualization"} 
          onClick={() => handleStepClick("visualization")}
        >
          <BarChart3 />
          <span>Visualização</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default DataProcessingGroup;
