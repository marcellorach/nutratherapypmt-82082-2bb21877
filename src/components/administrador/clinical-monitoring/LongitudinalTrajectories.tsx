import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Area, ComposedChart } from 'recharts';
import { SyntheticCohort, SYNTHETIC_CONDITIONS, meanTrajectory, meanTrajectoryWithCI } from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
}

const LongitudinalTrajectories: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();
  const [conditionId, setConditionId] = useState<string>(SYNTHETIC_CONDITIONS[0].id);

  const cond = SYNTHETIC_CONDITIONS.find((c) => c.id === conditionId)!;

  const chartData = useMemo(() => {
    const treated = cohort.treated.filter((p) => p.primaryConditionId === conditionId);
    const mirror = cohort.mirror.filter((p) => p.primaryConditionId === conditionId);
    const twins = cohort.twins.filter((t) => {
      const src = cohort.treated.find((p) => p.id === t.twinOfId);
      return src?.primaryConditionId === conditionId;
    });
    const tT = meanTrajectoryWithCI(treated);
    const tM = meanTrajectory(mirror);
    const tD = meanTrajectory(twins);
    const maxLen = Math.max(tT.length, tM.length, tD.length);
    const rows = [];
    for (let m = 0; m < maxLen; m++) {
      const ci = tT[m];
      rows.push({
        month: m,
        treated: ci?.mean ?? null,
        treatedBand: ci ? [ci.lo, ci.hi] : null,
        mirror: tM[m]?.mean ?? null,
        twin: tD[m]?.mean ?? null,
        nTreated: ci?.n ?? 0,
      });
    }
    return { rows, nTreated: treated.length, nMirror: mirror.length, nTwins: twins.length };
  }, [cohort, conditionId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{t('clinicalMonitoring.v2.trajectories.title')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('clinicalMonitoring.v2.trajectories.subtitle')}</p>
          </div>
          <Select value={conditionId} onValueChange={setConditionId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYNTHETIC_CONDITIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {i18n.language === 'en' ? c.name_en : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.trajectories.legendTreated')}</p>
              <p className="text-lg font-semibold text-primary">{chartData.nTreated.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.trajectories.legendMirror')}</p>
              <p className="text-lg font-semibold text-slate-500">{chartData.nMirror.toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.trajectories.legendTwin')}</p>
              <p className="text-lg font-semibold text-emerald-600">{chartData.nTwins.toLocaleString()}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData.rows}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" label={{ value: t('clinicalMonitoring.v2.trajectories.xAxis'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis domain={[0, 1]} label={{ value: t('clinicalMonitoring.v2.trajectories.yAxis'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => (typeof v === 'number' ? v.toFixed(3) : v)}
                labelFormatter={(m) => `${t('clinicalMonitoring.v2.trajectories.month')} ${m}`}
              />
              <Legend />
              <Area type="monotone" dataKey="treatedBand" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.12} name="IC 95%" isAnimationActive={false} />
              <Line type="monotone" dataKey="mirror" stroke="#94a3b8" strokeWidth={2} dot={false} name={t('clinicalMonitoring.v2.trajectories.legendMirror')} strokeDasharray="6 4" />
              <Line type="monotone" dataKey="treated" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name={t('clinicalMonitoring.v2.trajectories.legendTreated')} />
              <Line type="monotone" dataKey="twin" stroke="#10b981" strokeWidth={2} dot={false} name={t('clinicalMonitoring.v2.trajectories.legendTwin')} strokeDasharray="2 4" />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3 italic">
            {t('clinicalMonitoring.v2.trajectories.note', { plateau: cond.plateauMonths })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LongitudinalTrajectories;