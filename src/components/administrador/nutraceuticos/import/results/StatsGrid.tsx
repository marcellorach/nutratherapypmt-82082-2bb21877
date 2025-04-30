
import React from 'react';
import StatsCard from './StatsCard';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Nutracêuticos"
        value={nutraceuticalsCount}
        description="nutracêuticos identificados"
      />
      <StatsCard
        title="Condições"
        value={conditionsCount}
        description="condições de saúde identificadas"
      />
      <StatsCard
        title="Relações"
        value={relationsCount}
        description="relações nutracêutico-condição encontradas"
      />
    </div>
  );
};

export default StatsGrid;
