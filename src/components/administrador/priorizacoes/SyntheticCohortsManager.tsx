import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Trash2, RefreshCw, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useRoleView } from '@/contexts/RoleViewContext';
import CohortProgressLog, { ProgressLogEntry } from './CohortProgressLog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import CohortPatientsDialog from './CohortPatientsDialog';
import CohortStatsPanel from './CohortStatsPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot } from 'lucide-react';

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
  progress_log?: ProgressLogEntry[] | null;
  analysis_log?: ProgressLogEntry[] | null;
  last_analyzed_at?: string | null;
  last_analysis_insights_count?: number | null;
  last_analysis_model?: string | null;
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
  const { t } = useTranslation();
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showGenerating, setShowGenerating] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const { viewId } = useRoleView();
  const showModelTag = viewId === 'platform_architect';
  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.id === selectedCohortId) ?? null,
    [cohorts, selectedCohortId],
  );

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
    const cohort = cohorts.find((c) => c.id === cohortId);
    let force = false;
    if (cohort?.last_analyzed_at) {
      const ok = window.confirm(
        `Este cohort já foi analisado em ${new Date(cohort.last_analyzed_at).toLocaleString()} ` +
          `(${cohort.last_analysis_insights_count ?? 0} insights). Re-analisar usa o LLM novamente e pode gerar insights duplicados. Continuar?`,
      );
      if (!ok) return;
      force = true;
    }
    setAnalyzing(cohortId);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cohort-patterns', {
        body: { cohort_id: cohortId, force },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'Insights gerados',
        description: `${data?.generated ?? 0} insights adicionados ao Population Insights.`,
      });
      fetchCohorts();
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
            <b>Cohorts sintéticos reais.</b> Pets gerados por IA com flag <code>is_synthetic=true</code> — não contaminam dados reais.
            Cohorts aparecem aqui após o término da geração. Acompanhe o progresso ao vivo no <b>Gerador de Sugestão de Cohort</b>.
            {showModelTag && <> Modelo: <code className="text-[10px] bg-white px-1 rounded">google/gemini-3.5-flash</code>.</>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-sm font-semibold">
          Cohorts ({cohorts.filter((c) => showGenerating || c.status !== 'generating').length}
          {cohorts.filter((c) => c.status === 'generating').length > 0 && !showGenerating && (
            <span className="text-gray-500 font-normal">
              {' '}· {cohorts.filter((c) => c.status === 'generating').length} em geração
            </span>
          )})
        </h3>
        <div className="flex items-center gap-3">
          {cohorts.some((c) => c.status === 'generating') && (
            <div className="flex items-center gap-1.5">
              <Switch id="show-generating" checked={showGenerating} onCheckedChange={setShowGenerating} />
              <Label htmlFor="show-generating" className="text-xs text-gray-600 cursor-pointer">
                Mostrar em geração
              </Label>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={fetchCohorts} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {cohorts.filter((c) => showGenerating || c.status !== 'generating').length === 0 && !loading && (
        <Card><CardContent className="p-6 text-center text-sm text-gray-500">
          Nenhum cohort sintético finalizado ainda. Vá em <b>Gerador de Sugestão de Cohort</b> → gere sugestões com IA → clique em "Gerar cohort".
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cohorts.filter((c) => showGenerating || c.status !== 'generating').map((c) => (
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
              {c.progress_log && c.progress_log.length > 0 && (
                <CohortProgressLog entries={c.progress_log as ProgressLogEntry[]} />
              )}
              {c.analysis_log && c.analysis_log.length > 0 && (
                <div className="space-y-1">
                  <CohortProgressLog entries={c.analysis_log as ProgressLogEntry[]} />
                  {c.last_analyzed_at && (
                    <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
                      <span>
                        ✓ Última análise: {new Date(c.last_analyzed_at).toLocaleString()} ·{' '}
                        {c.last_analysis_insights_count ?? 0} insights
                      </span>
                      {c.last_analysis_model && (
                        <Badge variant="outline" className="text-[10px] font-mono flex items-center gap-1">
                          <Bot className="h-2.5 w-2.5" /> {c.last_analysis_model}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
              <CohortStatsPanel cohortId={c.id} cohortReady={c.status === 'ready' && c.generated_n > 0} />
              <div className="flex gap-1.5 pt-1 border-t">
                <Button
                  size="sm" variant="outline" className="h-7 text-xs"
                  disabled={c.generated_n === 0}
                  onClick={() => setSelectedCohortId(c.id)}
                >
                  {t('prioritization.syntheticExplorer.openPatients')}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        disabled={c.status !== 'ready' || analyzing === c.id}
                        onClick={() => runAnalysis(c.id)}
                      >
                        {analyzing === c.id
                          ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          : <FlaskConical className="h-3 w-3 mr-1" />}
                        {c.last_analyzed_at
                          ? `Re-analisar (${c.last_analysis_insights_count ?? 0})`
                          : 'Analisar padrões'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {c.last_analyzed_at
                        ? `Já analisado. Re-rodar usa ${c.last_analysis_model || 'google/gemini-3.5-flash'} e pode gerar insights novos/duplicados.`
                        : `Usa ${'google/gemini-3.5-flash'} para extrair padrões clínicos. O log de execução aparecerá no card.`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

      <CohortPatientsDialog
        cohortId={selectedCohort?.id ?? null}
        cohortName={selectedCohort?.name ?? null}
        open={!!selectedCohortId}
        onOpenChange={(open) => {
          if (!open) setSelectedCohortId(null);
        }}
      />
    </div>
  );
};

export default SyntheticCohortsManager;