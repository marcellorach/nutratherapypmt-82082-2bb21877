import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Network, Link2, TrendingUp, TrendingDown, MousePointerClick } from 'lucide-react';
import type { GraphStructureStats } from '@/hooks/useKnowledgeGraphStats';

interface KGGraphStructureRowProps {
  stats: GraphStructureStats | null;
  isLoading: boolean;
  onCardClick?: (type: string) => void;
}

export const KGGraphStructureRow: React.FC<KGGraphStructureRowProps> = ({
  stats,
  isLoading,
  onCardClick
}) => {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'total-nodes',
      icon: Network,
      value: stats?.totalNodes || 0,
      label: t('knowledgeGraph.statsSection.graph.totalNodes', 'Total Nós'),
      description: t('knowledgeGraph.statsSection.graph.totalNodesDesc', 'Todas as entidades no grafo'),
      color: 'text-slate-600',
      bgHover: 'hover:border-slate-500/50'
    },
    {
      id: 'total-relations',
      icon: Link2,
      value: stats?.totalRelations || 0,
      label: t('knowledgeGraph.statsSection.graph.totalRelations', 'Total Relações'),
      description: t('knowledgeGraph.statsSection.graph.totalRelationsDesc', 'Todas as arestas do grafo'),
      color: 'text-slate-600',
      bgHover: 'hover:border-slate-500/50'
    },
    {
      id: 'positive-relations',
      icon: TrendingUp,
      value: stats?.positiveRelations || 0,
      label: t('knowledgeGraph.statsSection.graph.positiveRelations', 'Positivas'),
      description: t('knowledgeGraph.statsSection.graph.positiveRelationsDesc', 'TREATS, PREVENTS, SUPPORTS...'),
      color: 'text-green-600',
      bgHover: 'hover:border-green-500/50'
    },
    {
      id: 'negative-relations',
      icon: TrendingDown,
      value: stats?.negativeRelations || 0,
      label: t('knowledgeGraph.statsSection.graph.negativeRelations', 'Negativas'),
      description: t('knowledgeGraph.statsSection.graph.negativeRelationsDesc', 'WORSENS, CONTRAINDICATED...'),
      color: 'text-red-600',
      bgHover: 'hover:border-red-500/50'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('knowledgeGraph.statsSection.graph.title', 'Estrutura do Grafo (Neo4j)')}
          </h3>
        </div>
        {!isLoading && stats && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px]">
                  {t('knowledgeGraph.statsSection.graph.coverageNutra', 'Nutracêuticos')}: {stats.coverageNutraceuticals}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('knowledgeGraph.statsSection.graph.coverageNutraDesc', 'Percentual de nutracêuticos com relações no grafo')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px]">
                  {t('knowledgeGraph.statsSection.graph.coverageCond', 'Condições')}: {stats.coverageConditions}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('knowledgeGraph.statsSection.graph.coverageCondDesc', 'Percentual de condições com tratamentos mapeados')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
