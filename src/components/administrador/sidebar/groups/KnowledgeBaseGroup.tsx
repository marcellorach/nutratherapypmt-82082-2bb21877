
import React from 'react';
import { Beaker, BookOpen, Database, Network, Settings, ListChecks } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface KnowledgeBaseGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const KnowledgeBaseGroup: React.FC<KnowledgeBaseGroupProps> = ({ 
  currentStep, 
  handleStepClick 
}) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "estudos"} 
          onClick={() => handleStepClick("estudos")}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          <span>Estudos Científicos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceu-gerenciamento"} 
          onClick={() => handleStepClick("nutraceu-gerenciamento")}
        >
          <Database className="h-4 w-4 mr-2" />
          <span>Banco de Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceuticos"} 
          onClick={() => handleStepClick("nutraceuticos")}
        >
          <Beaker className="h-4 w-4 mr-2" />
          <span>Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "relacoes"} 
          onClick={() => handleStepClick("relacoes")}
        >
          <Network className="h-4 w-4 mr-2" />
          <span>Relações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "regras"} 
          onClick={() => handleStepClick("regras")}
        >
          <Microscope className="h-4 w-4 mr-2" />
          <span>Regras Clínicas</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "outcomes-management"} 
          onClick={() => handleStepClick("outcomes-management")}
        >
          <ListChecks className="h-4 w-4 mr-2" />
          <span>Gerenciar Outcomes</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "knowledge-base-settings"} 
          onClick={() => handleStepClick("knowledge-base-settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          <span>Configurações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default KnowledgeBaseGroup;
