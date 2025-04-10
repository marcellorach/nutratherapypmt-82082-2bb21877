
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

const AdministradorPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>("import");
  
  const renderContent = () => {
    switch (currentStep) {
      case "import":
        return <ImportStep />;
      case "analysis":
        return <AnalysisStep />;
      case "visualization":
        return <VisualizationStep />;
      case "actions":
        return <ActionsStep />;
      case "nutraceuticos":
        return <NutraceuticosTab />;
      case "estudos":
        return <EstudosTab />;
      case "prompts":
        return <PromptsTab />;
      case "analytics":
        return <AnalyticsTab />;
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
