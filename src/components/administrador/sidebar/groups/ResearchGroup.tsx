
import React from 'react';
import { 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { 
  FlaskConical, 
  ClipboardList, 
  CheckSquare,
  Beaker,
  Bot,
  Settings,
  Search,
  Database
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
          isActive={currentStep === "pesquisa-estudos"}
          onClick={() => handleStepClick("pesquisa-estudos")}
          tooltip="Pesquisa de Estudos"
        >
          <Search className="h-4 w-4" />
          <span>Pesquisa de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceu-gerenciamento"}
          onClick={() => handleStepClick("nutraceu-gerenciamento")}
          tooltip="Gerenciamento de Nutracêuticos"
        >
          <Database className="h-4 w-4" />
          <span>Nutracêuticos DB</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
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
          tooltip="Proposições de Estudos"
        >
          <Beaker className="h-4 w-4" />
          <span>Proposições de Estudos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "ora-biomedical"}
          onClick={() => handleStepClick("ora-biomedical")}
          tooltip="Ora Biomedical"
        >
          <Bot className="h-4 w-4" />
          <span>Ora Biomedical</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "research-settings"}
          onClick={() => handleStepClick("research-settings")}
          tooltip="Configurações de P&D"
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
