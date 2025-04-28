
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { Beaker, FileText, Lightbulb, Settings, ScrollText, MousePointer } from "lucide-react";

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
        >
          <ScrollText />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos-andamento"} 
          onClick={() => handleStepClick("estudos-andamento")}
        >
          <MousePointer />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos-concluidos"} 
          onClick={() => handleStepClick("estudos-concluidos")}
        >
          <FileText />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "sugestoes-ai"} 
          onClick={() => handleStepClick("sugestoes-ai")}
        >
          <Lightbulb />
          <span>Sugestões da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "ora-biomedical"} 
          onClick={() => handleStepClick("ora-biomedical")}
        >
          <Beaker />
          <span>ORA Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "pesquisa-estudos"} 
          onClick={() => handleStepClick("pesquisa-estudos")}
        >
          <Lightbulb />
          <span>Pesquisa de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "research-settings"} 
          onClick={() => handleStepClick("research-settings")}
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
