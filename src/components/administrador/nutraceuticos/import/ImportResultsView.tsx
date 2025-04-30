
import React from 'react';
import { Card } from '@/components/ui/card';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import SummaryHeader from './results/SummaryHeader';
import StatsGrid from './results/StatsGrid';
import WarningsAlert from './results/WarningsAlert';
import NutraceuticalsList from './results/NutraceuticalsList';
import StudyFilesList from './results/StudyFilesList';
import ActionFooter from './results/ActionFooter';

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
        <ActionFooter onImport={onImport} onCancel={onCancel} />
      </Card>
    </div>
  );
};

export default ImportResultsView;
