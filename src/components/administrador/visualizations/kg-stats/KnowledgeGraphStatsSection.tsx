import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KGBaseKnowledgeRow } from './KGBaseKnowledgeRow';
import { KGExtractedKnowledgeRow } from './KGExtractedKnowledgeRow';
import { KGGraphStructureRow } from './KGGraphStructureRow';
import { useKnowledgeGraphStats } from '@/hooks/useKnowledgeGraphStats';

interface KnowledgeGraphStatsSectionProps {
  onCardClick?: (type: string) => void;
}

export const KnowledgeGraphStatsSection: React.FC<KnowledgeGraphStatsSectionProps> = ({
  onCardClick
}) => {
  const { stats, isLoading } = useKnowledgeGraphStats();

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Row 1: Base Knowledge */}
        <KGBaseKnowledgeRow 
          stats={stats?.base || null}
          isLoading={isLoading}
          onCardClick={onCardClick}
        />

        {/* Row 2: Extracted Knowledge */}
        <KGExtractedKnowledgeRow 
          stats={stats?.extracted || null}
          isLoading={isLoading}
          onCardClick={onCardClick}
        />

        {/* Row 3: Graph Structure */}
        <KGGraphStructureRow 
          stats={stats?.graph || null}
          isLoading={isLoading}
          onCardClick={onCardClick}
        />
      </div>
    </TooltipProvider>
  );
};

export default KnowledgeGraphStatsSection;
