import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Beaker, GitBranch, Link2, Shield, Zap, Stethoscope, Brain, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ConditionInsight } from '@/hooks/useConditionInsights';
import NutraceuticalTag from '@/components/administrador/tags/NutraceuticalTag';
import ConditionTag from '@/components/administrador/tags/ConditionTag';

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

const predicateStyles: Record<string, { color: string; symbol: string }> = {
  TREATS: { color: 'text-emerald-600 dark:text-emerald-400', symbol: '→' },
  PREVENTS: { color: 'text-green-500 dark:text-green-400', symbol: '→' },
  AMELIORATES: { color: 'text-teal-600 dark:text-teal-400', symbol: '→' },
  INHIBITS: { color: 'text-red-600 dark:text-red-400', symbol: '⊣' },
  MODULATES: { color: 'text-orange-600 dark:text-orange-400', symbol: '- -→' },
  ACTIVATES: { color: 'text-blue-600 dark:text-blue-400', symbol: '→' },
  CAUSES: { color: 'text-red-600 dark:text-red-400', symbol: '→' },
  AGGRAVATES: { color: 'text-orange-600 dark:text-orange-400', symbol: '→' },
  LEADS_TO: { color: 'text-amber-600 dark:text-amber-400', symbol: '→' },
  TRIGGERS: { color: 'text-red-500 dark:text-red-400', symbol: '→' },
  ASSOCIATED_WITH: { color: 'text-blue-600 dark:text-blue-400', symbol: '——' },
};

const predicateBadgeColors: Record<string, string> = {
  TREATS: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  PREVENTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  AMELIORATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
  INHIBITS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  MODULATES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  ACTIVATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
};

// Suggested pre-treatment exams per condition category
const suggestedExamsMap: Record<string, string[]> = {
  'osteoarthritis': ['conditionExams.inflammatoryMarkers', 'conditionExams.jointXray', 'conditionExams.synovialFluid'],
  'arthritis': ['conditionExams.inflammatoryMarkers', 'conditionExams.jointXray', 'conditionExams.synovialFluid'],
  'hip dysplasia': ['conditionExams.pelvicXray', 'conditionExams.inflammatoryMarkers', 'conditionExams.gaitAnalysis'],
  'cellular senescence': ['conditionExams.telomereLength', 'conditionExams.oxidativeStress', 'conditionExams.sasp'],
  'immune senescence': ['conditionExams.lymphocytePanel', 'conditionExams.immunoglobulins', 'conditionExams.cbc'],
  'oxidative stress': ['conditionExams.oxidativeStress', 'conditionExams.antioxidantCapacity', 'conditionExams.lipidPeroxidation'],
  'cognitive dysfunction': ['conditionExams.neurologicalExam', 'conditionExams.brainMri', 'conditionExams.cognitiveAssessment'],
  'chronic inflammation': ['conditionExams.crp', 'conditionExams.inflammatoryMarkers', 'conditionExams.cbc'],
  'renal': ['conditionExams.renalPanel', 'conditionExams.urinalysis', 'conditionExams.sdma'],
  'hepatic': ['conditionExams.hepaticPanel', 'conditionExams.bileAcids', 'conditionExams.abdominalUltrasound'],
  'cardiac': ['conditionExams.echocardiogram', 'conditionExams.bnp', 'conditionExams.ecg'],
};

function getSuggestedExams(conditionName: string): string[] {
  const lowerName = conditionName.toLowerCase();
  for (const [key, exams] of Object.entries(suggestedExamsMap)) {
    if (lowerName.includes(key)) return exams;
  }
  return [];
}

const originBadgeConfig: Record<string, { icon: string; colorClass: string; key: string }> = {
  vet_diagnosis: { icon: '🩺', colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', key: 'petProfile.conditionOrigin.vetDiagnosis' },
  exam_suggested: { icon: '🧪', colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', key: 'petProfile.conditionOrigin.examSuggested' },
  breed_predisposition: { icon: '🧬', colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', key: 'petProfile.conditionOrigin.breedPredisposition' },
  kg_inference: { icon: '🔬', colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', key: 'petProfile.conditionOrigin.kgInference' },
};

function inferOrigin(condition: any): string {
  // Use the real origin column from the database when available
  if (condition.origin && originBadgeConfig[condition.origin]) {
    return condition.origin;
  }
  // Fallback for legacy data without origin column
  return 'vet_diagnosis';
}

interface ConditionInsightCardProps {
  condition: any;
  insight?: ConditionInsight;
  medications?: any[];
  petBreed?: string;
  petAge?: number;
  mode?: 'simple' | 'full';
  origin?: string;
}

const ConditionInsightCard: React.FC<ConditionInsightCardProps> = ({ condition, insight, medications, petBreed, petAge, mode = 'full', origin }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const resolvedOrigin = origin || inferOrigin(condition);
  const originConfig = originBadgeConfig[resolvedOrigin] || originBadgeConfig.vet_diagnosis;

  const matchingMeds = medications?.filter(m =>
    m.medication_name?.toLowerCase().includes(condition.condition_name.toLowerCase()) ||
    condition.notes?.toLowerCase().includes(m.medication_name?.toLowerCase())
  ) || [];

  const treatmentCount = insight?.treatments?.length || 0;
  const causalCount = insight?.causalLinks?.length || 0;
  const mechanismCount = insight?.mechanisms?.length || 0;
  const modulatorCount = insight?.modulators?.length || 0;
  const suggestedExams = getSuggestedExams(condition.condition_name);

  // Clinical reasoning
  const hasBreedRelevance = petBreed && insight?.causalLinks?.some(l => 
    l.subject_name.toLowerCase().includes('breed') || l.subject_name.toLowerCase().includes('genetic')
  );
  const hasAgeRelevance = petAge && petAge >= 7;
  const hasCausalConnections = causalCount > 0;

  // Simple mode: just show name, severity, status, origin badge
  if (mode === 'simple') {
    return (
      <Card>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">{condition.condition_name}</p>
              {condition.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">{condition.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs gap-1', originConfig.colorClass)}>
              {originConfig.icon} {t(originConfig.key)}
            </Badge>
            {condition.severity && (
              <Badge variant="outline" className={severityColors[condition.severity]}>
                {String(t(`petProfile.conditionInsights.severity.${condition.severity}`, condition.severity))}
              </Badge>
            )}
            <Badge variant="outline" className={statusColors[condition.status]}>
              {String(t(`petProfile.conditionInsights.status.${condition.status}`, condition.status))}
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

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
          <Badge variant="outline" className={cn('text-xs gap-1', originConfig.colorClass)}>
            {originConfig.icon} {t(originConfig.key)}
          </Badge>
          {treatmentCount > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
              <Beaker className="h-3 w-3" />
              {treatmentCount}
            </Badge>
          )}
          {modulatorCount > 0 && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 gap-1">
              <Zap className="h-3 w-3" />
              {modulatorCount}
            </Badge>
          )}
          {causalCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
              <Link2 className="h-3 w-3" />
              {causalCount}
            </Badge>
          )}
          {suggestedExams.length > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 gap-1">
              <ClipboardList className="h-3 w-3" />
              {suggestedExams.length}
            </Badge>
          )}
          {condition.severity && (
            <Badge variant="outline" className={severityColors[condition.severity]}>
              {String(t(`petProfile.conditionInsights.severity.${condition.severity}`, condition.severity))}
            </Badge>
          )}
          <Badge variant="outline" className={statusColors[condition.status]}>
            {String(t(`petProfile.conditionInsights.status.${condition.status}`, condition.status))}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          {/* Clinical Reasoning */}
          {(hasBreedRelevance || hasAgeRelevance || hasCausalConnections) && (
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-blue-500" />
                {t('petProfile.conditionInsights.clinicalReasoning')}
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {hasAgeRelevance && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {t('petProfile.conditionInsights.ageRelevance', { age: petAge, condition: condition.condition_name })}
                  </li>
                )}
                {petBreed && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {t('petProfile.conditionInsights.breedRelevance', { breed: petBreed, condition: condition.condition_name })}
                  </li>
                )}
                {hasCausalConnections && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {t('petProfile.conditionInsights.causalRelevance', { count: causalCount, condition: condition.condition_name })}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Suggested Pre-Treatment Exams */}
          {suggestedExams.length > 0 && (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-purple-500" />
                {t('petProfile.conditionInsights.suggestedExams')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {suggestedExams.map((examKey, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-purple-100/50 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                    <ClipboardList className="h-3 w-3 mr-1" />
                    {t(examKey)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Treatments from KG */}
          {insight && insight.treatments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Beaker className="h-3.5 w-3.5 text-emerald-500" />
                {t('petProfile.conditionInsights.treatments')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {insight.treatments.slice(0, 10).map((tr, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5', predicateBadgeColors[tr.predicate] || predicateBadgeColors.TREATS)}>
                      {predicateStyles[tr.predicate]?.symbol || '→'} {t(`petProfile.conditionInsights.predicates.${tr.predicate}`, tr.predicate.toLowerCase())}
                    </Badge>
                    <NutraceuticalTag
                      name={tr.subject_name}
                      score={tr.extraction_confidence || 0}
                      showScore={!!tr.extraction_confidence}
                    />
                  </div>
                ))}
                {insight.treatments.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{insight.treatments.length - 10}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Modulators */}
          {insight && insight.modulators && insight.modulators.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                {t('petProfile.conditionInsights.modulators')}
              </h4>
              <div className="space-y-1.5">
                {insight.modulators.slice(0, 8).map((mod, i) => {
                  const style = predicateStyles[mod.predicate] || predicateStyles.MODULATES;
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <NutraceuticalTag
                        name={mod.subject_name}
                        score={mod.extraction_confidence || 0}
                        showScore={!!mod.extraction_confidence}
                      />
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5', predicateBadgeColors[mod.predicate] || predicateBadgeColors.MODULATES)}>
                        {style.symbol} {t(`petProfile.conditionInsights.predicates.${mod.predicate}`, mod.predicate.toLowerCase())}
                      </Badge>
                      <span className="font-medium text-muted-foreground">{mod.object_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Causal links */}
          {insight && insight.causalLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-amber-500" />
                {t('petProfile.conditionInsights.causalConnections')}
              </h4>
              <div className="space-y-1.5">
                {insight.causalLinks.map((link, i) => {
                  const pred = predicateStyles[link.predicate] || { color: 'text-muted-foreground', symbol: '→' };
                  return (
                    <div key={i} className="text-xs flex items-center gap-1.5 py-0.5">
                      <ConditionTag condition={link.subject_name} score={0} showScore={false} />
                      <span className={cn('italic font-medium', pred.color)}>
                        {pred.symbol} {t(`petProfile.conditionInsights.predicates.${link.predicate}`, link.predicate.toLowerCase().replace('_', ' '))}
                      </span>
                      <ConditionTag condition={link.object_name} score={0} showScore={false} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mechanisms */}
          {insight && insight.mechanisms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                {t('petProfile.conditionInsights.mechanisms')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {insight.mechanisms.slice(0, 8).map((m, i) => {
                  const style = predicateStyles[m.predicate] || predicateStyles.MODULATES;
                  return (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <NutraceuticalTag name={m.subject_name} score={m.extraction_confidence || 0} showScore={false} />
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5', predicateBadgeColors[m.predicate] || 'bg-muted')}>
                        {style.symbol}
                      </Badge>
                      <span className="text-muted-foreground">{m.object_name}</span>
                    </div>
                  );
                })}
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
