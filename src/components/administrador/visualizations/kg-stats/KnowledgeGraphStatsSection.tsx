import React from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { KGBaseKnowledgeRow } from './KGBaseKnowledgeRow';
import { KGExtractedKnowledgeRow } from './KGExtractedKnowledgeRow';
import { KGGraphStructureRow } from './KGGraphStructureRow';
import { useKnowledgeGraphStats } from '@/hooks/useKnowledgeGraphStats';

interface KnowledgeGraphStatsSectionProps {
  onCardClick?: (type: string) => void;
  studyId?: string;
  studyName?: string;
  onClearStudyFilter?: () => void;
}

export const KnowledgeGraphStatsSection: React.FC<KnowledgeGraphStatsSectionProps> = ({
  onCardClick,
  studyId,
  studyName,
  onClearStudyFilter
}) => {
  const { stats, isLoading } = useKnowledgeGraphStats(studyId);

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
