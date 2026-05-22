import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Brain, Target, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SyntheticCohort, SYNTHETIC_CONDITIONS, meanTrajectory } from '@/utils/syntheticCohort';
import { useTranslatedPredictiveModels } from '@/hooks/useTranslatedPredictiveModels';
import { useNavigate } from 'react-router-dom';

interface Props {
  cohort: SyntheticCohort;
}

const ModelFeedbackLoop: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();
  const models = useTranslatedPredictiveModels();
  const navigate = useNavigate();

  // For each condition compare twin (prediction) vs treated (ground truth) final mean — drift
  const drift = useMemo(() => {
    return SYNTHETIC_CONDITIONS.map((c) => {
      const treated = cohort.treated.filter((p) => p.primaryConditionId === c.id);
      const twins = cohort.twins.filter((t) => {
        const src = cohort.treated.find((p) => p.id === t.twinOfId);
        return src?.primaryConditionId === c.id;
      });
      const tT = meanTrajectory(treated);
      const tD = meanTrajectory(twins);
      const lastT = tT[tT.length - 1]?.mean ?? 0;
      const lastD = tD[tT.length - 1]?.mean ?? lastT;
      const driftPp = Math.round((lastT - lastD) * 100);
      return {
        name: i18n.language === 'en' ? c.name_en : c.name,
        drift: driftPp,
        n: treated.length,
      };
    });
  }, [cohort, i18n.language]);

  const avgDriftPp = drift.length ? Math.round(drift.reduce((s, d) => s + Math.abs(d.drift), 0) / drift.length) : 0;

  // Per-model synthetic signal: drift attenuated by model accuracy + monthly delta from growthRate
  const modelRows = useMemo(() => {
    return models.map((m) => {
      const driftSynthetic = Math.max(0, (100 - m.currentAccuracy) + avgDriftPp * 0.3);
      const monthlyDelta = m.monthlyGrowthRate;
      return {
        id: m.modelId,
        name: m.modelName,
        accuracy: m.currentAccuracy,
        drift: Number(driftSynthetic.toFixed(1)),
        growth: Number(monthlyDelta.toFixed(2)),
      };
    });
  }, [models, avgDriftPp]);

  const signals30d = {
    triplets: Math.round(cohort.treated.length * 0.018),
    weights: Math.round(cohort.treated.length * 0.0042),
    gapfills: Math.round(cohort.treated.length * 0.0011),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.kgUpdates')}</p>
              <p className="text-xl font-bold">{signals30d.triplets.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.kgUpdatesSub')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.accuracy')}</p>
              <p className="text-xl font-bold">{(models.reduce((s, m) => s + m.currentAccuracy, 0) / Math.max(1, models.length)).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.accuracySub')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.gapfill')}</p>
              <p className="text-xl font-bold">{signals30d.gapfills.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.gapfillSub')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('clinicalMonitoring.v2.loopModels.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loopModels.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.loopModels.col.model')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.loopModels.col.accuracy')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.loopModels.col.drift')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.loopModels.col.growth')}</th>
                  <th className="text-right py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/40">
                    <td className="py-2 px-2 font-medium">{r.name}</td>
                    <td className="py-2 px-2">{r.accuracy.toFixed(1)}%</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={r.drift > 15 ? 'text-amber-600 border-amber-500/30' : 'text-emerald-600 border-emerald-500/30'}>
                        {r.drift}pp
                      </Badge>
                    </td>
                    <td className="py-2 px-2">+{r.growth}%</td>
                    <td className="py-2 px-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate('/administrador?tab=modelos-preditivos')}>
                        {t('clinicalMonitoring.v2.loopModels.view')} <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loopModels.newTriplets')}</p>
              <p className="text-lg font-semibold">{signals30d.triplets.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loopModels.weightAdjusts')}</p>
              <p className="text-lg font-semibold">{signals30d.weights.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loopModels.gapfills')}</p>
              <p className="text-lg font-semibold">{signals30d.gapfills.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('clinicalMonitoring.v2.loop.driftTitle')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.driftSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={drift}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis label={{ value: 'pp', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="drift" name={t('clinicalMonitoring.v2.loop.driftLegend')} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3 italic">{t('clinicalMonitoring.v2.loop.driftNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelFeedbackLoop;