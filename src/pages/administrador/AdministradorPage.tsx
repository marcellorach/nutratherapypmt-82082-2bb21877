
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"; // Adicionando import do Button
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
import OutcomeManagementPanel from '@/components/administrador/settings/panels/OutcomeManagementPanel';

import EstudosPlanejadosTab from '@/components/administrador/pesquisa/EstudosPlanejadosTab';
import EstudosAndamentoTab from '@/components/administrador/pesquisa/EstudosAndamentoTab';
import EstudosConcluidosTab from '@/components/administrador/pesquisa/EstudosConcluidosTab';
import SugestoesAITab from '@/components/administrador/pesquisa/SugestoesAITab';
import OraBiomedicalTab from '@/components/administrador/pesquisa/OraBiomedicalTab';
import PesquisaEstudosTab from '@/components/administrador/pesquisa/PesquisaEstudosTab';
import NutraceuticoGerenciamentoTab from '@/components/administrador/pesquisa/NutraceuticoGerenciamentoTab';

import KnowledgeBaseSettingsTab from '@/components/administrador/settings/KnowledgeBaseSettingsTab';
import DataProcessingSettingsTab from '@/components/administrador/settings/DataProcessingSettingsTab';
import ResearchSettingsTab from '@/components/administrador/settings/ResearchSettingsTab';
import PredictiveAnalysisSettingsTab from '@/components/administrador/settings/PredictiveAnalysisSettingsTab';

const AdministradorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab');
  const [currentStep, setCurrentStep] = useState<string>(tabParam || "estudos");
  
  // Atualiza a URL quando o passo atual muda
  const handleStepChange = (newStep: string) => {
    setCurrentStep(newStep);
    setSearchParams({ tab: newStep });
  };
  
  // Efeito para sincronizar o estado com os parâmetros da URL quando eles mudam
  useEffect(() => {
    if (tabParam && tabParam !== currentStep) {
      setCurrentStep(tabParam);
    }
  }, [tabParam, currentStep]);
  
  const renderContent = () => {
    try {
      switch (currentStep) {
        case "nutraceuticos":
          return <NutraceuticosTab />;
        case "nutraceu-gerenciamento":
          return <NutraceuticoGerenciamentoTab />;
        case "estudos":
          return <EstudosTab />;
        case "regras":
          return <RegrasClinicasTab />;
        case "relacoes":
          return <RelationsTab />;
        case "knowledge-base-settings":
          return <KnowledgeBaseSettingsTab />;
        case "outcomes-management":
          return <OutcomeManagementPanel />;
        
        case "import":
          return <ImportStep />;
        case "fontes":
          return <FontesTab />;
        case "analysis":
          return <AnalysisStep />;
        case "visualization":
          return <VisualizationStep />;
        case "actions":
          return <ActionsStep />;
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
        case "design-conventions":
          return <DesignConventionsTab />;
        
        default:
          return <EstudosTab />;
      }
    } catch (error) {
      console.error("Erro ao renderizar conteúdo:", error);
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">Erro ao carregar conteúdo</h2>
          <p className="text-gray-600 mt-2">Ocorreu um erro ao carregar esta seção. Por favor, tente novamente.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Recarregar Página
          </Button>
        </div>
      );
    }
  };
  
  return (
    <AdminLayout currentStep={currentStep} setCurrentStep={handleStepChange}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdministradorPage;
