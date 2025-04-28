
import React from 'react';
import { 
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuLabel
} from "@/components/ui/sidebar";
import { Database, Microscope, BookOpen, Flask, Vial, BarChart3, ListFilter } from "lucide-react";

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ currentStep, handleStepClick }) => {
  return (
    <>
      <SidebarMenuLabel>Pesquisa</SidebarMenuLabel>
      <SidebarMenuItem active={currentStep === "nutraceu-gerenciamento"}>
        <SidebarMenuButton onClick={() => handleStepClick("nutraceu-gerenciamento")} className="font-medium">
          <Database className="h-4 w-4 mr-2" />
          <span>Banco de Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "pesquisa-estudos"}>
        <SidebarMenuButton onClick={() => handleStepClick("pesquisa-estudos")}>
          <BookOpen className="h-4 w-4 mr-2" />
          <span>Pesquisa de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "estudos-planejados"}>
        <SidebarMenuButton onClick={() => handleStepClick("estudos-planejados")}>
          <ListFilter className="h-4 w-4 mr-2" />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "estudos-andamento"}>
        <SidebarMenuButton onClick={() => handleStepClick("estudos-andamento")}>
          <Flask className="h-4 w-4 mr-2" />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "estudos-concluidos"}>
        <SidebarMenuButton onClick={() => handleStepClick("estudos-concluidos")}>
          <BarChart3 className="h-4 w-4 mr-2" />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "sugestoes-ai"}>
        <SidebarMenuButton onClick={() => handleStepClick("sugestoes-ai")}>
          <Microscope className="h-4 w-4 mr-2" />
          <span>Sugestões da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem active={currentStep === "ora-biomedical"}>
        <SidebarMenuButton onClick={() => handleStepClick("ora-biomedical")}>
          <Vial className="h-4 w-4 mr-2" />
          <span>Ora Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuLabel className="mt-4">Configurações</SidebarMenuLabel>
      <SidebarMenuItem active={currentStep === "research-settings"}>
        <SidebarMenuButton onClick={() => handleStepClick("research-settings")}>
          <span>Configurações de Pesquisa</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
