import React from 'react';
import StatsCard from './StatsCard';
import { useTranslation } from 'react-i18next';

interface StatsGridProps {
  nutraceuticalsCount: number;
  conditionsCount: number;
  relationsCount: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({ 
  nutraceuticalsCount, 
  conditionsCount, 
  relationsCount 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title={t('import.results.stats.nutraceuticals.title')}
        value={nutraceuticalsCount}
        description={t('import.results.stats.nutraceuticals.description')}
      />
      <StatsCard
        title={t('import.results.stats.conditions.title')}
        value={conditionsCount}
        description={t('import.results.stats.conditions.description')}
      />
      <StatsCard
        title={t('import.results.stats.relations.title')}
        value={relationsCount}
        description={t('import.results.stats.relations.description')}
      />
    </div>
  );
};

export default StatsGrid;
