import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Wand2, Database, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useRoleView } from '@/contexts/RoleViewContext';
import CohortProgressLog, { ProgressLogEntry } from './CohortProgressLog';
import { Progress } from '@/components/ui/progress';
import CohortOriginalityBadge, { OriginalityBreakdown } from './CohortOriginalityBadge';

export interface SuggestedCohort {
  title: string;
  rationale: string;
  suggested_criteria: {
    breeds?: string;
    age_range?: string;
    weight_range?: string;
    conditions?: string;
    current_meds?: string;
    exclusion?: string;
    target_n?: string;
  };
  discoverable: string;
  kind: 'prevention' | 'treatment_validation' | 'exploratory';
  impact_score: number;
  viability_score: number;
}

interface Props {
  onUseSuggestion: (s: SuggestedCohort) => void;
}

interface ActiveJob {
  cohort_id: string;
  status: 'generating' | 'ready' | 'failed';
  generated_n: number;
  target_n: number;
  progress_log: ProgressLogEntry[];
  generation_error: string | null;
  last_heartbeat_at: string | null;
  created_at: string | null;
}

const KIND_LABEL: Record<SuggestedCohort['kind'], string> = {
  prevention: 'Prevenção',
  treatment_validation: 'Validação de tratamento',
  exploratory: 'Exploratório',
};

const KIND_COLOR: Record<SuggestedCohort['kind'], string> = {
  prevention: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  treatment_validation: 'bg-blue-50 text-blue-700 border-blue-200',
  exploratory: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

const CohortAISuggester: React.FC<Props> = ({ onUseSuggestion }) => {
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState<SuggestedCohort[]>([]);
  const [suggestionIds, setSuggestionIds] = useState<(string | null)[]>([]);
  // originalidade por índice de sugestão
  const [originality, setOriginality] = useState<Record<number, { score: number | null; status: string | null; breakdown: OriginalityBreakdown | null }>>({});
  const [generating, setGenerating] = useState<number | null>(null);
  // idx -> ActiveJob (mantém histórico até o usuário descartar)
  const [jobs, setJobs] = useState<Record<number, ActiveJob>>({});
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const { viewId } = useRoleView();
  // Tag de modelo é dado interno — só Arquiteto da Plataforma vê.
  const showModelTag = viewId === 'platform_architect';

  const anyGenerating = Object.values(jobs).some((j) => j.status === 'generating');

  // Carrega sugestões persistidas ao montar (até as 10 mais recentes ativas).
  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('cohort_suggestions')
        .select('id, title, rationale, suggested_criteria, discoverable, kind, impact_score, viability_score, status, used_cohort_id, originality_score, originality_status, originality_breakdown')
        .in('status', ['active', 'used'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        console.warn('Falha ao carregar sugestões persistidas', error);
        return;
      }
      if (data && data.length) {
        setCohorts(data.map((r: any) => ({
          title: r.title,
          rationale: r.rationale ?? '',
          suggested_criteria: r.suggested_criteria ?? {},
          discoverable: r.discoverable ?? '',
          kind: r.kind,
          impact_score: Number(r.impact_score ?? 0),
          viability_score: Number(r.viability_score ?? 0),
        })));
        setSuggestionIds(data.map((r: any) => r.id));
        const orig: Record<number, { score: number | null; status: string | null; breakdown: OriginalityBreakdown | null }> = {};
        data.forEach((r: any, i: number) => {
          orig[i] = {
            score: r.originality_score != null ? Number(r.originality_score) : null,
            status: r.originality_status ?? null,
            breakdown: r.originality_breakdown ?? null,
          };
        });
        setOriginality(orig);
        // Re-hidrata jobs em andamento (ou recém-concluídos) a partir do banco,
        // para que ao voltar de outra aba o card de progresso reapareça.
        const usedCohortIds = data
          .map((r: any) => r.used_cohort_id)
          .filter((x: string | null) => !!x);
        if (usedCohortIds.length) {
          const { data: cohortRows } = await supabase
            .from('synthetic_cohorts')
            .select('id, status, generated_n, target_n, progress_log, generation_error, last_heartbeat_at, created_at')
            .in('id', usedCohortIds);
          if (cohortRows && cohortRows.length) {
            const rebuilt: Record<number, ActiveJob> = {};
            data.forEach((r: any, idx: number) => {
              if (!r.used_cohort_id) return;
              const row = cohortRows.find((c: any) => c.id === r.used_cohort_id);
              if (!row) return;
              // só rehidrata se ainda gerando, falhou, ou concluiu recentemente
              rebuilt[idx] = {
                cohort_id: row.id,
                status: row.status as ActiveJob['status'],
                generated_n: Number(row.generated_n ?? 0),
                target_n: Number(row.target_n ?? 0),
                progress_log: Array.isArray(row.progress_log)
                  ? (row.progress_log as unknown as ProgressLogEntry[])
                  : [],
                generation_error: row.generation_error ?? null,
                last_heartbeat_at: row.last_heartbeat_at ?? null,
                created_at: row.created_at ?? null,
              };
            });
            if (Object.keys(rebuilt).length) setJobs(rebuilt);
          }
        }
      }
    })();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Sinais simples (placeholder enquanto não temos Meta-KG conectado aqui).
      // O edge function aceita qualquer JSON; o LLM lê e infere.
      const signals = {
        platform_focus: 'metabolic and degenerative diseases in canines',
        kg_gaps_hint: 'breed × condition pairs with <3 high-confidence triplets',
        known_underrepresented_breeds: ['Shih Tzu', 'Maltese', 'SRD (mixed)'],
        chronic_focus: ['osteoarthritis', 'chronic kidney disease', 'cognitive dysfunction', 'hepatic dysfunction'],
        petlove_strengths: 'longitudinal records, exam history, breed-stratified consultations',
      };
      const { data, error } = await supabase.functions.invoke('suggest-cohort-ideas', {
        body: { signals },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const newCohorts: SuggestedCohort[] = data?.cohorts ?? [];
      setCohorts(newCohorts);
      setSuggestionIds(new Array(newCohorts.length).fill(null));
      setOriginality({});
      // Re-fetch IDs from DB (suggestions were just persisted by the edge function)
      if (newCohorts.length) {
        const { data: persisted } = await (supabase as any)
          .from('cohort_suggestions')
          .select('id, title, originality_score, originality_status, originality_breakdown')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(newCohorts.length);
        if (persisted) {
          // map by title (best-effort)
          setSuggestionIds(newCohorts.map((c) => persisted.find((p: any) => p.title === c.title)?.id ?? null));
          const orig: Record<number, { score: number | null; status: string | null; breakdown: OriginalityBreakdown | null }> = {};
          newCohorts.forEach((c, i) => {
            const row = persisted.find((p: any) => p.title === c.title);
            orig[i] = {
              score: row?.originality_score != null ? Number(row.originality_score) : null,
              status: row?.originality_status ?? null,
              breakdown: row?.originality_breakdown ?? null,
            };
          });
          setOriginality(orig);
        }
      }
      if (!newCohorts.length) {
        toast({ title: 'IA retornou vazio', description: 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao gerar sugestões',
        description: e?.message ?? 'Desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling: a cada 3s, atualiza qualquer job em "generating".
  useEffect(() => {
    const activeIds = Object.values(jobs).filter((j) => j.status === 'generating').map((j) => j.cohort_id);
    if (activeIds.length === 0) return;
    const t = setInterval(async () => {
      const { data, error } = await supabase
        .from('synthetic_cohorts')
        .select('id, status, generated_n, target_n, progress_log, generation_error, last_heartbeat_at, created_at')
        .in('id', activeIds);
      if (error || !data) return;
      setJobs((prev) => {
        const next = { ...prev };
        for (const [k, j] of Object.entries(next)) {
          const row = data.find((r: any) => r.id === j.cohort_id);
          if (row) {
            next[Number(k)] = {
              ...j,
              status: row.status as ActiveJob['status'],
              generated_n: Number(row.generated_n ?? 0),
              target_n: Number(row.target_n ?? j.target_n),
              progress_log: Array.isArray(row.progress_log) ? (row.progress_log as unknown as ProgressLogEntry[]) : [],
              generation_error: row.generation_error ?? null,
              last_heartbeat_at: row.last_heartbeat_at ?? null,
              created_at: row.created_at ?? j.created_at,
            };
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [jobs]);

  // Polling de originalidade: enquanto houver sugestões com score=null e id válido, recarrega a cada 4s.
  useEffect(() => {
    const pendingIdx = Object.entries(originality)
      .filter(([i, o]) => o.score == null && o.status !== 'error' && suggestionIds[Number(i)])
      .map(([i]) => Number(i));
    if (!pendingIdx.length) return;
    const ids = pendingIdx.map((i) => suggestionIds[i]).filter(Boolean) as string[];
    const t = setInterval(async () => {
      const { data } = await (supabase as any)
        .from('cohort_suggestions')
        .select('id, originality_score, originality_status, originality_breakdown')
        .in('id', ids);
      if (!data) return;
      setOriginality((prev) => {
        const next = { ...prev };
        pendingIdx.forEach((i) => {
          const row = data.find((r: any) => r.id === suggestionIds[i]);
          if (row && (row.originality_score != null || row.originality_status)) {
            next[i] = {
              score: row.originality_score != null ? Number(row.originality_score) : null,
              status: row.originality_status ?? null,
              breakdown: row.originality_breakdown ?? null,
            };
          }
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [originality, suggestionIds]);

  const forceFinalize = async (cohortId: string) => {
    if (!window.confirm('Marcar este cohort como finalizado manualmente? Os pets já gerados serão mantidos.')) return;
    setFinalizing(cohortId);
    try {
      const { data, error } = await supabase.functions.invoke('finalize-stalled-cohort', {
        body: { cohort_id: cohortId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setJobs((prev) => {
        const next = { ...prev };
        Object.entries(next).forEach(([idx, job]) => {
          if (job.cohort_id !== cohortId) return;
          next[Number(idx)] = {
            ...job,
            status: data?.status === 'failed' ? 'failed' : 'ready',
            generated_n: Number(data?.generated ?? job.generated_n),
            generation_error:
              data?.status === 'failed'
                ? `Travado · finalizado manualmente (${data?.generated ?? job.generated_n}/${job.target_n} pets)`
                : job.generation_error,
            last_heartbeat_at: new Date().toISOString(),
          };
        });
        return next;
      });
      toast({ title: 'Cohort finalizado', description: `Marcado como ${data?.status}.` });
    } catch (e: any) {
      toast({ title: 'Falha ao finalizar', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setFinalizing(null);
    }
  };

  const dismissSuggestion = async (idx: number) => {
    const id = suggestionIds[idx];
    if (id) {
      await (supabase as any).from('cohort_suggestions').update({ status: 'dismissed' }).eq('id', id);
    }
    setCohorts((prev) => prev.filter((_, i) => i !== idx));
    setSuggestionIds((prev) => prev.filter((_, i) => i !== idx));
    setJobs((prev) => {
      const next: Record<number, ActiveJob> = {};
      Object.entries(prev).forEach(([k, j]) => {
        const n = Number(k);
        if (n < idx) next[n] = j;
        else if (n > idx) next[n - 1] = j;
      });
      return next;
    });
  };

  const generateRealCohort = async (s: SuggestedCohort, idx: number) => {
    const targetN = Number(s.suggested_criteria.target_n) || 200;
    const safeN = Math.min(targetN, 200);
    if (!window.confirm(
      `Gerar cohort sintético "${s.title}" com ${safeN} pets?\n\n` +
      `Tempo estimado: ${Math.ceil(safeN / 25)} batches (~${Math.ceil(safeN / 60)} min).\n` +
      `Os pets serão marcados como is_synthetic=true e não contaminam dados reais.`,
    )) return;
    setGenerating(idx);
    try {
      const { data, error } = await supabase.functions.invoke('generate-synthetic-cohort', {
        body: {
          name: s.title,
          kind: s.kind,
          rationale: s.rationale,
          target_n: safeN,
          criteria: s.suggested_criteria,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Mark suggestion as used and link to the generated cohort
      const sid = suggestionIds[idx];
      if (sid && data?.cohort_id) {
        await (supabase as any).from('cohort_suggestions')
          .update({ status: 'used', used_cohort_id: data.cohort_id })
          .eq('id', sid);
      }
      if (data?.cohort_id) {
        setJobs((prev) => ({
          ...prev,
          [idx]: {
            cohort_id: data.cohort_id,
            status: 'generating',
            generated_n: 0,
            target_n: Number(data.target_n ?? safeN),
            progress_log: [],
            generation_error: null,
            last_heartbeat_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        }));
      }
      toast({
        title: 'Geração iniciada',
        description: `Cohort criado (${data?.cohort_id?.slice(0, 8)}…). Acompanhe o log abaixo.`,
      });
    } catch (e: any) {
      toast({ title: 'Falha ao gerar', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Sugestões ativas (IA)
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              A Senex AI lê sinais da plataforma (gaps do Meta-KG, conflitos, condições sub-representadas)
              e propõe 5 cohorts que o parceiro clínico poderia compartilhar.
              {showModelTag && (
                <>
                  {' '}Modelo: <code className="text-[10px] bg-white px-1 rounded">google/gemini-3.5-flash</code>.
                </>
              )}
            </p>
          </div>
          <Button size="sm" onClick={fetchSuggestions} disabled={loading || anyGenerating}>
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
            {loading ? 'Gerando…' : anyGenerating ? 'Em espera' : (cohorts.length ? 'Gerar novamente' : 'Gerar 5 sugestões')}
          </Button>
        </div>

        {cohorts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {cohorts.map((c, i) => {
              const score = Math.round((c.impact_score + c.viability_score) / 2);
              const job = jobs[i];
              const isThisGenerating = job?.status === 'generating';
              const isThisReady = job?.status === 'ready';
              const isThisFailed = job?.status === 'failed';
              const isOtherGenerating = anyGenerating && !isThisGenerating;
              const progressPct = job ? Math.round((job.generated_n / Math.max(1, job.target_n)) * 100) : 0;
               const latestLogTs = job?.progress_log?.length
                 ? job.progress_log[job.progress_log.length - 1]?.ts
                 : null;
               const lastActivityAt = job?.last_heartbeat_at ?? latestLogTs ?? job?.created_at ?? null;
               const stalledMs = lastActivityAt
                 ? Date.now() - new Date(lastActivityAt).getTime()
                 : 0;
              const isStalled = isThisGenerating && stalledMs > 180_000;
              // Detecta batch atual a partir do último log "solicitando ... ao modelo"
              const lastBatchLog = job?.progress_log?.slice().reverse().find((e) => /Batch \d+\/\d+/.test(e.message));
              const batchLabel = lastBatchLog?.message?.match(/Batch (\d+)\/(\d+)/);
              return (
                <Card key={i} className="bg-white">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-tight">{c.title}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {score}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${KIND_COLOR[c.kind]}`}>
                      {KIND_LABEL[c.kind]}
                    </Badge>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CohortOriginalityBadge
                        suggestionId={suggestionIds[i] ?? null}
                        title={c.title}
                        rationale={c.rationale}
                        criteria={c.suggested_criteria}
                        score={originality[i]?.score ?? null}
                        status={originality[i]?.status ?? null}
                        breakdown={originality[i]?.breakdown ?? null}
                        onUpdated={(score, status, breakdown) =>
                          setOriginality((prev) => ({ ...prev, [i]: { score, status, breakdown } }))
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-700 leading-snug">{c.rationale}</p>
                    <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 space-y-0.5">
                      <div><b>Critérios:</b> {c.suggested_criteria.breeds || '—'} · {c.suggested_criteria.age_range || '—'} · {c.suggested_criteria.conditions || '—'} · N≈{c.suggested_criteria.target_n}</div>
                    </div>
                    <p className="text-[11px] italic text-emerald-700">
                      <b>Descobrível:</b> {c.discoverable}
                    </p>
                    {job && (
                      <div className="space-y-1.5 border-t pt-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-gray-700">
                            {isThisGenerating && <Loader2 className="h-3 w-3 mr-1 inline animate-spin text-blue-600" />}
                            {isThisReady && <CheckCircle2 className="h-3 w-3 mr-1 inline text-emerald-600" />}
                            {isThisFailed && <AlertTriangle className="h-3 w-3 mr-1 inline text-red-600" />}
                            {isThisGenerating ? 'Gerando…' : isThisReady ? 'Concluído' : 'Falhou'}
                          </span>
                          <span className="font-mono text-gray-600">{job.generated_n}/{job.target_n} pets</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                        {isStalled && (
                          <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded p-1.5">
                            <span className="text-[10px] text-amber-800">
                              ⚠ Sem progresso há &gt;3min — pode estar travado.
                            </span>
                            <Button
                              size="sm" variant="outline" className="h-6 text-[10px]"
                              disabled={finalizing === job.cohort_id}
                              onClick={() => forceFinalize(job.cohort_id)}
                            >
                              {finalizing === job.cohort_id
                                ? <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                                : null}
                              Forçar finalização
                            </Button>
                          </div>
                        )}
                        {isThisReady && (
                          <p className="text-[10px] text-emerald-700">
                            Disponível em "Cohorts sintéticos" para análise de padrões.
                          </p>
                        )}
                        {isThisFailed && job.generation_error && (
                          <p className="text-[10px] text-red-700 bg-red-50 p-1 rounded">⚠ {job.generation_error}</p>
                        )}
                        <CohortProgressLog entries={job.progress_log} defaultOpen={isThisGenerating} />
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <div className="text-[10px] text-gray-500">
                        Impacto {c.impact_score} · Viabilidade {c.viability_score}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => dismissSuggestion(i)}
                          disabled={isThisGenerating}
                          title="Descartar sugestão">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onUseSuggestion(c)}>
                          Pré-preencher
                        </Button>
                        <Button
                          size="sm" className="h-7 text-xs"
                          disabled={generating !== null || isOtherGenerating || isThisGenerating || isThisReady}
                          onClick={() => generateRealCohort(c, i)}
                          title={isOtherGenerating ? 'Aguardando o cohort atual terminar' : undefined}
                        >
                          {(generating === i || isThisGenerating)
                            ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            : <Database className="h-3 w-3 mr-1" />}
                          {isThisGenerating
                            ? (batchLabel ? `Gerando batch ${batchLabel[1]}/${batchLabel[2]}` : 'Gerando…')
                            : isThisReady ? 'Gerado'
                            : isOtherGenerating ? 'Em espera'
                            : 'Gerar cohort'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CohortAISuggester;