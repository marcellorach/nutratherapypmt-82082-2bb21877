
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Beaker, FlaskConical, CheckCheck, Database } from "lucide-react";
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
          isActive={currentStep === "sugestoes-ai"}
          onClick={() => handleStepClick("sugestoes-ai")}
        >
          <Beaker className="h-4 w-4" />
          <span>Proposição de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-planejados"}
          onClick={() => handleStepClick("estudos-planejados")}
        >
          <Beaker className="h-4 w-4" />
          <span>Estudos Planejados</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-andamento"}
          onClick={() => handleStepClick("estudos-andamento")}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Estudos em Andamento</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-concluidos"}
          onClick={() => handleStepClick("estudos-concluidos")}
        >
          <CheckCheck className="h-4 w-4" />
          <span>Estudos Concluídos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "ora-biomedical"}
          onClick={() => handleStepClick("ora-biomedical")}
        >
          <Database className="h-4 w-4" />
          <span>Ora Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
