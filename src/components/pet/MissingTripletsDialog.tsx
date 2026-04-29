import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle2, ExternalLink, FlaskConical, Lock, Sparkles } from 'lucide-react';
import { useKgMissingTriplets } from '@/hooks/useKgMissingTriplets';
import { useTriggerGapFill, usePendingGapFillTriplets } from '@/hooks/useKgEvidenceGapFill';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
  recommendedCompounds: string[];
}

const MissingTripletsDialog: React.FC<Props> = ({ open, onOpenChange, petId, petName, recommendedCompounds }) => {
  const { t } = useTranslation();
  const query = useKgMissingTriplets(petId, recommendedCompounds, open);
  const data = query.data;
  const trigger = useTriggerGapFill();
  const { refetch: refetchPending } = usePendingGapFillTriplets();
  const [lastRun, setLastRun] = useState<null | { added: number; pending: number; pairs: number }>(null);

  const handleSearchAll = async () => {
    if (!data?.missing_pairs?.length) return;
    const pairs = data.missing_pairs.slice(0, 10).map((p: any) => ({
      compound_en: p.compound,
      condition_en: p.condition_display,
      condition_id: p.condition_id || undefined,
    }));
    try {
      const r = await trigger.mutateAsync({ pet_id: petId, pairs, max_pairs: 10 });
      setLastRun({ added: r.studies_added, pending: r.triplets_pending, pairs: r.pairs_searched });
      if (r.triplets_pending > 0) {
        toast.success(t('petProfile.missingTriplets.gapFillSuccess', {
          pending: r.triplets_pending,
          pairs: r.pairs_searched,
          defaultValue: '{{pending}} triplet(s) pendentes de curadoria gerados a partir de {{pairs}} pares.',
        }));
      } else {
        toast.warning(t('petProfile.missingTriplets.gapFillNoTriplets', {
          pairs: r.pairs_searched,
          defaultValue: 'Busca processou {{pairs}} pares mas não gerou triplets utilizáveis.',
        }));
      }
      refetchPending();
      query.refetch();
    } catch (e: any) {
      console.error('[MissingTripletsDialog] gap-fill error', e);
      toast.error(t('petProfile.missingTriplets.gapFillError', {
        error: e?.message || String(e),
        defaultValue: 'Erro: {{error}}',
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            {t('petProfile.missingTriplets.title', 'Triplets faltantes no Knowledge Graph')}
            <Badge variant="outline" className="ml-2 bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-700 text-[10px]">
              <Lock className="h-3 w-3 mr-1" />Admin
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {t('petProfile.missingTriplets.subtitle', {
              pet: petName,
              defaultValue: `Pares (condição × composto) sem evidência curada no KG para {{pet}}. Aprovar/extrair esses triplets é o que permitirá ao protocolo gerar ganho mensurável de anos de vida.`,
            })}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading', 'Carregando...')}
          </div>
        )}

        {query.isError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {t('common.error', 'Erro')}
            </p>
            <p className="text-muted-foreground mt-1">{(query.error as any)?.message || String(query.error)}</p>
          </div>
        )}

        {data && (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryStat
                label={t('petProfile.missingTriplets.statConditions', 'Condições do pet')}
                value={data.conditions_total}
              />
              <SummaryStat
                label={t('petProfile.missingTriplets.statCompounds', 'Compostos no stack')}
                value={data.compounds_total}
              />
              <SummaryStat
                label={t('petProfile.missingTriplets.statMissingPairs', 'Pares faltantes')}
                value={data.missing_pairs.length}
                tone="warning"
              />
              <SummaryStat
                label={t('petProfile.missingTriplets.statOrphans', 'Condições sem nenhum link')}
                value={data.conditions_without_any_curated_link}
                tone="danger"
              />
            </div>

            {/* Per condition list */}
            <ScrollArea className="flex-1 min-h-0 rounded-md border">
              <div className="p-4 space-y-3">
                {data.per_condition.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-8">
                    {t('petProfile.missingTriplets.empty', 'Nenhuma condição/predisposição encontrada para este pet.')}
                  </p>
                )}
                {data.per_condition.map((row, i) => {
                  const fullyCovered = row.missing_compounds.length === 0 && row.total_compounds > 0;
                  const orphan = !row.has_any_curated_link;
                  return (
                    <div
                      key={`${row.condition_id || row.condition_display}-${i}`}
                      className={`rounded-md border p-3 ${
                        orphan
                          ? 'border-destructive/40 bg-destructive/5'
                          : fullyCovered
                          ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                          : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{row.condition_display}</p>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {row.origin === 'active'
                                ? t('petProfile.missingTriplets.originActive', 'Diagnóstico ativo')
                                : t('petProfile.missingTriplets.originPredisp', 'Predisposição racial')}
                            </Badge>
                            {row.severity && (
                              <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                {row.severity}
                              </Badge>
                            )}
                            {row.risk_factor != null && (
                              <Badge variant="outline" className="text-[10px] h-5">
                                risco {row.risk_factor}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {fullyCovered
                              ? t('petProfile.missingTriplets.fullyCovered', 'Todos os compostos do stack já têm evidência KG válida (efficacy ≥ 3/5).')
                              : orphan
                              ? t('petProfile.missingTriplets.orphan', 'Esta condição NÃO tem nenhum triplet curado no KG. Nenhum composto do protocolo pode atuar sobre ela.')
                              : t('petProfile.missingTriplets.partial', '{{covered}}/{{total}} compostos têm evidência. Os demais precisam de novos triplets ou estudos para subir a eficácia.', {
                                  covered: row.covered_compounds,
                                  total: row.total_compounds,
                                })}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {fullyCovered ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : orphan ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <FlaskConical className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                      </div>

                      {row.missing_compounds.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                            {t('petProfile.missingTriplets.missingHere', 'Triplets faltantes para esta condição')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {row.missing_compounds.map((cmp) => {
                              const pair = data.missing_pairs.find(
                                (p) => p.compound === cmp && p.condition_display === row.condition_display,
                              );
                              return (
                                <Badge
                                  key={cmp}
                                  variant="outline"
                                  className={`text-[11px] gap-1.5 ${
                                    pair?.reason === 'weak_efficacy'
                                      ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                                      : 'border-destructive/40 bg-destructive/5 text-destructive'
                                  }`}
                                >
                                  <span>{cmp}</span>
                                  <span className="opacity-60">→</span>
                                  <span className="truncate max-w-[160px]">{row.condition_display}</span>
                                  {pair?.reason === 'weak_efficacy' && pair.best_efficacy_0_5 != null && (
                                    <span className="ml-1 opacity-70">({pair.best_efficacy_0_5}/5)</span>
                                  )}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <p className="text-[11px] text-muted-foreground italic">
                {t('petProfile.missingTriplets.legendReason', 'Vermelho = sem evidência alguma · Âmbar = evidência fraca (<3/5)')}
              </p>
              <div className="flex gap-2">
                {data.missing_pairs.length > 0 && (
                  <Button
                    onClick={handleSearchAll}
                    disabled={trigger.isPending}
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {trigger.isPending ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t('petProfile.missingTriplets.searching', 'Buscando...')}</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> {t('petProfile.missingTriplets.searchAllPerplexity', 'Buscar evidências via Perplexity')}</>
                    )}
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/administrador?tab=triplet-bank" target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    {t('petProfile.missingTriplets.openTripletBank', 'Abrir banco de triplets')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  {t('common.close', 'Fechar')}
                </Button>
              </div>
            </div>

            {lastRun && (
              <div className="rounded-md border border-violet-300/50 bg-violet-50/40 dark:bg-violet-950/20 p-3 text-xs">
                <p className="font-medium flex items-center gap-1.5 text-violet-800 dark:text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('petProfile.missingTriplets.gapFillResultTitle', 'Resultado da busca via Perplexity')}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {t('petProfile.missingTriplets.gapFillResultBody', {
                    pairs: lastRun.pairs, studies: lastRun.added, pending: lastRun.pending,
                    defaultValue: '{{pairs}} pares processados → {{studies}} estudos adicionados → {{pending}} triplets pendentes para curadoria.',
                  })}
                </p>
                <Link
                  to="/administrador?tab=triplet-curation"
                  target="_blank"
                  className="text-violet-700 dark:text-violet-300 underline mt-1 inline-block"
                >
                  {t('petProfile.missingTriplets.gapFillOpenCuration', 'Abrir curadoria de triplets')} →
                </Link>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SummaryStat: React.FC<{ label: string; value: number; tone?: 'default' | 'warning' | 'danger' }> = ({ label, value, tone = 'default' }) => {
  const toneCls =
    tone === 'danger'
      ? 'border-destructive/40 bg-destructive/5 text-destructive'
      : tone === 'warning'
      ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
      : 'border-border bg-muted/30';
  return (
    <div className={`rounded-md border p-3 ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{value}</p>
    </div>
  );
};

export default MissingTripletsDialog;