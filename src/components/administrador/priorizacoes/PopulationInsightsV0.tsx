import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles, GitBranch, FlaskConical, Database, RefreshCw, Loader2, Bot, BookOpen, Maximize2, RotateCw } from 'lucide-react';
import { Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanDndProvider, DroppableColumn, DraggableCard } from './dnd/KanbanDnd';
import InsightDrillDownDialog from './InsightDrillDownDialog';
import OriginalityDialog from './OriginalityDialog';
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
  const [drillDownInsight, setDrillDownInsight] = useState<DbInsight | null>(null);
  const [originalityInsight, setOriginalityInsight] = useState<DbInsight | null>(null);
  const [autoQueue, setAutoQueue] = useState<Set<string>>(new Set());

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

  const grouped = useMemo(() => {
    const map: Record<InsightStage, DbInsight[]> = {
      discovery: [], hypothesis: [], proposed_meta_study: [], approved: [],
    };
    insights.forEach((i) => { if (map[i.stage]) map[i.stage].push(i); });
    return map;
  }, [insights]);

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

      <KanbanDndProvider onDrop={(id, col) => moveStage(id, col as InsightStage)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const cards = grouped[s.id];
          return (
            <DroppableColumn key={s.id} id={s.id} className={`rounded-lg border ${s.color} p-2 flex flex-col min-h-[300px]`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </h3>
                <span className="text-[10px] font-mono text-gray-500 bg-white rounded-full px-1.5 py-0.5">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {cards.length === 0 ? (
                  <div className="text-[11px] text-gray-400 italic text-center py-6">—</div>
                ) : cards.map((c) => (
                  <DraggableCard key={c.id} id={c.id}>
                  <Card className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-semibold leading-tight">{isPt ? c.title : (c.title_en || c.title)}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {originalityBadge(c, checkingOriginality === c.id)}
                          <Badge variant="outline" className="text-[10px] font-mono">{Math.round((c.confidence ?? 0) * 100)}</Badge>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-snug">{isPt ? c.summary : (c.summary_en || c.summary)}</p>
                      <div className="pt-0.5">
                        {c.cohort_id && cohortNames[c.cohort_id] ? (
                          <Badge variant="outline" className="text-[9px] bg-indigo-50 border-indigo-200 text-indigo-800 flex items-center gap-1 w-fit max-w-full">
                            <Database className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{cohortNames[c.cohort_id]}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] bg-purple-50 border-purple-300 text-purple-800 flex items-center gap-1 w-fit">
                            <Layers className="h-2.5 w-2.5" /> Pan-cohort (todos)
                          </Badge>
                        )}
                      </div>
                      {(c.signals?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {c.signals!.slice(0, 4).map((sig, k) => (
                            <Badge key={k} variant="outline" className="text-[10px] bg-gray-50">{sig}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t gap-2">
                        {c.source_model ? (
                          <Badge variant="outline" className="text-[9px] font-mono flex items-center gap-1 bg-gray-50">
                            <Bot className="h-2.5 w-2.5" /> {c.source_model}
                          </Badge>
                        ) : <span />}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm" variant="default" className="h-6 px-2 text-[10px]"
                            onClick={(e) => { e.stopPropagation(); setDrillDownInsight(c); }}
                            title="Abrir drill-down com gráficos e pets"
                          >
                            <Maximize2 className="h-3 w-3 mr-0.5" /> detalhar
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                            disabled={checkingOriginality === c.id}
                            onClick={(e) => { e.stopPropagation(); checkOriginality(c.id); }}
                            title="Re-verificar originalidade na literatura veterinária"
                          >
                            {checkingOriginality === c.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RotateCw className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </DraggableCard>
                ))}
              </div>
            </DroppableColumn>
          );
        })}
      </div>
      </KanbanDndProvider>

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
    </div>
  );
};

export default PopulationInsightsV0;