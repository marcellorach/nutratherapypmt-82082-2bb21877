import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Link2, FileText, Clock, CheckCircle2, MousePointerClick } from 'lucide-react';
import type { ExtractedKnowledgeStats } from '@/hooks/useKnowledgeGraphStats';

interface KGExtractedKnowledgeRowProps {
  stats: ExtractedKnowledgeStats | null;
  isLoading: boolean;
  onCardClick?: (type: string) => void;
  studyName?: string;
}

export const KGExtractedKnowledgeRow: React.FC<KGExtractedKnowledgeRowProps> = ({
  stats,
  isLoading,
  onCardClick
}) => {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'entities-ai',
      icon: Sparkles,
      value: stats?.entitiesAI || 0,
      label: t('knowledgeGraph.statsSection.extracted.entitiesAI', 'Entidades AI'),
      description: t('knowledgeGraph.statsSection.extracted.entitiesAIDesc', 'Efeitos, mecanismos descobertos por IA'),
      color: 'text-green-600',
      bgHover: 'hover:border-green-500/50'
    },
    {
      id: 'relations-ai',
      icon: Link2,
      value: stats?.relationsAI || 0,
      label: t('knowledgeGraph.statsSection.extracted.relationsAI', 'Relações AI'),
      description: t('knowledgeGraph.statsSection.extracted.relationsAIDesc', 'TREATS, INHIBITS, etc. extraídas'),
      color: 'text-green-600',
      bgHover: 'hover:border-green-500/50'
    },
    {
      id: 'active-studies',
      icon: FileText,
      value: stats?.activeStudies || 0,
      label: t('knowledgeGraph.statsSection.extracted.activeStudies', 'Estudos Ativos'),
      description: t('knowledgeGraph.statsSection.extracted.activeStudiesDesc', 'Contribuindo para o grafo'),
      color: 'text-green-600',
      bgHover: 'hover:border-green-500/50'
    },
    {
      id: 'approved-triplets',
      icon: CheckCircle2,
      value: stats?.approvedTriplets || 0,
      label: t('knowledgeGraph.statsSection.extracted.approvedTriplets', 'Triplets Aprovados'),
      description: t('knowledgeGraph.statsSection.extracted.approvedTripletsDesc', 'Curados e validados'),
      color: 'text-green-600',
      bgHover: 'hover:border-green-500/50'
    },
    {
      id: 'pending-triplets',
      icon: Clock,
      value: stats?.pendingTriplets || 0,
      label: t('knowledgeGraph.statsSection.extracted.pendingTriplets', 'Triplets Pendentes'),
      description: t('knowledgeGraph.statsSection.extracted.pendingTripletsDesc', 'Aguardando curadoria'),
      color: 'text-yellow-600',
      bgHover: 'hover:border-yellow-500/50'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('knowledgeGraph.statsSection.extracted.title', 'Conhecimento Extraído (AI)')}
          </h3>
        </div>
        {!isLoading && stats && (
          <span className="text-xs text-muted-foreground">
            {t('knowledgeGraph.statsSection.extracted.subtotal', 'De {{count}} estudos ativos', { count: stats.activeStudies })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Tooltip key={card.id}>
              <TooltipTrigger asChild>
                <Card 
                  className={`cursor-pointer transition-colors border-2 ${card.bgHover}`}
                  onClick={() => onCardClick?.(card.id)}
                >
                  <CardContent className="py-3 px-3 text-center">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-6 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Icon className={`h-4 w-4 ${card.color}`} />
                          <span className={`text-lg font-bold ${card.color}`}>
                            {card.value.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {card.label}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="text-xs">{card.description}</p>
                <p className="text-[10px] mt-1 text-primary flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  {t('common.clickToExpand', 'Clique para detalhes')}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
