import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Zap, ArrowRight } from 'lucide-react';
import { CausalLink, SynergisticCompound } from '@/hooks/useConditionInsights';
import { cn } from '@/lib/utils';

interface ComorbidityMapProps {
  conditions: string[];
  causalPathways: CausalLink[];
  synergisticCompounds: SynergisticCompound[];
}

const predicateColors: Record<string, string> = {
  CAUSES: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300',
  AGGRAVATES: 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  LEADS_TO: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  TRIGGERS: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300',
  ASSOCIATED_WITH: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
};

const ComorbidityMap: React.FC<ComorbidityMapProps> = ({ conditions, causalPathways, synergisticCompounds }) => {
  const { t } = useTranslation();

  if (causalPathways.length === 0 && synergisticCompounds.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-amber-500" />
          {t('petProfile.conditionInsights.comorbidityMap')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.conditionInsights.comorbidityDesc')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Causal pathways */}
        {causalPathways.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('petProfile.conditionInsights.interConditionPaths')}
            </h4>
            <div className="space-y-2">
              {causalPathways.map((path, i) => {
                const predStyle = predicateColors[path.predicate] || predicateColors.ASSOCIATED_WITH;
                return (
                  <div key={i} className={cn('flex items-center gap-2 p-2 rounded-md border text-xs', predStyle)}>
                    <span className="font-semibold">{path.subject_name}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="italic opacity-80">
                      {t(`petProfile.conditionInsights.predicates.${path.predicate}`, path.predicate.toLowerCase().replace('_', ' '))}
                    </span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="font-semibold">{path.object_name}</span>
                    {path.extraction_confidence && (
                      <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                        {Math.round(path.extraction_confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Synergistic compounds */}
        {synergisticCompounds.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              {t('petProfile.conditionInsights.synergisticCompounds')}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              {t('petProfile.conditionInsights.synergisticDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {synergisticCompounds.slice(0, 8).map((sc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-md border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {sc.compound}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sc.conditionsTreated.map((cond, j) => (
                        <Badge key={j} variant="outline" className="text-[10px] h-4 px-1">
                          {cond}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px] h-5 px-1.5 flex-shrink-0">
                    {sc.coverageCount} {t('petProfile.conditionInsights.conditions')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComorbidityMap;
