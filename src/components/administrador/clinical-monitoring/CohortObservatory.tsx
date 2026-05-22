import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Activity, TrendingUp, DollarSign, Users, Clock, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { SyntheticCohort, SYNTHETIC_CONDITIONS, aggregateResponse } from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
}

const STATUS_COLOR: Record<string, string> = {
  significant: '#16a34a',
  mild: '#eab308',
  none: '#ef4444',
  insufficient: '#94a3b8',
};

const CohortObservatory: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();

  const stats = useMemo(() => {
    const treated = cohort.treated;
    const avgFollow = treated.reduce((s, p) => s + p.monthsOnProtocol, 0) / treated.length;
    const avgAdh = treated.reduce((s, p) => s + p.adherencePct, 0) / treated.length;
    const positive = treated.filter((p) => p.responseStatus === 'significant' || p.responseStatus === 'mild').length;
    const totalRoe = treated.reduce((s, p) => s + p.estimatedRoeBrl, 0);
    const yearsGained = treated.reduce((s, p) => s + p.yearsGained, 0);
    return {
      total: treated.length,
      mirror: cohort.mirror.length,
      twins: cohort.twins.length,
      avgFollow: avgFollow.toFixed(1),
      avgAdh: avgAdh.toFixed(1),
      positivePct: ((positive / treated.length) * 100).toFixed(1),
      totalRoeMln: (totalRoe / 1_000_000).toFixed(2),
      yearsGained: yearsGained.toFixed(0),
    };
  }, [cohort]);

  const byCondition = useMemo(() => {
    return SYNTHETIC_CONDITIONS.map((c) => {
      const treated = cohort.treated.filter((p) => p.primaryConditionId === c.id);
      const mirror = cohort.mirror.filter((p) => p.primaryConditionId === c.id);
      const agg = aggregateResponse(treated);
      const positive = agg.significant + agg.mild;
      const responseRate = treated.length ? (positive / treated.length) * 100 : 0;
      return {
        id: c.id,
        name: i18n.language === 'en' ? c.name_en : c.name,
        treated: treated.length,
        mirror: mirror.length,
        responseRate: Number(responseRate.toFixed(1)),
      };
    }).sort((a, b) => b.treated - a.treated);
  }, [cohort, i18n.language]);

  const respDist = useMemo(() => {
    const agg = aggregateResponse(cohort.treated);
    return [
      { name: t('clinicalMonitoring.status.significant'), value: agg.significant, key: 'significant' },
      { name: t('clinicalMonitoring.status.mild'), value: agg.mild, key: 'mild' },
      { name: t('clinicalMonitoring.status.none'), value: agg.none, key: 'none' },
      { name: t('clinicalMonitoring.status.insufficient'), value: agg.insufficient, key: 'insufficient' },
    ];
  }, [cohort, t]);

  const adoptionFunnel = useMemo(() => {
    // Treated buckets by months on protocol → emulates async adoption
    const buckets = [0, 3, 6, 9, 12, 18, 24];
    const series = buckets.slice(0, -1).map((b, idx) => {
      const next = buckets[idx + 1];
      const count = cohort.treated.filter((p) => p.monthsOnProtocol >= b && p.monthsOnProtocol < next).length;
      return { label: `${b}-${next}m`, count };
    });
    return series;
  }, [cohort]);

  const metric = (icon: React.ReactNode, label: string, value: string, sub?: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metric(<Users className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.treated'), stats.total.toLocaleString(), t('clinicalMonitoring.v2.kpi.treatedSub'))}
        {metric(<Activity className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.mirror'), stats.mirror.toLocaleString(), t('clinicalMonitoring.v2.kpi.mirrorSub'))}
        {metric(<TrendingUp className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.twins'), stats.twins.toLocaleString(), t('clinicalMonitoring.v2.kpi.twinsSub'))}
        {metric(<Clock className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.avgFollow'), `${stats.avgFollow}m`, t('clinicalMonitoring.v2.kpi.avgFollowSub'))}
        {metric(<ShieldCheck className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.positive'), `${stats.positivePct}%`, t('clinicalMonitoring.v2.kpi.positiveSub'))}
        {metric(<DollarSign className="h-5 w-5" />, t('clinicalMonitoring.v2.kpi.roe'), `R$ ${stats.totalRoeMln}M`, t('clinicalMonitoring.v2.kpi.roeSub', { years: stats.yearsGained }))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('clinicalMonitoring.v2.byCondition.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCondition} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="treated" name={t('clinicalMonitoring.v2.byCondition.treated')} fill="hsl(var(--primary))" />
                <Bar dataKey="mirror" name={t('clinicalMonitoring.v2.byCondition.mirror')} fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('clinicalMonitoring.v2.respDist.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={respDist} dataKey="value" nameKey="name" outerRadius={90} label={(d: any) => `${((d.value / cohort.treated.length) * 100).toFixed(0)}%`}>
                  {respDist.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLOR[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => v.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('clinicalMonitoring.v2.adoption.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.adoption.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adoptionFunnel}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CohortObservatory;