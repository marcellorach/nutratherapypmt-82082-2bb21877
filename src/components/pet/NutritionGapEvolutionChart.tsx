import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import HelpHint from '@/components/ui/help-hint';
import {
  getNutritionGapTimeline,
  type GapTimelinePoint,
} from '@/services/nutrition-gap-timeline';

interface Props {
  petId: string;
  species: 'dog' | 'cat';
  weight_kg: number;
  age_years: number | null;
  breed_size?: 'small' | 'medium' | 'large' | 'giant' | null;
  breed_name?: string | null;
  active_conditions: string[];
}

const NutritionGapEvolutionChart: React.FC<Props> = (props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('pt') ? 'pt' : 'en';
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<GapTimelinePoint[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNutritionGapTimeline({
      petId: props.petId,
      species: props.species,
      weight_kg: props.weight_kg,
      age_years: props.age_years,
      breed_size: props.breed_size ?? null,
      breed_name: props.breed_name ?? null,
      active_conditions: props.active_conditions,
    })
      .then((p) => alive && setPoints(p))
      .catch(() => alive && setPoints([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [props.petId, props.weight_kg, props.age_years, props.species]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center text-sm text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('nutritionGapTimeline.loading')}
        </CardContent>
      </Card>
    );
  }

  const withData = points.filter((p) => p.hasData);
  if (withData.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {t('nutritionGapTimeline.title')}
            <HelpHint title={t('nutritionGapTimeline.title')}>
              {t('nutritionGapTimeline.helpBody')}
            </HelpHint>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-6">
          {t('nutritionGapTimeline.notEnoughHistory')}
        </CardContent>
      </Card>
    );
  }

  const chartData = withData.map((p) => ({
    date: p.date?.slice(0, 10) ?? '—',
    deficient: p.deficientCount,
    excess: p.excessCount,
    adequate: p.adequateCount,
    productLabel: p.productLabel ?? '',
  }));

  const first = withData[0];
  const last = withData[withData.length - 1];
  const deltaDef = last.deficientCount - first.deficientCount;
  const deltaExc = last.excessCount - first.excessCount;
  const TrendIcon = deltaDef < 0 ? TrendingDown : deltaDef > 0 ? TrendingUp : Minus;
  const trendColor = deltaDef < 0 ? 'text-emerald-600' : deltaDef > 0 ? 'text-red-600' : 'text-muted-foreground';

  // Top 5 nutrientes com maior variação entre primeiro e último snapshot
  const keys = Array.from(new Set(last.gaps.map((g) => g.key)));
  const nutrientDeltas = keys.map((k) => {
    const a = first.gaps.find((g) => g.key === k);
    const b = last.gaps.find((g) => g.key === k);
    const label = (lang === 'pt' ? b?.label_pt : b?.label_en) ?? k;
    const da = a?.delta_pct ?? null;
    const db = b?.delta_pct ?? null;
    const delta = da != null && db != null ? Number((db - da).toFixed(1)) : null;
    return { key: k, label, before: da, after: db, delta, statusAfter: b?.status };
  })
    .filter((r) => r.delta != null)
    .sort((a, b) => Math.abs((b.delta ?? 0)) - Math.abs((a.delta ?? 0)))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {t('nutritionGapTimeline.title')}
          <HelpHint title={t('nutritionGapTimeline.title')}>
            {t('nutritionGapTimeline.helpBody')}
          </HelpHint>
          <Badge variant="outline" className="text-[10px]">
            {withData.length} {t('nutritionGapTimeline.snapshots')}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span className={trendColor}>
            {deltaDef > 0 ? '+' : ''}{deltaDef} {t('nutritionGapTimeline.deficits')} · {deltaExc > 0 ? '+' : ''}{deltaExc} {t('nutritionGapTimeline.excesses')}
          </span>
          <span className="ml-1">{t('nutritionGapTimeline.sincePeriod')}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v: any, name: string) => [v, t(`nutritionGapTimeline.${name}`)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => t(`nutritionGapTimeline.${v}`)} />
              <Area type="monotone" dataKey="deficient" fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" fillOpacity={0.25} />
              <Area type="monotone" dataKey="excess" fill="hsl(38 92% 50%)" stroke="hsl(38 92% 50%)" fillOpacity={0.2} />
              <Line type="monotone" dataKey="adequate" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {nutrientDeltas.length > 0 && (
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-2">
              {t('nutritionGapTimeline.topChanges')}
            </p>
            <div className="space-y-1.5">
              {nutrientDeltas.map((r) => {
                const improved = r.statusAfter === 'adequate' || (r.delta != null && Math.abs(r.delta) < Math.abs(r.before ?? 0));
                const Icon = (r.delta ?? 0) < 0 ? TrendingDown : (r.delta ?? 0) > 0 ? TrendingUp : Minus;
                return (
                  <div key={r.key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium truncate">{r.label}</span>
                    <span className="flex items-center gap-2 tabular-nums text-muted-foreground">
                      <span>{r.before != null ? `${r.before > 0 ? '+' : ''}${r.before}%` : '—'}</span>
                      <span>→</span>
                      <span>{r.after != null ? `${r.after > 0 ? '+' : ''}${r.after}%` : '—'}</span>
                      <span className={improved ? 'text-emerald-600' : 'text-red-600'}>
                        <Icon className="h-3 w-3 inline" /> {r.delta! > 0 ? '+' : ''}{r.delta}pp
                      </span>
                      <Badge variant="outline" className="text-[9px]">{t(`nutritionGap.status.${r.statusAfter}`)}</Badge>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground border-t pt-2">
          {t('nutritionGapTimeline.methodologyNote')}
        </p>
      </CardContent>
    </Card>
  );
};

export default NutritionGapEvolutionChart;
