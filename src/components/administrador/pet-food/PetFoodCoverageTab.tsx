import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PlayCircle, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CoverageRow {
  product_id: string;
  product_name: string;
  brand_name: string;
  best_completeness: number | null;
  best_confidence: number | null;
  nutrition_count: number;
}

interface RunLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  params: Record<string, unknown>;
  error: string | null;
}

export default function PetFoodCoverageTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [limit, setLimit] = useState(25);
  const [minCompleteness, setMinCompleteness] = useState(0.6);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [search, setSearch] = useState('');

  const coverageQ = useQuery<CoverageRow[]>({
    queryKey: ['pet-food-coverage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_food_products')
        .select('id, name, pet_food_brands!inner(name), pet_food_nutrition(completeness_score, confidence)')
        .eq('submission_status', 'approved')
        .eq('discontinued', false)
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((r: any) => {
        const nuts: Array<{ completeness_score: number | null; confidence: number | null }> =
          r.pet_food_nutrition ?? [];
        const best = nuts.length ? Math.max(...nuts.map((n) => n.completeness_score ?? 0)) : null;
        const bestConf = nuts.length ? Math.max(...nuts.map((n) => n.confidence ?? 0)) : null;
        return {
          product_id: r.id,
          product_name: r.name,
          brand_name: r.pet_food_brands?.name ?? '—',
          best_completeness: best,
          best_confidence: bestConf,
          nutrition_count: nuts.length,
        };
      });
    },
  });

  const runsQ = useQuery<RunLog[]>({
    queryKey: ['pet-food-bulk-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_food_bulk_enrich_runs')
        .select('id, started_at, finished_at, status, processed, succeeded, failed, skipped, params, error')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5000,
  });

  const bulkM = useMutation({
    mutationFn: async (payload: { limit: number; min_completeness: number; only_missing: boolean }) => {
      const { data, error } = await supabase.functions.invoke('bulk-enrich-pet-food', { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(
        t('petFoodCoverage.toast.runDone', {
          processed: data?.processed ?? 0,
          succeeded: data?.succeeded ?? 0,
          failed: data?.failed ?? 0,
        }),
      );
      qc.invalidateQueries({ queryKey: ['pet-food-coverage'] });
      qc.invalidateQueries({ queryKey: ['pet-food-bulk-runs'] });
    },
    onError: (e: any) => toast.error(e?.message ?? String(e)),
  });

  const singleM = useMutation({
    mutationFn: async (product_id: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-pet-food-product', { body: { product_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t('petFoodCoverage.toast.singleDone'));
      qc.invalidateQueries({ queryKey: ['pet-food-coverage'] });
    },
    onError: (e: any) => toast.error(e?.message ?? String(e)),
  });

  const stats = useMemo(() => {
    const rows = coverageQ.data ?? [];
    const total = rows.length;
    const enriched = rows.filter((r) => r.nutrition_count > 0).length;
    const highConf = rows.filter((r) => (r.best_confidence ?? 0) >= 0.7).length;
    const highComp = rows.filter((r) => (r.best_completeness ?? 0) >= 0.6).length;
    return { total, enriched, highConf, highComp };
  }, [coverageQ.data]);

  const brandHeatmap = useMemo(() => {
    const rows = coverageQ.data ?? [];
    const map = new Map<string, { total: number; missing: number; lowComp: number; sumComp: number; nWithComp: number }>();
    for (const r of rows) {
      const cur = map.get(r.brand_name) ?? { total: 0, missing: 0, lowComp: 0, sumComp: 0, nWithComp: 0 };
      cur.total++;
      if (r.nutrition_count === 0) cur.missing++;
      if (r.best_completeness != null) {
        cur.sumComp += r.best_completeness;
        cur.nWithComp++;
        if (r.best_completeness < 0.6) cur.lowComp++;
      }
      map.set(r.brand_name, cur);
    }
    return Array.from(map.entries())
      .map(([brand, v]) => ({
        brand,
        total: v.total,
        missing: v.missing,
        lowComp: v.lowComp,
        avgComp: v.nWithComp ? v.sumComp / v.nWithComp : 0,
        coverage: v.total ? 1 - v.missing / v.total : 0,
      }))
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 12);
  }, [coverageQ.data]);

  const filteredRows = useMemo(() => {
    const rows = coverageQ.data ?? [];
    const s = search.toLowerCase().trim();
    return rows
      .filter((r) => !s || r.product_name.toLowerCase().includes(s) || r.brand_name.toLowerCase().includes(s))
      .sort((a, b) => (a.best_completeness ?? -1) - (b.best_completeness ?? -1))
      .slice(0, 200);
  }, [coverageQ.data, search]);

  const pct = (n: number, d: number) => (d === 0 ? '0%' : `${Math.round((n / d) * 100)}%`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('petFoodCoverage.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('petFoodCoverage.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { coverageQ.refetch(); runsQ.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />{t('petFoodCoverage.refresh')}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={t('petFoodCoverage.kpi.total')} value={stats.total} sub="" loading={coverageQ.isLoading} />
        <KpiCard label={t('petFoodCoverage.kpi.enriched')} value={stats.enriched} sub={pct(stats.enriched, stats.total)} loading={coverageQ.isLoading} />
        <KpiCard label={t('petFoodCoverage.kpi.highComp')} value={stats.highComp} sub={pct(stats.highComp, stats.total)} loading={coverageQ.isLoading} />
        <KpiCard label={t('petFoodCoverage.kpi.highConf')} value={stats.highConf} sub={pct(stats.highConf, stats.total)} loading={coverageQ.isLoading} />
      </div>

      {/* Bulk run form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('petFoodCoverage.bulk.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs">{t('petFoodCoverage.bulk.limit')}</Label>
              <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 25)} />
            </div>
            <div>
              <Label className="text-xs">{t('petFoodCoverage.bulk.minCompleteness')}</Label>
              <Input type="number" min={0} max={1} step={0.05} value={minCompleteness} onChange={(e) => setMinCompleteness(Number(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input id="onlyMissing" type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="onlyMissing" className="text-xs">{t('petFoodCoverage.bulk.onlyMissing')}</Label>
            </div>
            <Button
              onClick={() => bulkM.mutate({ limit, min_completeness: minCompleteness, only_missing: onlyMissing })}
              disabled={bulkM.isPending}
            >
              {bulkM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {t('petFoodCoverage.bulk.run')}
            </Button>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{t('petFoodCoverage.bulk.warning')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Heatmap by brand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('petFoodCoverage.heatmap.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {coverageQ.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="space-y-2">
              {brandHeatmap.map((b) => (
                <div key={b.brand} className="flex items-center gap-3">
                  <div className="w-40 truncate text-sm">{b.brand}</div>
                  <div className="flex-1 h-6 rounded bg-muted overflow-hidden relative">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round(b.coverage * 100)}%`,
                        background: b.coverage >= 0.8 ? 'hsl(var(--primary))' : b.coverage >= 0.4 ? 'hsl(45 90% 55%)' : 'hsl(0 75% 55%)',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {Math.round(b.coverage * 100)}% · {b.total - b.missing}/{b.total}
                    </span>
                  </div>
                  <div className="w-24 text-xs text-muted-foreground text-right">
                    {t('petFoodCoverage.heatmap.avgComp')}: {Math.round(b.avgComp * 100)}%
                  </div>
                </div>
              ))}
              {brandHeatmap.length === 0 && (
                <div className="text-sm text-muted-foreground">{t('petFoodCoverage.heatmap.empty')}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{t('petFoodCoverage.table.title')}</span>
            <Input
              placeholder={t('petFoodCoverage.table.searchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-8"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {coverageQ.isLoading ? (
            <div className="p-6"><Skeleton className="h-40 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('petFoodCoverage.table.brand')}</TableHead>
                  <TableHead>{t('petFoodCoverage.table.product')}</TableHead>
                  <TableHead className="text-right">{t('petFoodCoverage.table.completeness')}</TableHead>
                  <TableHead className="text-right">{t('petFoodCoverage.table.confidence')}</TableHead>
                  <TableHead className="text-right">{t('petFoodCoverage.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow key={r.product_id}>
                    <TableCell className="text-sm text-muted-foreground">{r.brand_name}</TableCell>
                    <TableCell className="text-sm">{r.product_name}</TableCell>
                    <TableCell className="text-right">
                      {r.nutrition_count === 0
                        ? <Badge variant="destructive">{t('petFoodCoverage.table.missing')}</Badge>
                        : <Badge variant={r.best_completeness && r.best_completeness >= 0.6 ? 'default' : 'secondary'}>
                            {Math.round((r.best_completeness ?? 0) * 100)}%
                          </Badge>}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {r.best_confidence != null ? `${Math.round(r.best_confidence * 100)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => singleM.mutate(r.product_id)} disabled={singleM.isPending}>
                        {singleM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t('petFoodCoverage.table.reenrich')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    {t('petFoodCoverage.table.empty')}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Runs log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('petFoodCoverage.runs.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('petFoodCoverage.runs.when')}</TableHead>
                <TableHead>{t('petFoodCoverage.runs.status')}</TableHead>
                <TableHead className="text-right">{t('petFoodCoverage.runs.processed')}</TableHead>
                <TableHead className="text-right">{t('petFoodCoverage.runs.succeeded')}</TableHead>
                <TableHead className="text-right">{t('petFoodCoverage.runs.failed')}</TableHead>
                <TableHead className="text-right">{t('petFoodCoverage.runs.skipped')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(runsQ.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.started_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.status === 'completed' ? (
                      <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />{r.status}</Badge>
                    ) : r.status === 'failed' ? (
                      <Badge variant="destructive">{r.status}</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />{r.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">{r.processed}</TableCell>
                  <TableCell className="text-right text-sm text-emerald-600">{r.succeeded}</TableCell>
                  <TableCell className="text-right text-sm text-red-600">{r.failed}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{r.skipped}</TableCell>
                </TableRow>
              ))}
              {(runsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                  {t('petFoodCoverage.runs.empty')}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, sub, loading }: { label: string; value: number; sub: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        {loading ? (
          <Skeleton className="h-7 w-16 mt-1" />
        ) : (
          <>
            <div className="text-2xl font-semibold">{value}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}