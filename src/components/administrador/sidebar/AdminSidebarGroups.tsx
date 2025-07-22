
import React from 'react';
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu
} from "@/components/ui/sidebar";
import KnowledgeBaseGroup from './groups/KnowledgeBaseGroup';
import DataProcessingGroup from './groups/DataProcessingGroup';
import ActionsGroup from './groups/ActionsGroup';
import ResearchGroup from './groups/ResearchGroup';
import ConfigurationGroup from './groups/ConfigurationGroup';
import { Microscope, Zap } from "lucide-react";
import { useSearchParams } from 'react-router-dom';

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({ currentStep, setCurrentStep }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
    setSearchParams({ tab: step });
  };

  return (
    <>
      {/* Base de Conhecimento */}
      <SidebarGroup>
        <SidebarGroupLabel>Base de Conhecimento</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <KnowledgeBaseGroup 
              currentStep={currentStep} 
              handleStepClick={handleStepClick} 
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      {/* Processamento de Dados */}
      <SidebarGroup>
        <SidebarGroupLabel>Processamento de Dados</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <DataProcessingGroup 
              currentStep={currentStep} 
              handleStepClick={handleStepClick} 
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Ações - Nova Seção */}
      <SidebarGroup>
        <SidebarGroupLabel>
          <Zap className="mr-2 h-4 w-4" />
          Ações
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <ActionsGroup
              currentStep={currentStep}
              handleStepClick={handleStepClick}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Pesquisa e Desenvolvimento - Agora com Modelos Preditivos */}
      <SidebarGroup>
        <SidebarGroupLabel>
          <Microscope className="mr-2 h-4 w-4" />
          Pesquisa e Desenvolvimento
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <ResearchGroup
              currentStep={currentStep}
              handleStepClick={handleStepClick}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      {/* Configuração - Sem Analytics e Ações em Massa */}
      <SidebarGroup>
        <SidebarGroupLabel>Configuração</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <ConfigurationGroup 
              currentStep={currentStep} 
              handleStepClick={handleStepClick} 
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default AdminSidebarGroups;
