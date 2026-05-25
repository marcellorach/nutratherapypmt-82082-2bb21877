import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Sparkles, Check, CircleDashed, Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMetaKgPhaseBMetrics } from '@/hooks/useMetaKgPhaseBMetrics';
import { Progress } from '@/components/ui/progress';

const MetaKgRoadmapCard: React.FC = () => {
  const { t } = useTranslation();
  const { data: metrics, isLoading } = useMetaKgPhaseBMetrics();

  const renderMetric = (
    label: string,
    current: number,
    target: number,
  ) => {
    const met = current >= target;
    const pct = Math.min(100, Math.round((current / target) * 100));
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-foreground/80">
            {met ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={met ? 'font-medium' : ''}>{label}</span>
          </div>
          <span className={`tabular-nums ${met ? 'text-emerald-700 font-semibold' : 'text-muted-foreground'}`}>
            {current} / {target}
          </span>
        </div>
        <Progress value={pct} className={`h-1 ${met ? '[&>div]:bg-emerald-500' : ''}`} />
      </div>
    );
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">
            {t('fundamentos.roadmap.title', 'Roadmap do Meta-KG')}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
            {t('fundamentos.roadmap.phaseAActive', 'Fase A ativa')}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {t(
            'fundamentos.roadmap.description',
            'Lembrete permanente das próximas evoluções desta área. Não esquecer.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 shrink-0">
            {t('fundamentos.roadmap.phaseB', 'Fase B')}
          </Badge>
          <div className="text-foreground/90">
            <span className="font-medium">{t('fundamentos.roadmap.phaseBTitle', 'Meta-KG navegável')}.</span>{' '}
            {t(
              'fundamentos.roadmap.phaseBBody',
              'Promover lições (padrões, recipes, anti-padrões) a entidades de primeira classe; criar tripletes arquiteturais entre elas; vínculo bidirecional RC ↔ lição.'
            )}
          </div>
        </div>

        {/* Phase B trigger metrics */}
        <div className="ml-[58px] mt-2 rounded-md border border-amber-200/70 bg-white/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-amber-900 uppercase tracking-wide">
              {t('fundamentos.roadmap.phaseBTriggers', 'Gatilhos para acionar a Fase B')}
            </div>
            {metrics?.unlocked ? (
              <Badge className="bg-emerald-600 text-white border-emerald-700 gap-1">
                <Unlock className="h-3 w-3" />
                {t('fundamentos.roadmap.unlocked', 'Pronto para iniciar')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
                {t('fundamentos.roadmap.locked', 'Aguardando massa crítica')}
              </Badge>
            )}
          </div>
          {isLoading || !metrics ? (
            <div className="text-xs text-muted-foreground">
              {t('fundamentos.roadmap.loadingMetrics', 'Calculando métricas…')}
            </div>
          ) : (
            <>
              {renderMetric(
                t('fundamentos.roadmap.metric1', 'Meta-estudos aprovados (fora do sandbox)'),
                metrics.approvedCount,
                metrics.approvedTarget,
              )}
              {renderMetric(
                t('fundamentos.roadmap.metric2', 'Lições redundantes entre estudos (sem cross-link)'),
                metrics.redundantLessons,
                metrics.redundantTarget,
              )}
              {renderMetric(
                t('fundamentos.roadmap.metric3', 'Conflitos detectados entre recipe e anti-padrão'),
                metrics.conflicts,
                metrics.conflictsTarget,
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 shrink-0">
            {t('fundamentos.roadmap.phaseC', 'Fase C')}
          </Badge>
          <div className="text-foreground/90">
            <span className="font-medium">{t('fundamentos.roadmap.phaseCTitle', 'RAG do meta-KG')}.</span>{' '}
            {t(
              'fundamentos.roadmap.phaseCBody',
              'Embedding + busca semântica sobre meta-estudos quando atingirmos ≥30 estudos arquiteturais para justificar o custo.'
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
          <Sparkles className="h-3 w-3" />
          {t(
            'fundamentos.roadmap.note',
            'Fase A entrega sandbox (lifecycle) + confiabilidade 0–5 por estudo, sem refatorar a modelagem atual.'
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaKgRoadmapCard;