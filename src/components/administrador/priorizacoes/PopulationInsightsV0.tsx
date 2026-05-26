import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles, GitBranch, FlaskConical, Database, RefreshCw, Loader2, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanDndProvider, DroppableColumn, DraggableCard } from './dnd/KanbanDnd';

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
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cohort_insights')
      .select('*')
      .order('confidence', { ascending: false })
      .limit(200);
    if (!error) setInsights((data ?? []) as DbInsight[]);
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, []);

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
                  <Card className="bg-white">
                    <CardContent className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-semibold leading-tight">{isPt ? c.title : (c.title_en || c.title)}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{Math.round((c.confidence ?? 0) * 100)}</Badge>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-snug">{isPt ? c.summary : (c.summary_en || c.summary)}</p>
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
                        <span className="text-[9px] text-gray-400 italic">arraste para mover</span>
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
    </div>
  );
};

export default PopulationInsightsV0;