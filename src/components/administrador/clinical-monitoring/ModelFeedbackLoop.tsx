import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Brain, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SyntheticCohort, SYNTHETIC_CONDITIONS, meanTrajectory } from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
}

const ModelFeedbackLoop: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.kgUpdates')}</p>
              <p className="text-xl font-bold">{(cohort.treated.length * 0.08).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.kgUpdatesSub')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.accuracy')}</p>
              <p className="text-xl font-bold">87.4%</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.accuracySub')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('clinicalMonitoring.v2.loop.gapfill')}</p>
              <p className="text-xl font-bold">42</p>
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.loop.gapfillSub')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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