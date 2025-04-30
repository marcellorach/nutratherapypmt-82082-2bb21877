
import React from 'react';
import { Card } from '@/components/ui/card';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import SummaryHeader from './results/SummaryHeader';
import StatsGrid from './results/StatsGrid';
import WarningsAlert from './results/WarningsAlert';
import NutraceuticalsList from './results/NutraceuticalsList';
import StudyFilesList from './results/StudyFilesList';
import ActionFooter from './results/ActionFooter';
import { useAnalysisResults } from '@/hooks/ntai/useAnalysisResults';

interface ImportResultsViewProps {
  results: any;
  onImport: () => void;
  onCancel: () => void;
  studyFiles?: StudyPdfFile[];
}

const ImportResultsView: React.FC<ImportResultsViewProps> = ({
  results,
  onImport,
  onCancel,
  studyFiles = []
}) => {
  const { importResultsToDatabase, isImporting, importSuccess } = useAnalysisResults();
  
  // Preparar os resultados completos para importação
  const handleImport = async () => {
    // Adicionar os arquivos de estudo para o resultado completo
    const completeResults = {
      ...results,
      studyFiles,
      timestamp: new Date().toISOString()
    };
    
    await importResultsToDatabase(completeResults);
    onImport();
  };

  return (
    <div className="space-y-6">
      <SummaryHeader 
        originalFileName={results.originalFileName} 
        processedAt={results.processedAt}
      />
      
      <StatsGrid 
        nutraceuticalsCount={results.nutraceuticalsCount}
        conditionsCount={results.conditionsCount}
        relationsCount={results.relationsCount}
      />
      
      <WarningsAlert warnings={results.warnings} />

      <Card>
        <NutraceuticalsList nutraceuticals={results.nutraceuticals} />
        <StudyFilesList studyFiles={studyFiles} />
        <ActionFooter 
          onImport={handleImport} 
          onCancel={onCancel} 
          isImporting={isImporting}
          importSuccess={importSuccess}
        />
      </Card>
    </div>
  );
};

export default ImportResultsView;
