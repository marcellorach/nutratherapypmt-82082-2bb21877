import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, FlaskConical, Heart, Target, GitBranch, MousePointerClick } from 'lucide-react';
import type { BaseKnowledgeStats } from '@/hooks/useKnowledgeGraphStats';

interface KGBaseKnowledgeRowProps {
  stats: BaseKnowledgeStats | null;
  isLoading: boolean;
  onCardClick?: (type: string) => void;
}

export const KGBaseKnowledgeRow: React.FC<KGBaseKnowledgeRowProps> = ({
  stats,
  isLoading,
  onCardClick
}) => {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'ontology-manual',
      icon: Database,
      value: stats?.ontologyManual || 0,
      label: t('knowledgeGraph.statsSection.base.ontologyManual', 'Ontologia Manual'),
      description: t('knowledgeGraph.statsSection.base.ontologyManualDesc', 'Entidades cadastradas pelo admin'),
      color: 'text-blue-600',
      bgHover: 'hover:border-blue-500/50'
    },
    {
      id: 'ontology-chebi',
      icon: FlaskConical,
      value: stats?.ontologyChEBI || 0,
      label: t('knowledgeGraph.statsSection.base.chebi', 'ChEBI (Química)'),
      description: t('knowledgeGraph.statsSection.base.chebiDesc', 'Compostos químicos de ontologia externa'),
      color: 'text-purple-600',
      bgHover: 'hover:border-purple-500/50'
    },
    {
      id: 'nutraceuticals',
      icon: FlaskConical,
      value: stats?.nutraceuticals || 0,
      label: t('knowledgeGraph.statsSection.base.nutraceuticals', 'Nutracêuticos'),
      description: t('knowledgeGraph.statsSection.base.nutraceuticalsDesc', 'Cadastrados no sistema'),
      color: 'text-cyan-600',
      bgHover: 'hover:border-cyan-500/50'
    },
    {
      id: 'conditions',
      icon: Heart,
      value: stats?.conditions || 0,
      label: t('knowledgeGraph.statsSection.base.conditions', 'Condições'),
      description: t('knowledgeGraph.statsSection.base.conditionsDesc', 'Condições de saúde veterinárias'),
      color: 'text-rose-600',
      bgHover: 'hover:border-rose-500/50'
    },
    {
      id: 'outcomes',
      icon: Target,
      value: stats?.outcomes || 0,
      label: t('knowledgeGraph.statsSection.base.outcomes', 'Desfechos'),
      description: t('knowledgeGraph.statsSection.base.outcomesDesc', 'Famílias de outcomes'),
      color: 'text-amber-600',
      bgHover: 'hover:border-amber-500/50'
    },
    {
      id: 'pathways',
      icon: GitBranch,
      value: stats?.pathways || 0,
      label: t('knowledgeGraph.statsSection.base.pathways', 'Pathways'),
      description: t('knowledgeGraph.statsSection.base.pathwaysDesc', 'Vias biológicas'),
      color: 'text-emerald-600',
      bgHover: 'hover:border-emerald-500/50'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('knowledgeGraph.statsSection.base.title', 'Base de Conhecimento')}
          </h3>
        </div>
        {!isLoading && stats && (
          <span className="text-xs text-muted-foreground">
            {t('knowledgeGraph.statsSection.base.subtotal', 'Total: {{count}} entidades', { count: stats.total })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
