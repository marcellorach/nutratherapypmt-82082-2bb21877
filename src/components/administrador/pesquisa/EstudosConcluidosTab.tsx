
import React from 'react';
import { useTranslation } from 'react-i18next';
import StudyCard from './components/StudyCard';
import MortalityChart from './components/MortalityChart';
import { Study } from './types/oraBiomedical';
import { completedStudies } from './data/oraBiomedicalData';
import { getLocalizedCompletedStudy } from './utils/studyLocalizationHelper';

// Dados completos do estudo de mortalidade
const completedMortalityData = [
  { age: 1, control: 1, treatment: 1 },
  { age: 5, control: 0.98, treatment: 1 },
  { age: 9, control: 0.85, treatment: 0.92 },
  { age: 13, control: 0.45, treatment: 0.72 },
  { age: 17, control: 0.15, treatment: 0.38 },
  { age: 21, control: 0, treatment: 0.12 },
];

const EstudosConcluidosTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const localizedStudies = completedStudies.map(study => 
    getLocalizedCompletedStudy(study, i18n.language as 'pt' | 'en')
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('admin.studies.completedStudies.title')}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MortalityChart data={completedMortalityData} isComplete={true} />
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('admin.studies.completedStudies.finalResults')}</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">{t('admin.studies.completedStudies.totalPopulation')}</span>
              <span>100 {t('admin.studies.completedStudies.cElegans')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">{t('admin.studies.completedStudies.studyDuration')}</span>
              <span>21 {t('admin.studies.completedStudies.days')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">{t('admin.studies.completedStudies.lifeExtension')}</span>
              <span>+23.5% {t('admin.studies.completedStudies.inTreatmentGroup')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">{t('admin.studies.completedStudies.statisticalSignificance')}</span>
              <span>p &lt; 0.001</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">{t('admin.studies.completedStudies.experimentStatus')}</span>
              <span className="text-green-600 font-medium">{t('admin.studies.completedStudies.completed')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold">{t('admin.studies.completedStudies.finalizedStudies')}</h3>
        {localizedStudies.map((study: Study) => (
          <StudyCard key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
};

export default EstudosConcluidosTab;
