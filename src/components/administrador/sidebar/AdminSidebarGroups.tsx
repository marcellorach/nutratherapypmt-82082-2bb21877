
import React from 'react';
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu
} from "@/components/ui/sidebar";
import KnowledgeBaseGroup from './groups/KnowledgeBaseGroup';
import DataProcessingGroup from './groups/DataProcessingGroup';
import PredictiveAnalysisGroup from './groups/PredictiveAnalysisGroup';
import ConfigurationGroup from './groups/ConfigurationGroup';
import ResearchGroup from './groups/ResearchGroup';
import { Microscope } from "lucide-react";
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

      {/* Pesquisa e Desenvolvimento */}
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

      {/* Análise Preditiva */}
      <SidebarGroup>
        <SidebarGroupLabel>Análise Preditiva</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <PredictiveAnalysisGroup 
              currentStep={currentStep} 
              handleStepClick={handleStepClick} 
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      {/* Configuração */}
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
