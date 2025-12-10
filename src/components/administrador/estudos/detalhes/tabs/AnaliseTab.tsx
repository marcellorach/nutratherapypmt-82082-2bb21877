
import React from 'react';
import { FlaskConical, AlertCircle } from "lucide-react";
import ExtractedDataVisualization from '../../visualization/ExtractedDataVisualization';

interface AnaliseTabProps {
  estudo: any;
}

const AnaliseTab: React.FC<AnaliseTabProps> = ({ estudo }) => {
  // Extract analysis_data from the study
  const analysisData = estudo?.analysis_data;
  const hasExtractedData = analysisData && (
    analysisData.study_population ||
    analysisData.structured_dosages?.length > 0 ||
    analysisData.biomarkers?.length > 0 ||
    analysisData.detailed_side_effects?.length > 0 ||
    analysisData.contraindications?.length > 0 ||
    analysisData.drug_interactions?.length > 0 ||
    analysisData.synergies?.length > 0
  );

  return (
    <div className="space-y-4">
      {!hasExtractedData ? (
        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md text-sm">
          <p className="text-yellow-700 flex items-center">
            <FlaskConical className="h-4 w-4 mr-2" />
            A análise da IA está processando o conteúdo completo do estudo
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm">
          <p className="text-green-700 flex items-center">
            <FlaskConical className="h-4 w-4 mr-2" />
            Dados extraídos com sucesso pela IA
          </p>
        </div>
      )}

      {/* Visualization of extracted data */}
      <ExtractedDataVisualization analysisData={analysisData} />

      {/* Legacy metrics section - only show if no extracted data */}
      {!hasExtractedData && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Aguardando Extração</h4>
            <p className="text-sm text-muted-foreground">
              Processe o estudo para extrair automaticamente: população, dosagens, 
              biomarcadores, efeitos adversos, contraindicações e interações.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Use o botão "Processar" no pipeline para iniciar a extração</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnaliseTab;
