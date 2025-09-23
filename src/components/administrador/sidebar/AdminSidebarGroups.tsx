
import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { useSearchParams } from 'react-router-dom';

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({ currentStep, setCurrentStep }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
    setSearchParams({ tab: step });
  };

  return (
    <>
      {/* Base Conhecimento/Relacional */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.groups.knowledgeBase')}
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
          {t('admin.sidebar.groups.dataProcessing')}
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

      {/* Ações */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.groups.actions')}
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

      {/* Pesquisa e Desenvolvimento */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-orange-500">
          {t('admin.sidebar.groups.research')}
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
          {t('admin.sidebar.groups.configuration')}
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
    </>
  );
};

export default AdminSidebarGroups;
