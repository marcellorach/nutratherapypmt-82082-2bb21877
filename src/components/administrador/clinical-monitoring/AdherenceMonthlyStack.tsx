import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { SyntheticPet, computeMonthlyFlow } from '@/utils/syntheticCohort';

interface Props { treated: SyntheticPet[]; }

const AdherenceMonthlyStack: React.FC<Props> = ({ treated }) => {
  const { t } = useTranslation();
  const data = useMemo(() => computeMonthlyFlow(treated, 24), [treated]);
  const totalActive = data[data.length - 1]?.active ?? 0;
  const totalChurn = data.reduce((s, d) => s + Math.abs(d.churned), 0);
  const totalJoined = data.reduce((s, d) => s + d.joined, 0);
  const retention = totalJoined ? Math.round(((totalJoined - totalChurn) / totalJoined) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('clinicalMonitoring.v2.flow.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.flow.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.flow.active')}</p>
            <p className="font-semibold text-primary">{totalActive.toLocaleString()}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.flow.joined')}</p>
            <p className="font-semibold text-emerald-600">{totalJoined.toLocaleString()}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.flow.churned')}</p>
            <p className="font-semibold text-rose-600">{totalChurn.toLocaleString()}</p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.flow.retention')}</p>
            <p className="font-semibold">{retention}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: any, name: any) => [Math.abs(Number(v)).toLocaleString(), name]}
              labelFormatter={(l) => l}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="active" stackId="a" name={t('clinicalMonitoring.v2.flow.legActive')} fill="hsl(var(--primary))" />
            <Bar dataKey="joined" stackId="a" name={t('clinicalMonitoring.v2.flow.legJoined')} fill="#10b981" />
            <Bar dataKey="churned" stackId="a" name={t('clinicalMonitoring.v2.flow.legChurned')} fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-3 italic">{t('clinicalMonitoring.v2.flow.note')}</p>
      </CardContent>
    </Card>
  );
};

export default AdherenceMonthlyStack;