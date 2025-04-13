
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

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({ currentStep, setCurrentStep }) => {
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
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
