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

  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Study filter banner */}
        {studyId && studyName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-800 dark:text-green-300 truncate">
              {t('knowledgeGraph.filteringByStudy', 'Filtrando por')}: <strong className="font-semibold">{studyName}</strong>
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-auto flex-shrink-0 hover:bg-green-200 dark:hover:bg-green-900"
              onClick={onClearStudyFilter}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

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
