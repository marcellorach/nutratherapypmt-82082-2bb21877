import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Combine, Recycle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { SyntheticCohort, SYNTHETIC_CONDITIONS } from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
}

const DiscoverySignals: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();

  // Real architectural meta-studies for repurposing card
  const { data: metaStudies = [] } = useQuery({
    queryKey: ['meta-studies-for-discovery'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meta_studies')
        .select('id, title, source_url, kind, summary')
        .limit(5);
      if (error) return [];
      return data || [];
    },
  });

  // Compute overperforming compounds: for each (compound × condition) compare treated mean delta vs twin projection
  const overperforming = useMemo(() => {
    const signals: { compound: string; condition: string; n: number; deltaPp: number }[] = [];
    for (const c of SYNTHETIC_CONDITIONS) {
      const treated = cohort.treated.filter((p) => p.primaryConditionId === c.id);
      const compounds = new Map<string, { sum: number; n: number }>();
      for (const p of treated) {
        const last = p.monthlySeverity[p.monthlySeverity.length - 1];
        const first = p.monthlySeverity[0];
        const delta = last - first;
        for (const cp of p.stack) {
          const cur = compounds.get(cp) || { sum: 0, n: 0 };
          cur.sum += delta;
          cur.n++;
          compounds.set(cp, cur);
        }
      }
      // pick top-2 compounds with biggest improvement (most negative delta)
      const sorted = Array.from(compounds.entries())
        .filter(([_, v]) => v.n > 200)
        .map(([compound, v]) => ({ compound, mean: v.sum / v.n, n: v.n }))
        .sort((a, b) => a.mean - b.mean)
        .slice(0, 1);
      for (const s of sorted) {
        signals.push({
          compound: s.compound,
          condition: i18n.language === 'en' ? c.name_en : c.name,
          n: s.n,
          deltaPp: Math.round(s.mean * -100),
        });
      }
    }
    return signals.slice(0, 4);
  }, [cohort, i18n.language]);

  // Synergistic combos: scan top 3 condition cohorts, find highest yearsGained pairs
  const synergies = useMemo(() => {
    const out: { pair: string; condition: string; n: number; bonus: number }[] = [];
    for (const c of SYNTHETIC_CONDITIONS.slice(0, 3)) {
      const treated = cohort.treated.filter((p) => p.primaryConditionId === c.id);
      const pairScores = new Map<string, { sum: number; n: number }>();
      for (const p of treated) {
        for (let i = 0; i < p.stack.length; i++) {
          for (let j = i + 1; j < p.stack.length; j++) {
            const key = [p.stack[i], p.stack[j]].sort().join(' + ');
            const cur = pairScores.get(key) || { sum: 0, n: 0 };
            cur.sum += p.yearsGained;
            cur.n++;
            pairScores.set(key, cur);
          }
        }
      }
      const top = Array.from(pairScores.entries())
        .filter(([_, v]) => v.n > 100)
        .map(([pair, v]) => ({ pair, mean: v.sum / v.n, n: v.n }))
        .sort((a, b) => b.mean - a.mean)[0];
      if (top) {
        out.push({
          pair: top.pair,
          condition: i18n.language === 'en' ? c.name_en : c.name,
          n: top.n,
          bonus: Number(top.mean.toFixed(2)),
        });
      }
    }
    return out;
  }, [cohort, i18n.language]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-emerald-800 dark:text-emerald-200">
          {t('clinicalMonitoring.v2.discovery.intro')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('clinicalMonitoring.v2.discovery.overperformingTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.discovery.overperformingDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {overperforming.map((s, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{s.compound}</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">+{s.deltaPp}pp</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('clinicalMonitoring.v2.discovery.overperformingItem', { condition: s.condition, n: s.n.toLocaleString() })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Combine className="h-4 w-4 text-primary" />
              {t('clinicalMonitoring.v2.discovery.synergyTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.discovery.synergyDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {synergies.map((s, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{s.pair}</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">+{s.bonus}a</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('clinicalMonitoring.v2.discovery.synergyItem', { condition: s.condition, n: s.n.toLocaleString() })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Recycle className="h-4 w-4 text-primary" />
            {t('clinicalMonitoring.v2.discovery.repurposeTitle')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t('clinicalMonitoring.v2.discovery.repurposeDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {metaStudies.length === 0 && (
            <p className="text-sm text-muted-foreground italic">{t('clinicalMonitoring.v2.discovery.noStudies')}</p>
          )}
          {metaStudies.map((s: any) => (
            <div key={s.id} className="rounded-md border p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.title}</p>
                {s.summary && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.summary}</p>}
                {s.kind && <Badge variant="outline" className="mt-2 text-xs">{s.kind}</Badge>}
              </div>
              {s.source_url && (
                <a href={s.source_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoverySignals;