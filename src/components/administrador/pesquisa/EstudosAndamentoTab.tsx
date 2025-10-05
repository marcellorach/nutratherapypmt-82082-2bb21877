
import React from 'react';
import { Heart, Dog, PawPrint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ongoingStudiesData } from './data/ongoingStudiesData';
import { getLocalizedStudy } from './utils/studyLocalizationHelper';
import DetailedStudyPanel from './components/DetailedStudyPanel';
import StatsCard from './components/StatsCard';

const EstudosAndamentoTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'pt' | 'en';
  
  const totalDogs = ongoingStudiesData.reduce((sum, study) => sum + study.treatmentCount + study.controlCount, 0);
  const totalStudies = ongoingStudiesData.length;
  const averageProgress = Math.round(ongoingStudiesData.reduce((sum, study) => sum + study.progress, 0) / totalStudies);

  const localizedStudies = ongoingStudiesData.map(study => getLocalizedStudy(study, currentLanguage));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('admin.studies.ongoingStudies.title')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title={t('admin.studies.ongoingStudies.stats.totalDogs')}
          description={t('admin.studies.ongoingStudies.stats.totalDogsDesc')}
          value={totalDogs}
          icon={<Dog className="h-5 w-5" />}
          color="text-blue-600"
        />
        
        <StatsCard 
          title={t('admin.studies.ongoingStudies.stats.activeStudies')}
          description={t('admin.studies.ongoingStudies.stats.activeStudiesDesc')}
          value={totalStudies}
          icon={<PawPrint className="h-5 w-5" />}
          color="text-amber-600"
        />
        
        <StatsCard 
          title={t('admin.studies.ongoingStudies.stats.averageProgress')}
          description={t('admin.studies.ongoingStudies.stats.averageProgressDesc')}
          value={`${averageProgress}%`}
          icon={<Heart className="h-5 w-5" />}
          color="text-rose-600"
          footer={t('admin.studies.ongoingStudies.stats.updatedDaily')}
        />
      </div>

      <div className="space-y-6 mt-8">
        {localizedStudies.map((study) => (
          <DetailedStudyPanel key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
};

export default EstudosAndamentoTab;
