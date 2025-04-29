
import React from 'react';
import { 
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Database, Microscope, BookOpen, BarChart3, ListFilter } from "lucide-react";

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ currentStep, handleStepClick }) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("nutraceu-gerenciamento")}
          isActive={currentStep === "nutraceu-gerenciamento"}
          className="font-medium"
        >
          <Database className="h-4 w-4 mr-2" />
          <span>Banco de Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("pesquisa-estudos")}
          isActive={currentStep === "pesquisa-estudos"}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          <span>Pesquisa de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("estudos-planejados")}
          isActive={currentStep === "estudos-planejados"}
        >
          <ListFilter className="h-4 w-4 mr-2" />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("estudos-andamento")}
          isActive={currentStep === "estudos-andamento"}
        >
          <Database className="h-4 w-4 mr-2" />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("estudos-concluidos")}
          isActive={currentStep === "estudos-concluidos"}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("sugestoes-ai")}
          isActive={currentStep === "sugestoes-ai"}
        >
          <Microscope className="h-4 w-4 mr-2" />
          <span>Sugestões da IA</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("ora-biomedical")}
          isActive={currentStep === "ora-biomedical"}
        >
          <Database className="h-4 w-4 mr-2" />
          <span>Ora Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarGroupLabel className="mt-4">Configurações</SidebarGroupLabel>
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={() => handleStepClick("research-settings")}
          isActive={currentStep === "research-settings"}
        >
          <span>Configurações de Pesquisa</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
