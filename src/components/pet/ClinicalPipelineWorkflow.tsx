import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { User, PawPrint, TestTube, Share2, ShieldAlert, Sparkles, Check, Loader2, Clock, Zap, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PipelineStage = 'idle' | 'running' | 'complete' | 'error';

export interface PipelineState {
  stage1_profile: PipelineStage;
  stage2_predispositions: PipelineStage;
  stage3_labs: PipelineStage;
  stage4_kg: PipelineStage;
  stage5_interactions: PipelineStage;
  stage6_recommendation: PipelineStage;
  stage7_synergies: PipelineStage;
}

interface Props {
  pipelineState: PipelineState;
  profileDataCount?: number;
  predispositionCount?: number;
  labAlertCount?: number;
  tripletCount?: number;
  interactionCount?: number;
  compoundCount?: number;
  synergyCount?: number;
  stageTimes?: Record<string, number>;
  isAnalyzing: boolean;
}

const ClinicalPipelineWorkflow: React.FC<Props> = ({
  pipelineState,
  profileDataCount = 0,
  predispositionCount = 0,
  labAlertCount = 0,
  tripletCount = 0,
  interactionCount = 0,
  compoundCount = 0,
  synergyCount = 0,
  stageTimes = {},
  isAnalyzing,
}) => {
  const { t } = useTranslation();

  const stages = [
    { key: 'stage1_profile', icon: User, label: t('petProfile.pipeline.profile'), count: profileDataCount, countLabel: t('petProfile.pipeline.dataPoints') },
    { key: 'stage2_predispositions', icon: PawPrint, label: t('petProfile.pipeline.predispositions'), count: predispositionCount, countLabel: t('petProfile.pipeline.risks') },
    { key: 'stage3_labs', icon: TestTube, label: t('petProfile.pipeline.labs'), count: labAlertCount, countLabel: t('petProfile.pipeline.alerts') },
    { key: 'stage4_kg', icon: Share2, label: t('petProfile.pipeline.knowledgeGraph'), count: tripletCount, countLabel: t('petProfile.pipeline.triplets') },
    { key: 'stage5_interactions', icon: ShieldAlert, label: t('petProfile.pipeline.interactions'), count: interactionCount, countLabel: t('petProfile.pipeline.conflicts') },
    { key: 'stage6_recommendation', icon: Sparkles, label: t('petProfile.pipeline.recommendation'), count: compoundCount, countLabel: t('petProfile.pipeline.compounds') },
    { key: 'stage7_synergies', icon: Zap, label: t('petProfile.pipeline.synergies'), count: synergyCount, countLabel: t('petProfile.pipeline.synergiesCount') },
  ];

  const getStatusIcon = (stage: PipelineStage) => {
    switch (stage) {
      case 'complete': return <Check className="h-3.5 w-3.5 text-green-600" />;
      case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      case 'error': return <ShieldAlert className="h-3.5 w-3.5 text-destructive" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (!isAnalyzing && pipelineState.stage1_profile === 'idle') return null;

  const totalTimeMs = Object.values(stageTimes).reduce((a, b) => a + b, 0);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {stages.map((stage, idx) => {
            const state = pipelineState[stage.key as keyof PipelineState];
            const Icon = stage.icon;
            const stageTime = stageTimes[stage.key];
            return (
              <React.Fragment key={stage.key}>
                {idx > 0 && (
                  <div className={cn(
                    'h-px w-4 min-w-[16px] flex-shrink-0',
                    state === 'complete' ? 'bg-green-400' : state === 'running' ? 'bg-primary' : 'bg-border'
                  )} />
                )}
                <div className={cn(
                  'flex flex-col items-center gap-1 min-w-[80px] p-2 rounded-lg transition-colors',
                  state === 'complete' && 'bg-green-50 dark:bg-green-950/30',
                  state === 'running' && 'bg-primary/5',
                  state === 'error' && 'bg-destructive/5',
                )}>
                  <div className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full border',
                    state === 'complete' && 'border-green-400 bg-green-100 dark:bg-green-900',
                    state === 'running' && 'border-primary bg-primary/10',
                    state === 'error' && 'border-destructive bg-destructive/10',
                    state === 'idle' && 'border-border bg-muted',
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      state === 'complete' && 'text-green-600',
                      state === 'running' && 'text-primary',
                      state === 'error' && 'text-destructive',
                      state === 'idle' && 'text-muted-foreground',
                    )} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{stage.label}</span>
                  {state === 'complete' && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        {getStatusIcon(state)}
                        <span className="text-[9px] text-green-600">{stage.count} {stage.countLabel}</span>
                      </div>
                      {stageTime != null && (
                        <span className="text-[8px] text-muted-foreground">{formatDuration(stageTime)}</span>
                      )}
                    </div>
                  )}
                  {state === 'running' && (
                    <div className="flex items-center gap-0.5">
                      {getStatusIcon(state)}
                      <span className="text-[9px] text-primary">{t('petProfile.pipeline.processing')}</span>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          {/* Total time */}
          {totalTimeMs > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border flex-shrink-0">
              <Timer className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-medium text-muted-foreground">{t('petProfile.pipeline.totalTime')}</span>
                <span className="text-[10px] font-bold text-foreground">{formatDuration(totalTimeMs)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicalPipelineWorkflow;
