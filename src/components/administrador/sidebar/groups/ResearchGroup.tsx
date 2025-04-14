
import React from 'react';
import { 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { 
  Microscope, 
  FlaskConical, 
  ClipboardList, 
  CheckSquare,
  Beaker
} from "lucide-react";

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos-planejados"}
          onClick={() => handleStepClick("estudos-planejados")}
          tooltip="Estudos Planejados"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos-andamento"}
          onClick={() => handleStepClick("estudos-andamento")}
          tooltip="Estudos em Andamento"
        >
          <FlaskConical className="h-4 w-4" />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos-concluidos"}
          onClick={() => handleStepClick("estudos-concluidos")}
          tooltip="Estudos Concluídos"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "sugestoes-ai"}
          onClick={() => handleStepClick("sugestoes-ai")}
          tooltip="Sugestões da IA"
        >
          <Beaker className="h-4 w-4" />
          <span>Sugestões da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
