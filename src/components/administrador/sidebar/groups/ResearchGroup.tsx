
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Beaker, FlaskConical, CheckCheck, Database, Sparkles, Microscope } from "lucide-react";
import { useSearchParams } from 'react-router-dom';

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ currentStep, handleStepClick }) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "sugestoes-ai"}
          onClick={() => handleStepClick("sugestoes-ai")}
        >
          <Sparkles className="h-4 w-4" />
          <span>Proposição de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "estudos-planejados"}
          onClick={() => handleStepClick("estudos-planejados")}
        >
          <Beaker className="h-4 w-4" />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "estudos-andamento"}
          onClick={() => handleStepClick("estudos-andamento")}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "estudos-concluidos"}
          onClick={() => handleStepClick("estudos-concluidos")}
        >
          <CheckCheck className="h-4 w-4" />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "ora-biomedical"}
          onClick={() => handleStepClick("ora-biomedical")}
        >
          <Database className="h-4 w-4" />
          <span>Ora Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "nutraceu-gerenciamento"}
          onClick={() => handleStepClick("nutraceu-gerenciamento")}
        >
          <Microscope className="h-4 w-4" />
          <span>Gerenciamento de Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          active={currentStep === "pesquisa-estudos"}
          onClick={() => handleStepClick("pesquisa-estudos")}
        >
          <Microscope className="h-4 w-4" />
          <span>Pesquisa de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
