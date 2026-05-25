import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Trash2, RefreshCw, FlaskConical, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useRoleView } from '@/contexts/RoleViewContext';

interface CohortRow {
  id: string;
  name: string;
  kind: 'prevention' | 'treatment_validation' | 'exploratory';
  rationale: string | null;
  target_n: number;
  generated_n: number;
  status: 'pending' | 'generating' | 'ready' | 'failed' | 'archived';
  generation_error: string | null;
  created_at: string;
  progress_log?: Array<{ ts: string; level: 'info' | 'warn' | 'error'; message: string }> | null;
}

const KIND_LABEL: Record<CohortRow['kind'], string> = {
  prevention: 'Prevenção',
  treatment_validation: 'Validação de tratamento',
  exploratory: 'Exploratório',
};

const STATUS_COLOR: Record<CohortRow['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  generating: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
};

const SyntheticCohortsManager: React.FC = () => {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<Record<string, boolean>>({});
  const { viewId } = useRoleView();
  const showModelTag = viewId === 'platform_architect';

  const fetchCohorts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('synthetic_cohorts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erro ao listar cohorts', description: error.message, variant: 'destructive' });
    setCohorts((data ?? []) as unknown as CohortRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCohorts();
    // poll while any cohort is generating
    const t = setInterval(() => {
      setCohorts((curr) => {
        if (curr.some((c) => c.status === 'generating')) fetchCohorts();
        return curr;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const runAnalysis = async (cohortId: string) => {
    setAnalyzing(cohortId);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cohort-patterns', {
        body: { cohort_id: cohortId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'Insights gerados',
        description: `${data?.generated ?? 0} insights adicionados ao Population Insights.`,
      });
    } catch (e: any) {
      toast({ title: 'Falha na análise', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setAnalyzing(null);
    }
  };

  const deleteCohort = async (cohortId: string) => {
    if (!window.confirm('Excluir este cohort e TODOS os pets sintéticos associados? Esta ação é irreversível.')) return;
    setDeleting(cohortId);
    try {
      // delete synthetic pets first (cascade via cohort_id ON DELETE SET NULL keeps pets, so we delete explicitly)
      const { error: petsErr } = await supabase.from('pet_profiles').delete().eq('cohort_id', cohortId).eq('is_synthetic', true);
      if (petsErr) throw petsErr;
      const { error: cErr } = await supabase.from('synthetic_cohorts').delete().eq('id', cohortId);
      if (cErr) throw cErr;
      toast({ title: 'Cohort excluído' });
      fetchCohorts();
    } catch (e: any) {
      toast({ title: 'Falha ao excluir', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="border-dashed bg-blue-50/40 border-blue-200">
        <CardContent className="p-3 text-xs text-blue-900 flex items-start gap-2">
          <Database className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <b>Cohorts sintéticos reais.</b> Pets gerados por IA com flag <code>is_synthetic=true</code> — não contaminam dados reais futuros.
            Use o botão "Gerar cohort sintético" no <b>Gerador de Cohort</b> para criar novos.
            {showModelTag && <> Modelo: <code className="text-[10px] bg-white px-1 rounded">google/gemini-3.5-flash</code>.</>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Cohorts ({cohorts.length})</h3>
        <Button size="sm" variant="outline" onClick={fetchCohorts} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {cohorts.length === 0 && !loading && (
        <Card><CardContent className="p-6 text-center text-sm text-gray-500">
          Nenhum cohort sintético ainda. Vá em <b>Gerador de Cohort</b> → gere sugestões com IA → clique em "Gerar cohort sintético".
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cohorts.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-tight">{c.name}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px]">{KIND_LABEL[c.kind]}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[c.status]}`}>
                      {c.status === 'generating' && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin inline" />}
                      {c.status === 'ready' && <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />}
                      {c.status === 'failed' && <AlertTriangle className="h-2.5 w-2.5 mr-1 inline" />}
                      {c.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.generated_n}/{c.target_n} pets
                    </Badge>
                  </div>
                </div>
              </div>
              {c.rationale && <p className="text-[11px] text-gray-600 line-clamp-3">{c.rationale}</p>}
              {c.generation_error && (
                <p className="text-[11px] text-red-700 bg-red-50 p-1.5 rounded">⚠ {c.generation_error}</p>
              )}
              {(c.progress_log && c.progress_log.length > 0) && (
                <div className="border rounded">
                  <button
                    type="button"
                    onClick={() => setExpandedLog((m) => ({ ...m, [c.id]: !m[c.id] }))}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <ScrollText className="h-3 w-3" />
                      Log de execução ({c.progress_log.length})
                    </span>
                    {expandedLog[c.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expandedLog[c.id] && (
                    <div className="max-h-40 overflow-y-auto px-2 py-1.5 text-[10px] font-mono space-y-0.5 bg-gray-50 border-t">
                      {c.progress_log.slice().reverse().map((entry, i) => (
                        <div key={i} className={
                          entry.level === 'error' ? 'text-red-700'
                          : entry.level === 'warn' ? 'text-amber-700'
                          : 'text-gray-700'
                        }>
                          <span className="text-gray-400">{entry.ts.slice(11, 19)}</span>{' '}
                          [{entry.level}] {entry.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-1.5 pt-1 border-t">
                <Button
                  size="sm" variant="outline" className="h-7 text-xs"
                  disabled={c.status !== 'ready' || analyzing === c.id}
                  onClick={() => runAnalysis(c.id)}
                >
                  {analyzing === c.id
                    ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    : <FlaskConical className="h-3 w-3 mr-1" />}
                  Analisar padrões
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700"
                  disabled={deleting === c.id}
                  onClick={() => deleteCohort(c.id)}
                >
                  {deleting === c.id
                    ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    : <Trash2 className="h-3 w-3 mr-1" />}
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SyntheticCohortsManager;