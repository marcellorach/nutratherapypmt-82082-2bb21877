
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
import { useRoleView } from '@/contexts/RoleViewContext';
import { AdminSidebarGroup, isAdminGroupAllowed } from '@/config/role-views';

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({ currentStep, setCurrentStep }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { view } = useRoleView();

  const show = (group: AdminSidebarGroup) => isAdminGroupAllowed(view, group);
  
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
    setSearchParams({ tab: step });
  };

  return (
    <>
      {/* Base Conhecimento/Relacional */}
      {show('knowledge-base') && (
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
      )}
      
      {/* Processamento de Dados */}
      {show('data-processing') && (
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
      )}

      {/* Pesquisa e Desenvolvimento */}
      {show('research') && (
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
      )}
      
      {/* Configuração */}
      {show('configuration') && (
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
      )}

      {/* Governança & IA */}
      {show('governance-ai') && (
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
      )}
    </>
  );
};

export default AdminSidebarGroups;
