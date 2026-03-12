import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Beaker, GitBranch, Link2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ConditionInsight } from '@/hooks/useConditionInsights';

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  monitoring: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const predicateLabels: Record<string, { label: string; color: string }> = {
  CAUSES: { label: 'causes', color: 'text-red-600 dark:text-red-400' },
  AGGRAVATES: { label: 'aggravates', color: 'text-orange-600 dark:text-orange-400' },
  LEADS_TO: { label: 'leads to', color: 'text-amber-600 dark:text-amber-400' },
  TRIGGERS: { label: 'triggers', color: 'text-red-500 dark:text-red-400' },
  ASSOCIATED_WITH: { label: 'associated with', color: 'text-blue-600 dark:text-blue-400' },
};

interface ConditionInsightCardProps {
  condition: any;
  insight?: ConditionInsight;
  medications?: any[];
}

const ConditionInsightCard: React.FC<ConditionInsightCardProps> = ({ condition, insight, medications }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const matchingMeds = medications?.filter(m =>
    m.medication_name?.toLowerCase().includes(condition.condition_name.toLowerCase()) ||
    condition.notes?.toLowerCase().includes(m.medication_name?.toLowerCase())
  ) || [];

  const treatmentCount = insight?.treatments?.length || 0;
  const causalCount = insight?.causalLinks?.length || 0;
  const mechanismCount = insight?.mechanisms?.length || 0;

  return (
    <Card className={cn(
      'transition-all duration-200',
      expanded && 'ring-1 ring-primary/20'
    )}>
      <button
        className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-sm">{condition.condition_name}</p>
            {condition.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{condition.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {treatmentCount > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
              <Beaker className="h-3 w-3" />
              {treatmentCount}
            </Badge>
          )}
          {causalCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
              <Link2 className="h-3 w-3" />
              {causalCount}
            </Badge>
          )}
          {condition.severity && (
            <Badge variant="outline" className={severityColors[condition.severity]}>
              {t(`petProfile.conditionInsights.severity.${condition.severity}`, condition.severity)}
            </Badge>
          )}
          <Badge variant="outline" className={statusColors[condition.status]}>
            {t(`petProfile.conditionInsights.status.${condition.status}`, condition.status)}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && insight && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          {/* Treatments from KG */}
          {insight.treatments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Beaker className="h-3.5 w-3.5 text-emerald-500" />
                {t('petProfile.conditionInsights.treatments')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {insight.treatments.slice(0, 10).map((tr, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {tr.subject_name}
                    {tr.extraction_confidence && (
                      <span className="text-muted-foreground">
                        {Math.round(tr.extraction_confidence * 100)}%
                      </span>
                    )}
                  </Badge>
                ))}
                {insight.treatments.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{insight.treatments.length - 10}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Causal links */}
          {insight.causalLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-amber-500" />
                {t('petProfile.conditionInsights.causalConnections')}
              </h4>
              <div className="space-y-1">
                {insight.causalLinks.map((link, i) => {
                  const pred = predicateLabels[link.predicate] || { label: link.predicate.toLowerCase(), color: 'text-muted-foreground' };
                  return (
                    <div key={i} className="text-xs flex items-center gap-1.5 py-0.5">
                      <span className="font-medium">{link.subject_name}</span>
                      <span className={cn('italic', pred.color)}>
                        {t(`petProfile.conditionInsights.predicates.${link.predicate}`, pred.label)}
                      </span>
                      <span className="font-medium">{link.object_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mechanisms */}
          {insight.mechanisms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                {t('petProfile.conditionInsights.mechanisms')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {insight.mechanisms.slice(0, 8).map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {m.subject_name} → {m.object_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Linked medications */}
          {matchingMeds.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t('petProfile.conditionInsights.linkedMedications')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {matchingMeds.map((m: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {m.medication_name}
                    {m.dosage && ` · ${m.dosage}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ConditionInsightCard;
