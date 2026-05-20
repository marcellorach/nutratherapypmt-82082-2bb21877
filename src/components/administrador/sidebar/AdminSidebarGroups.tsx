
import React from 'react';
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu
} from "@/components/ui/sidebar";
import KnowledgeBaseGroup from './groups/KnowledgeBaseGroup';
import DataProcessingGroup from './groups/DataProcessingGroup';
import ResearchGroup from './groups/ResearchGroup';
import ConfigurationGroup from './groups/ConfigurationGroup';
import GovernanceAIGroup from './groups/GovernanceAIGroup';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({ currentStep, setCurrentStep }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
    setSearchParams({ tab: step });
  };

  return (
    <>
      {/* Base Conhecimento/Relacional */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.knowledgeBase.title')}
        </SidebarGroupLabel>
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
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.dataProcessing.title')}
        </SidebarGroupLabel>
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
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.research.title')}
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
      
      {/* Configuração */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.configuration.title')}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <ConfigurationGroup 
              currentStep={currentStep} 
              handleStepClick={handleStepClick} 
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Governança & IA */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.governanceAI.title', 'Governança & IA')}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <GovernanceAIGroup
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
