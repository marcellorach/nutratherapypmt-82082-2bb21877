
import React, { useState } from 'react';
import AdminLayout from '@/components/administrador/AdminLayout';
import ImportStep from '@/components/administrador/dataAnalysis/ImportStep';
import AnalysisStep from '@/components/administrador/dataAnalysis/AnalysisStep';
import VisualizationStep from '@/components/administrador/dataAnalysis/VisualizationStep';
import ActionsStep from '@/components/administrador/dataAnalysis/ActionsStep';
import NutraceuticosTab from '@/components/administrador/NutraceuticosTab';
import EstudosTab from '@/components/administrador/EstudosTab';
import PromptsTab from '@/components/administrador/PromptsTab';
import RelationsTab from '@/components/administrador/visualizations/relations/RelationsTab';
import AnalyticsTab from '@/components/administrador/AnalyticsTab';
import RegrasClinicasTab from '@/components/administrador/RegrasClinicasTab';
import FontesTab from '@/components/administrador/FontesTab';
import ModelosPreditivosTab from '@/components/administrador/ModelosPreditivosTab';
import CustoBeneficioTab from '@/components/administrador/CustoBeneficioTab';
import ConfiguracoesIATab from '@/components/administrador/ConfiguracoesIATab';
import DesignConventionsTab from '@/components/administrador/DesignConventionsTab';

import EstudosPlanejadosTab from '@/components/administrador/pesquisa/EstudosPlanejadosTab';
import EstudosAndamentoTab from '@/components/administrador/pesquisa/EstudosAndamentoTab';
import EstudosConcluidosTab from '@/components/administrador/pesquisa/EstudosConcluidosTab';
import SugestoesAITab from '@/components/administrador/pesquisa/SugestoesAITab';
import OraBiomedicalTab from '@/components/administrador/pesquisa/OraBiomedicalTab';
import PesquisaEstudosTab from '@/components/administrador/pesquisa/PesquisaEstudosTab';

import KnowledgeBaseSettingsTab from '@/components/administrador/settings/KnowledgeBaseSettingsTab';
import DataProcessingSettingsTab from '@/components/administrador/settings/DataProcessingSettingsTab';
import ResearchSettingsTab from '@/components/administrador/settings/ResearchSettingsTab';
import PredictiveAnalysisSettingsTab from '@/components/administrador/settings/PredictiveAnalysisSettingsTab';

const AdministradorPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>("estudos");
  
  const renderContent = () => {
    switch (currentStep) {
      case "nutraceuticos":
        return <NutraceuticosTab />;
      case "estudos":
        return <EstudosTab />;
      case "regras":
        return <RegrasClinicasTab />;
      case "relacoes":
        return <RelationsTab />;
      case "knowledge-base-settings":
        return <KnowledgeBaseSettingsTab />;
      
      case "import":
        return <ImportStep />;
      case "fontes":
        return <FontesTab />;
      case "analysis":
        return <AnalysisStep />;
      case "visualization":
        return <VisualizationStep />;
      case "data-processing-settings":
        return <DataProcessingSettingsTab />;
      
      case "estudos-planejados":
        return <EstudosPlanejadosTab />;
      case "estudos-andamento":
        return <EstudosAndamentoTab />;
      case "estudos-concluidos":
        return <EstudosConcluidosTab />;
      case "sugestoes-ai":
        return <SugestoesAITab />;
      case "ora-biomedical":
        return <OraBiomedicalTab />;
      case "pesquisa-estudos":
        return <PesquisaEstudosTab />;
      case "research-settings":
        return <ResearchSettingsTab />;
      
      case "modelos":
        return <ModelosPreditivosTab />;
      case "custo-beneficio":
        return <CustoBeneficioTab />;
      case "relatorios":
        return <div className="p-8 text-center text-gray-500">Relatórios (Em desenvolvimento)</div>;
      case "predictive-analysis-settings":
        return <PredictiveAnalysisSettingsTab />;
      
      case "config-ia":
        return <ConfiguracoesIATab />;
      case "prompts":
        return <PromptsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "actions":
        return <ActionsStep />;
      case "design-conventions":
        return <DesignConventionsTab />;
      
      default:
        return <EstudosTab />;
    }
  };
  
  return (
    <AdminLayout currentStep={currentStep} setCurrentStep={setCurrentStep}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdministradorPage;
