import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Download, ShieldCheck, AlertTriangle, XCircle, RefreshCcw, ArrowUpRight, ArrowDownRight, Sparkles, Minus, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedField } from '@/hooks/useLocalizedField';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SENEX_VERSION } from '@/config/senex-version';
import { COMPLIANCE_ITEMS, type ComplianceItem, type Status } from './complianceData';
import { I18N_VERSION } from '@/i18n';
import { lastChangelogDate } from '@/data/projectChangelog.generated';
import VersionBadge from '@/components/system/VersionBadge';

type Authority = 'FDA' | 'EMA' | 'AVMA';
type Delta = 'improved' | 'regressed' | 'unchanged' | 'new';

const STATUS_CFG: Record<Status, { cls: string; Icon: any }> = {
  meets:   { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: ShieldCheck },
  partial: { cls: 'bg-amber-100 text-amber-800 border-amber-300',     Icon: AlertTriangle },
  gap:     { cls: 'bg-rose-100 text-rose-800 border-rose-300',         Icon: XCircle },
};

const PRIORITY_CLS: Record<string, string> = {
  P0: 'bg-rose-600 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-sky-500 text-white',
  P3: 'bg-slate-400 text-white',
};

const STATUS_RANK: Record<Status, number> = { gap: 0, partial: 1, meets: 2 };

interface AuditRun {
  id: string;
  run_at: string;
  system_version: string;
  i18n_version: string | null;
  totals: { total: number; meets: number; partial: number; gap: number };
  per_authority: Record<Authority, { total: number; meets: number; partial: number; gap: number }>;
  diff: Array<{ key: string; authority: Authority; requirement: string; prev: Status | null; next: Status; delta: Delta }>;
  notes: string | null;
}

const ComplianceDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { localizedField } = useLocalizedField();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [authority, setAuthority] = useState<Authority | 'all'>('all');
  const [priority, setPriority] = useState<string>('all');

  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fieldName = (item: ComplianceItem, base: 'requirement' | 'evidence' | 'action') =>
    localizedField(item, base);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('compliance_audit_runs')
        .select('*')
        .order('run_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error(error);
        return;
      }
      setRuns((data || []) as unknown as AuditRun[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return COMPLIANCE_ITEMS.filter(item => {
      if (authority !== 'all' && item.authority !== authority) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (priority !== 'all' && item.priority !== priority) return false;
      if (!q) return true;
      return [
        item.requirement, item.requirement_en,
        item.evidence, item.evidence_en,
        item.action, item.action_en,
        item.artifact, item.reference,
      ].some(v => v?.toLowerCase().includes(q));
    });
  }, [search, status, authority, priority]);

  const stats = useMemo(() => {
    const base = (items: ComplianceItem[]) => ({
      total: items.length,
      meets: items.filter(i => i.status === 'meets').length,
      partial: items.filter(i => i.status === 'partial').length,
      gap: items.filter(i => i.status === 'gap').length,
    });
    return {
      all: base(COMPLIANCE_ITEMS),
      FDA: base(COMPLIANCE_ITEMS.filter(i => i.authority === 'FDA')),
      EMA: base(COMPLIANCE_ITEMS.filter(i => i.authority === 'EMA')),
      AVMA: base(COMPLIANCE_ITEMS.filter(i => i.authority === 'AVMA')),
      filtered: base(filtered),
    };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['authority','requirement','reference','evidence','artifact','status','priority','effort','action'];
    const rows = filtered.map(i => headers.map(h => `"${String((i as any)[h] ?? '').replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runCheck = async () => {
    setRunning(true);
    try {
      const last = runs[0];
      const prevMap: Record<string, Status> = {};
      if (last) {
        // reconstruct previous statuses from the last diff (next) plus older runs
        for (const r of runs) {
          for (const d of r.diff) {
            if (!(d.key in prevMap)) prevMap[d.key] = d.next;
          }
        }
      }

      const diff = COMPLIANCE_ITEMS.map(item => {
        const key = `${item.authority}::${item.requirement}`;
        const prev = prevMap[key] ?? null;
        let delta: Delta = 'new';
        if (prev !== null) {
          if (prev === item.status) delta = 'unchanged';
          else if (STATUS_RANK[item.status] > STATUS_RANK[prev]) delta = 'improved';
          else delta = 'regressed';
        }
        return { key, authority: item.authority, requirement: item.requirement, prev, next: item.status, delta };
      });

      const totals = {
        total: COMPLIANCE_ITEMS.length,
        meets: COMPLIANCE_ITEMS.filter(i => i.status === 'meets').length,
        partial: COMPLIANCE_ITEMS.filter(i => i.status === 'partial').length,
        gap: COMPLIANCE_ITEMS.filter(i => i.status === 'gap').length,
      };
      const perAuthority = (['FDA','EMA','AVMA'] as Authority[]).reduce((acc, a) => {
        const items = COMPLIANCE_ITEMS.filter(i => i.authority === a);
        acc[a] = {
          total: items.length,
          meets: items.filter(i => i.status === 'meets').length,
          partial: items.filter(i => i.status === 'partial').length,
          gap: items.filter(i => i.status === 'gap').length,
        };
        return acc;
      }, {} as Record<Authority, any>);

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('compliance_audit_runs')
        .insert({
          system_version: SENEX_VERSION,
          i18n_version: I18N_VERSION,
          totals,
          per_authority: perAuthority,
          diff,
          notes: notes.trim() || null,
          run_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      setRuns(prev => [data as unknown as AuditRun, ...prev]);
      setNotes('');
      toast.success(t('compliance.history.runSuccess'));
    } catch (e: any) {
      console.error(e);
      toast.error(t('compliance.history.runError'));
    } finally {
      setRunning(false);
    }
  };

  const StatCard: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`text-3xl font-semibold mt-1 ${tone ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );

  const renderTable = (items: ComplianceItem[]) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">{t('compliance.table.authority')}</TableHead>
            <TableHead>{t('compliance.table.requirement')}</TableHead>
            <TableHead className="w-[28%]">{t('compliance.table.evidence')}</TableHead>
            <TableHead>{t('compliance.table.artifact')}</TableHead>
            <TableHead className="w-[110px]">{t('compliance.table.status')}</TableHead>
            <TableHead className="w-[80px]">{t('compliance.table.priority')}</TableHead>
            <TableHead>{t('compliance.table.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => {
            const cfg = STATUS_CFG[item.status];
            const Icon = cfg.Icon;
            return (
              <TableRow key={idx}>
                <TableCell><Badge variant="outline">{item.authority}</Badge></TableCell>
                <TableCell>
                  <div className="font-medium">{fieldName(item, 'requirement')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.reference}</div>
                </TableCell>
                <TableCell className="text-sm">{fieldName(item, 'evidence')}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{item.artifact}</TableCell>
                <TableCell>
                  <Badge className={`${cfg.cls} border gap-1`} variant="outline">
                    <Icon className="h-3 w-3" />
                    {t(`compliance.status.${item.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.priority && (
                    <Badge className={PRIORITY_CLS[item.priority]}>{item.priority}{item.effort ? `·${item.effort}` : ''}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{fieldName(item, 'action')}</TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('compliance.table.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const deltaIcon = (d: Delta) => {
    if (d === 'improved') return <ArrowUpRight className="h-3 w-3" />;
    if (d === 'regressed') return <ArrowDownRight className="h-3 w-3" />;
    if (d === 'new') return <Sparkles className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };
  const deltaCls = (d: Delta) => {
    if (d === 'improved') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (d === 'regressed') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (d === 'new') return 'bg-sky-100 text-sky-800 border-sky-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('compliance.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('compliance.subtitlePrefix')}{' '}
            <a
              href="https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-software-medical-device"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              FDA ({t('compliance.dates.fda')})
            </a>
            {' · '}
            <a
              href="https://www.ema.europa.eu/en/about-us/how-we-work/big-data/artificial-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              EMA ({t('compliance.dates.ema')}
            </a>
            {' + '}
            <a
              href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              EU AI Act
            </a>
            {') · '}
            <a
              href="https://www.avma.org/resources-tools/avma-policies/artificial-intelligence-veterinary-medicine"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              AVMA ({t('compliance.dates.avma')})
            </a>
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 italic max-w-2xl">{t('compliance.systemNote')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <VersionBadge />
            <span className="text-[11px] text-muted-foreground">
              {t('compliance.snapshotHint', {
                defaultValue: 'Snapshot of the curated checklist ({{count}} requirements) tied to this exact version.',
                count: COMPLIANCE_ITEMS.length,
              })}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="default" onClick={runCheck} disabled={running} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            {running
              ? t('compliance.running')
              : t('compliance.snapshotButton', {
                  defaultValue: 'Snapshot compliance (v{{v}} · i18n {{i}})',
                  v: SENEX_VERSION,
                  i: I18N_VERSION,
                })}
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> {t('compliance.exportCsv')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('compliance.stats.total')} value={stats.all.total} />
        <StatCard label={t('compliance.stats.meets')} value={stats.all.meets} tone="text-emerald-600" />
        <StatCard label={t('compliance.stats.partial')} value={stats.all.partial} tone="text-amber-600" />
        <StatCard label={t('compliance.stats.gap')} value={stats.all.gap} tone="text-rose-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('compliance.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder={t('compliance.filters.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder={t('compliance.filters.statusPlaceholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('compliance.filters.allStatuses')}</SelectItem>
              <SelectItem value="meets">{t('compliance.status.meets')}</SelectItem>
              <SelectItem value="partial">{t('compliance.status.partial')}</SelectItem>
              <SelectItem value="gap">{t('compliance.status.gap')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue placeholder={t('compliance.filters.priorityPlaceholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('compliance.filters.allPriorities')}</SelectItem>
              <SelectItem value="P0">{t('compliance.filters.p0')}</SelectItem>
              <SelectItem value="P1">{t('compliance.filters.p1')}</SelectItem>
              <SelectItem value="P2">{t('compliance.filters.p2')}</SelectItem>
              <SelectItem value="P3">{t('compliance.filters.p3')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={authority} onValueChange={(v) => setAuthority(v as any)}>
        <TabsList className="grid grid-cols-4 w-full md:w-[480px]">
          <TabsTrigger value="all">{t('compliance.tabs.all')} ({stats.all.total})</TabsTrigger>
          <TabsTrigger value="FDA">FDA ({stats.FDA.total})</TabsTrigger>
          <TabsTrigger value="EMA">EMA ({stats.EMA.total})</TabsTrigger>
          <TabsTrigger value="AVMA">AVMA ({stats.AVMA.total})</TabsTrigger>
        </TabsList>
        <TabsContent value={authority} className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">
            {t('compliance.tabs.showing', {
              shown: stats.filtered.total,
              total: stats.all.total,
              meets: stats.filtered.meets,
              partial: stats.filtered.partial,
              gap: stats.filtered.gap,
            })}
          </div>
          {renderTable(filtered)}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setHistoryOpen(o => !o)}>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('compliance.history.title')}
              <Badge variant="outline" className="ml-2">{runs.length}</Badge>
            </span>
            {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {historyOpen && (
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{t('compliance.history.subtitle')}</p>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('compliance.history.notesPlaceholder')}
              rows={2}
              className="text-sm"
            />

            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">{t('compliance.history.empty')}</p>
            ) : (
              <div className="space-y-3">
                {runs.map(run => {
                  const counts = run.diff.reduce(
                    (a, d) => ({ ...a, [d.delta]: (a as any)[d.delta] + 1 }),
                    { improved: 0, regressed: 0, unchanged: 0, new: 0 } as Record<Delta, number>,
                  );
                  const isOpen = expandedRunId === run.id;
                  return (
                    <div key={run.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="font-mono text-xs">v{run.system_version}</Badge>
                          <span className="text-muted-foreground">
                            {new Date(run.run_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {run.totals.meets}✓ / {run.totals.partial}~ / {run.totals.gap}✗
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {counts.improved > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1" variant="outline">
                              <ArrowUpRight className="h-3 w-3" />{t('compliance.history.improved', { count: counts.improved })}
                            </Badge>
                          )}
                          {counts.regressed > 0 && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 gap-1" variant="outline">
                              <ArrowDownRight className="h-3 w-3" />{t('compliance.history.regressed', { count: counts.regressed })}
                            </Badge>
                          )}
                          {counts.new > 0 && (
                            <Badge className="bg-sky-100 text-sky-800 border-sky-300 gap-1" variant="outline">
                              <Sparkles className="h-3 w-3" />{t('compliance.history.new', { count: counts.new })}
                            </Badge>
                          )}
                          <Badge variant="outline" className="gap-1">
                            <Minus className="h-3 w-3" />{t('compliance.history.unchanged', { count: counts.unchanged })}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => setExpandedRunId(isOpen ? null : run.id)}
                          >
                            {isOpen ? t('compliance.history.hideDiff') : t('compliance.history.viewDiff')}
                          </Button>
                        </div>
                      </div>
                      {run.notes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{run.notes}</p>
                      )}
                      {isOpen && (
                        <div className="mt-2 space-y-1 max-h-80 overflow-auto">
                          {run.diff
                            .filter(d => d.delta !== 'unchanged')
                            .map((d, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs py-1 border-b last:border-b-0">
                                <Badge variant="outline" className={`${deltaCls(d.delta)} gap-1 shrink-0`}>
                                  {deltaIcon(d.delta)}
                                  {t(`compliance.history.delta${d.delta.charAt(0).toUpperCase() + d.delta.slice(1)}`)}
                                </Badge>
                                <Badge variant="outline" className="shrink-0">{d.authority}</Badge>
                                <div className="flex-1">
                                  <div className="font-medium">{d.requirement}</div>
                                  <div className="text-muted-foreground">
                                    {d.prev && (
                                      <>
                                        <span>{t('compliance.history.from')}: </span>
                                        <span className="font-mono">{t(`compliance.status.${d.prev}`)}</span>
                                        <span> → </span>
                                      </>
                                    )}
                                    <span>{t('compliance.history.to')}: </span>
                                    <span className="font-mono">{t(`compliance.status.${d.next}`)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ComplianceDashboard;