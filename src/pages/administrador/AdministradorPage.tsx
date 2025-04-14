
import React, { useState } from 'react';
import AdminLayout from '@/components/administrador/AdminLayout';
import ImportStep from '@/components/administrador/dataAnalysis/ImportStep';
import AnalysisStep from '@/components/administrador/dataAnalysis/AnalysisStep';
import VisualizationStep from '@/components/administrador/dataAnalysis/VisualizationStep';
import ActionsStep from '@/components/administrador/dataAnalysis/ActionsStep';
import NutraceuticosTab from '@/components/administrador/NutraceuticosTab';
import EstudosTab from '@/components/administrador/EstudosTab';
import PromptsTab from '@/components/administrador/PromptsTab';
import AnalyticsTab from '@/components/administrador/AnalyticsTab';
import RegrasClinicasTab from '@/components/administrador/RegrasClinicasTab';
import FontesTab from '@/components/administrador/FontesTab';
import ModelosPreditivosTab from '@/components/administrador/ModelosPreditivosTab';
import CustoBeneficioTab from '@/components/administrador/CustoBeneficioTab';
import ConfiguracoesIATab from '@/components/administrador/ConfiguracoesIATab';

// Importando os componentes de Pesquisa e Desenvolvimento
import EstudosPlanejadosTab from '@/components/administrador/pesquisa/EstudosPlanejadosTab';
import EstudosAndamentoTab from '@/components/administrador/pesquisa/EstudosAndamentoTab';
import EstudosConcluidosTab from '@/components/administrador/pesquisa/EstudosConcluidosTab';
import SugestoesAITab from '@/components/administrador/pesquisa/SugestoesAITab';
import OraBiomedicalTab from '@/components/administrador/pesquisa/OraBiomedicalTab';

const AdministradorPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>("import");
  
  const renderContent = () => {
    switch (currentStep) {
      // Base de Conhecimento
      case "nutraceuticos":
        return <NutraceuticosTab />;
      case "estudos":
        return <EstudosTab />;
      case "regras":
        return <RegrasClinicasTab />;

      // Processamento de Dados
      case "import":
        return <ImportStep />;
      case "fontes":
        return <FontesTab />;
      case "analysis":
        return <AnalysisStep />;
      case "visualization":
        return <VisualizationStep />;

      // Pesquisa e Desenvolvimento
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

      // Análise Preditiva
      case "modelos":
        return <ModelosPreditivosTab />;
      case "custo-beneficio":
        return <CustoBeneficioTab />;
      case "relatorios":
        return <div className="p-8 text-center text-gray-500">Relatórios (Em desenvolvimento)</div>;

      // Configuração
      case "config-ia":
        return <ConfiguracoesIATab />;
      case "prompts":
        return <PromptsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "actions":
        return <ActionsStep />;
      default:
        return null;
    }
  };
  
  return (
    <AdminLayout currentStep={currentStep} setCurrentStep={setCurrentStep}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdministradorPage;
