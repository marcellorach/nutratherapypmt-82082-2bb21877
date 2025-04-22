
import React from 'react';
import { Beaker, BookOpen, Microscope, Network, Settings } from "lucide-react";
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
          <BookOpen />
          <span>Estudos Científicos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "nutraceuticos"} 
          onClick={() => handleStepClick("nutraceuticos")}
        >
          <Beaker />
          <span>Nutracêuticos</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "relacoes"} 
          onClick={() => handleStepClick("relacoes")}
        >
          <Network />
          <span>Relações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "regras"} 
          onClick={() => handleStepClick("regras")}
        >
          <Microscope />
          <span>Regras Clínicas</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "knowledge-base-settings"} 
          onClick={() => handleStepClick("knowledge-base-settings")}
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default KnowledgeBaseGroup;
