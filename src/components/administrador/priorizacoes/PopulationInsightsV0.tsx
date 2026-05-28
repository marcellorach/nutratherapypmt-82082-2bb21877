import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles, GitBranch, FlaskConical, Database, RefreshCw, Loader2, Bot, BookOpen, Maximize2, RotateCw, Stethoscope, CheckCircle2, XCircle, AlertCircle, FlaskRound } from 'lucide-react';
import { Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InsightDrillDownDialog from './InsightDrillDownDialog';
import OriginalityDialog from './OriginalityDialog';
import VetCuratorReviewDialog, { VetReviewStatus } from './VetCuratorReviewDialog';
import { toast } from '@/components/ui/use-toast';

type InsightStage = 'discovery' | 'hypothesis' | 'proposed_meta_study' | 'approved';
interface DbInsight {
  id: string;
  cohort_id: string | null;
  kind: string;
  stage: InsightStage;
  title: string;
  title_en: string | null;
  summary: string;
  summary_en: string | null;
  evidence: any;
  confidence: number;
  signals: string[] | null;
  created_at: string;
  source_model?: string | null;
  originality_status?: 'unknown' | 'novel' | 'partial' | 'known';
  originality_checked_at?: string | null;
  originality_evidence?: any;
  vet_review_status?: VetReviewStatus | null;
  vet_review_notes?: string | null;
  vet_reviewed_at?: string | null;
}

const STAGES: { id: InsightStage; label: string; color: string; icon: React.ComponentType<any> }[] = [
  { id: 'discovery', label: 'Descobertas', color: 'bg-blue-50 border-blue-200', icon: Sparkles },
  { id: 'hypothesis', label: 'Hipóteses', color: 'bg-amber-50 border-amber-200', icon: GitBranch },
  { id: 'proposed_meta_study', label: 'Meta-estudos propostos', color: 'bg-purple-50 border-purple-200', icon: FlaskConical },
  { id: 'approved', label: 'Aprovados', color: 'bg-emerald-50 border-emerald-200', icon: Database },
];

const PopulationInsightsV0: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const [insights, setInsights] = useState<DbInsight[]>([]);
  const [cohortNames, setCohortNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingOriginality, setCheckingOriginality] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [drillDownInsight, setDrillDownInsight] = useState<DbInsight | null>(null);
  const [originalityInsight, setOriginalityInsight] = useState<DbInsight | null>(null);
  const [reviewInsight, setReviewInsight] = useState<DbInsight | null>(null);
  const [autoQueue, setAutoQueue] = useState<Set<string>>(new Set());
  const [cohortFilter, setCohortFilter] = useState<string>('all');

  const fetchInsights = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cohort_insights')
      .select('*')
      .order('confidence', { ascending: false })
      .limit(200);
    if (!error) setInsights((data ?? []) as DbInsight[]);
    const { data: cohorts } = await supabase.from('synthetic_cohorts').select('id, name');
    if (cohorts) {
      const m: Record<string, string> = {};
      cohorts.forEach((c: any) => { m[c.id] = c.name; });
      setCohortNames(m);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  // Auto-check originality for insights that have never been checked.
  // Processes sequentially (one at a time) to avoid hammering the provider.
  useEffect(() => {
    const pending = insights.filter(
      (i) => (!i.originality_status || i.originality_status === 'unknown') && !autoQueue.has(i.id)
    );
    if (pending.length === 0 || checkingOriginality) return;
    const next = pending[0];
    setAutoQueue((s) => new Set(s).add(next.id));
    (async () => {
      await checkOriginality(next.id, /*silent*/ true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights, checkingOriginality]);

  const filteredInsights = useMemo(() => {
    if (cohortFilter === 'all') return insights;
    if (cohortFilter === 'pan') return insights.filter((i) => !i.cohort_id);
    return insights.filter((i) => i.cohort_id === cohortFilter);
  }, [insights, cohortFilter]);

  const cohortChips = useMemo(() => {
    const counts: Record<string, number> = {};
    let pan = 0;
    insights.forEach((i) => {
      if (!i.cohort_id) pan++;
      else counts[i.cohort_id] = (counts[i.cohort_id] ?? 0) + 1;
    });
    const chips = Object.entries(counts)
      .map(([id, count]) => ({ id, label: cohortNames[id] ?? id.slice(0, 8), count }))
      .sort((a, b) => b.count - a.count);
    return { pan, chips };
  }, [insights, cohortNames]);

  const grouped = useMemo(() => {
    const map: Record<InsightStage, DbInsight[]> = {
      discovery: [], hypothesis: [], proposed_meta_study: [], approved: [],
    };
    filteredInsights.forEach((i) => { if (map[i.stage]) map[i.stage].push(i); });
    return map;
  }, [filteredInsights]);

  const moveStage = async (id: string, stage: InsightStage) => {
    setInsights((curr) => curr.map((i) => i.id === id ? { ...i, stage } : i));
    await supabase.from('cohort_insights').update({ stage }).eq('id', id);
  };

  const checkOriginality = async (id: string, silent = false) => {
    setCheckingOriginality(id);
    try {
      const { data, error } = await supabase.functions.invoke('check-insight-originality', { body: { insight_id: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!silent) toast({ title: 'Originalidade verificada', description: `Resultado: ${data?.status}.` });
      fetchInsights();
    } catch (e: any) {
      if (!silent) toast({ title: 'Falha na verificação', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setCheckingOriginality(null);
    }
  };

  const regenerateEvidence = async (id: string) => {
    setRegenerating(id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cohort-patterns', {
        body: { insight_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Insight re-analisado', description: 'Evidência quantitativa atualizada.' });
      fetchInsights();
    } catch (e: any) {
      toast({ title: 'Falha na re-análise', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setRegenerating(null);
    }
  };

  const originalityBadge = (c: DbInsight, isChecking: boolean) => {
    if (isChecking || (!c.originality_status || c.originality_status === 'unknown')) {
      return (
        <Badge variant="outline" className="text-[9px] bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> originalidade…
        </Badge>
      );
    }
    const map: Record<string, { color: string; label: string }> = {
      novel:   { color: 'bg-emerald-100 border-emerald-300 text-emerald-800', label: '✦ inédito' },
      partial: { color: 'bg-amber-100 border-amber-300 text-amber-800',       label: '~ parcial' },
      known:   { color: 'bg-gray-100 border-gray-300 text-gray-700',          label: '⌖ já publicado' },
    };
    const v = map[c.originality_status]; if (!v) return null;
    const nCites = (c.originality_evidence?.citations ?? []).length;
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOriginalityInsight(c); }}
        title="Ver evidências e citações da busca na literatura"
      >
        <Badge variant="outline" className={`text-[9px] cursor-pointer hover:brightness-95 ${v.color}`}>
          {v.label}{nCites > 0 ? ` · ${nCites} ref` : ''}
        </Badge>
      </button>
    );
  };

  const vetReviewBadge = (c: DbInsight) => {
    const st = (c.vet_review_status ?? 'pending') as VetReviewStatus;
    const map: Record<VetReviewStatus, { color: string; label: string; Icon: React.ComponentType<any> }> = {
      pending:       { color: 'bg-gray-100 border-gray-300 text-gray-700',           label: 'vet: pendente',  Icon: Stethoscope },
      approved:      { color: 'bg-emerald-100 border-emerald-300 text-emerald-800',  label: 'vet: aprovado',  Icon: CheckCircle2 },
      rejected:      { color: 'bg-red-100 border-red-300 text-red-800',              label: 'vet: rejeitado', Icon: XCircle },
      needs_changes: { color: 'bg-amber-100 border-amber-300 text-amber-800',        label: 'vet: ajustes',   Icon: AlertCircle },
    };
    const v = map[st];
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setReviewInsight(c); }}
        title="Abrir revisão do vet-curador"
      >
        <Badge variant="outline" className={`text-[9px] cursor-pointer hover:brightness-95 flex items-center gap-0.5 ${v.color}`}>
          <v.Icon className="h-2.5 w-2.5" /> {v.label}
        </Badge>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-emerald-300 bg-emerald-50/60">
        <CardContent className="p-3 text-xs text-amber-900 flex items-start gap-2">
          <Database className="h-4 w-4 shrink-0 mt-0.5 text-emerald-700" />
          <div className="text-emerald-900 flex-1">
            <b>Population Insights v0 — alimentado por cohorts sintéticos reais.</b> Os insights abaixo vêm da tabela
            <code> cohort_insights</code>, gerados pelo edge function <code>analyze-cohort-patterns</code>.
            Quando o cohort histórico real do parceiro clínico chegar, os mesmos pipelines passam a consumi-lo —
            cohorts sintéticos continuam marcados para distinção. Arraste mover via menu de estágio.
          </div>
          <Button size="sm" variant="outline" onClick={fetchInsights} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {insights.length === 0 && !loading && (
        <Card><CardContent className="p-6 text-center text-sm text-gray-500">
          Nenhum insight ainda. Gere um cohort sintético na aba <b>Gerador de Cohort</b> → "Gerar cohort" → depois clique em <b>Analisar padrões</b> em <b>Cohorts sintéticos</b>.
        </CardContent></Card>
      )}

      {insights.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[10px] uppercase tracking-wide text-gray-500 mr-1">Filtrar por cohort:</span>
          {[
            { id: 'all', label: 'Todos', count: insights.length },
            ...(cohortChips.pan > 0 ? [{ id: 'pan', label: 'Pan-cohort', count: cohortChips.pan }] : []),
            ...cohortChips.chips,
          ].map((chip) => {
            const active = cohortFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCohortFilter(active && chip.id !== 'all' ? 'all' : chip.id)}
                className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition ${
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="truncate max-w-[220px]">{chip.label}</span>
                <span className={`text-[9px] font-mono rounded-full px-1 ${active ? 'bg-white/20' : 'bg-gray-100'}`}>{chip.count}</span>
              </button>
            );
          })}
        </div>
      )}

      <Tabs defaultValue={STAGES[0].id} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-gray-100 p-1 gap-1">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
                <span className="text-[10px] font-mono text-gray-500 bg-white rounded-full px-1.5 py-0.5 border">
                  {grouped[s.id].length}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {STAGES.map((s) => {
          const cards = grouped[s.id];
          return (
            <TabsContent key={s.id} value={s.id} className="mt-4">
              {cards.length === 0 ? (
                <div className="text-sm text-gray-400 italic text-center py-12 border border-dashed rounded-lg">
                  Nenhum card neste estágio.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cards.map((c) => (
                    <Card key={c.id} className="bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-snug">{isPt ? c.title : (c.title_en || c.title)}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {originalityBadge(c, checkingOriginality === c.id)}
                            {vetReviewBadge(c)}
                            <Badge variant="outline" className="text-[10px] font-mono">{Math.round((c.confidence ?? 0) * 100)}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{isPt ? c.summary : (c.summary_en || c.summary)}</p>
                        <div>
                          {c.cohort_id && cohortNames[c.cohort_id] ? (
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-800 flex items-center gap-1 w-fit max-w-full">
                              <Database className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{cohortNames[c.cohort_id]}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-300 text-purple-800 flex items-center gap-1 w-fit">
                              <Layers className="h-2.5 w-2.5" /> Pan-cohort (todos)
                            </Badge>
                          )}
                        </div>
                        {(c.signals?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {c.signals!.slice(0, 6).map((sig, k) => (
                              <Badge key={k} variant="outline" className="text-[10px] bg-gray-50">{sig}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t gap-2">
                          {c.source_model ? (
                            <Badge variant="outline" className="text-[10px] font-mono flex items-center gap-1 bg-gray-50">
                              <Bot className="h-2.5 w-2.5" /> {c.source_model}
                            </Badge>
                          ) : <span />}
                          <Select value={c.stage} onValueChange={(v) => moveStage(c.id, v as InsightStage)}>
                            <SelectTrigger className="h-7 text-[10px] w-auto gap-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map((st) => (
                                <SelectItem key={st.id} value={st.id} className="text-xs">{st.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm" variant="default" className="h-7 px-2 text-[11px]"
                            onClick={(e) => { e.stopPropagation(); setDrillDownInsight(c); }}
                            title="Abrir drill-down com gráficos e pets"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> detalhar
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-[11px] border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={(e) => { e.stopPropagation(); setReviewInsight(c); }}
                            title="Validar como vet-curador (aprovar / rejeitar / requerer ajustes)"
                          >
                            <Stethoscope className="h-3 w-3 mr-1" /> validar
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 px-2 text-[11px]"
                            disabled={checkingOriginality === c.id}
                            onClick={(e) => { e.stopPropagation(); checkOriginality(c.id); }}
                            title="Re-verificar originalidade na literatura veterinária"
                          >
                            {checkingOriginality === c.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RotateCw className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-[11px] text-amber-700 hover:bg-amber-50"
                            disabled={regenerating === c.id}
                            onClick={(e) => { e.stopPropagation(); regenerateEvidence(c.id); }}
                            title="Re-analisar forçando evidência quantitativa estruturada (n, prevalência, baseline, effect size)"
                          >
                            {regenerating === c.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <FlaskRound className="h-3 w-3" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <InsightDrillDownDialog
        insight={drillDownInsight as any}
        open={!!drillDownInsight}
        onOpenChange={(v) => !v && setDrillDownInsight(null)}
      />
      <OriginalityDialog
        insight={originalityInsight as any}
        open={!!originalityInsight}
        onOpenChange={(v) => !v && setOriginalityInsight(null)}
      />
      <VetCuratorReviewDialog
        insight={reviewInsight as any}
        open={!!reviewInsight}
        onOpenChange={(v) => !v && setReviewInsight(null)}
        onReviewed={fetchInsights}
        onOpenDrillDown={(ins) => {
          setReviewInsight(null);
          setDrillDownInsight(ins as any);
        }}
      />
    </div>
  );
};

export default PopulationInsightsV0;