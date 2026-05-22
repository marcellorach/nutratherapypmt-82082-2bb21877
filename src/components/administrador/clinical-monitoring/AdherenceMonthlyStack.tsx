import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { SyntheticPet, computeMonthlyFlow } from '@/utils/syntheticCohort';

interface Props {
  treated: SyntheticPet[];
}

const AdherenceMonthlyStack: React.FC<Props> = ({ treated }) => {
  const { t } = useTranslation();
  const data = useMemo(() => computeMonthlyFlow(treated, 24), [treated]);
  const totalJoined = data.reduce((s, d) => s + d.joined, 0);
  const totalChurn = -data.reduce((s, d) => s + d.churned, 0);
  const retention = totalJoined ? ((1 - totalChurn / totalJoined) * 100).toFixed(1) : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('clinicalMonitoring.v2.monthlyFlow.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.monthlyFlow.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: any, name: any) => [Math.abs(Number(v)).toLocaleString(), String(name)]}
              labelFormatter={(l) => `${l}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="active" stackId="flow" fill="hsl(var(--primary))" name={t('clinicalMonitoring.v2.monthlyFlow.active')} />
            <Bar dataKey="joined" stackId="flow" fill="#10b981" name={t('clinicalMonitoring.v2.monthlyFlow.joined')} />
            <Bar dataKey="churned" stackId="flow" fill="hsl(var(--destructive))" name={t('clinicalMonitoring.v2.monthlyFlow.churned')} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 italic">
          {t('clinicalMonitoring.v2.monthlyFlow.retention', { pct: retention })}
        </p>
      </CardContent>
    </Card>
  );
};

export default AdherenceMonthlyStack;