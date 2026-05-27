import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, CheckCircle2, XCircle, AlertCircle, Loader2, FlaskConical, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useInsightEvidence } from '@/hooks/useInsightEvidence';

export type VetReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';

interface InsightLite {
  id: string;
  cohort_id?: string | null;
  title: string;
  title_en?: string | null;
  summary: string;
  summary_en?: string | null;
  confidence: number;
  signals?: string[] | null;
  evidence?: any;
  source_model?: string | null;
  vet_review_status?: VetReviewStatus | null;
  vet_review_notes?: string | null;
  vet_reviewed_at?: string | null;
  stage?: string;
}

interface Props {
  insight: InsightLite | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReviewed?: () => void;
  onOpenDrillDown?: (insight: InsightLite) => void;
}

const STATUS_META: Record<VetReviewStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending:       { label: 'Pendente',         color: 'bg-gray-100 text-gray-700 border-gray-300',           icon: AlertCircle },
  approved:      { label: 'Aprovado',         color: 'bg-emerald-100 text-emerald-800 border-emerald-300',  icon: CheckCircle2 },
  rejected:      { label: 'Rejeitado',        color: 'bg-red-100 text-red-800 border-red-300',              icon: XCircle },
  needs_changes: { label: 'Requer ajustes',   color: 'bg-amber-100 text-amber-800 border-amber-300',        icon: AlertCircle },
};

const VetCuratorReviewDialog: React.FC<Props> = ({ insight, open, onOpenChange, onReviewed, onOpenDrillDown }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<VetReviewStatus | null>(null);

  const evidence = useInsightEvidence(
    insight ? { id: insight.id, cohort_id: insight.cohort_id ?? null, signals: insight.signals } : null,
    open,
  );

  useEffect(() => {
    if (open) setNotes(insight?.vet_review_notes ?? '');
  }, [open, insight?.id]);

  if (!insight) return null;

  const submit = async (status: VetReviewStatus) => {
    setSubmitting(status);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const patch: Record<string, any> = {
        vet_review_status: status,
        vet_review_notes: notes || null,
        vet_reviewed_at: new Date().toISOString(),
        vet_reviewed_by: userRes?.user?.id ?? null,
      };
      // approved insights auto-move to the "approved" stage of the kanban
      if (status === 'approved') patch.stage = 'approved';
      const { error } = await supabase.from('cohort_insights').update(patch).eq('id', insight.id);
      if (error) throw error;
      toast({ title: 'Revisão registrada', description: STATUS_META[status].label });
      onReviewed?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Falha ao salvar revisão', description: e?.message ?? 'Erro', variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const current = (insight.vet_review_status ?? 'pending') as VetReviewStatus;
  const Meta = STATUS_META[current];

  const rawEvidence = insight.evidence && typeof insight.evidence === 'object' ? insight.evidence : null;
  const rawEvidenceEmpty = !rawEvidence || Object.keys(rawEvidence).length === 0;
  const matchPct = Math.round(evidence.matchRatio * 100);
  const weakSupport = evidence.matchingPets.length > 0 && (evidence.matchingPets.length < 10 || evidence.matchRatio < 0.2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-indigo-600" />
            Validação do vet-curador
          </DialogTitle>
          <DialogDescription className="text-xs">
            O insight só vira regra clínica/meta-estudo depois desta revisão. Aprovado move automaticamente para a coluna <b>Aprovados</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-gray-50 p-3 space-y-1.5">
            <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
            <p className="text-xs text-gray-700 leading-snug">{insight.summary}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="outline" className="text-[10px] font-mono">
                confiança {Math.round((insight.confidence ?? 0) * 100)}%
              </Badge>
              {insight.source_model && (
                <Badge variant="outline" className="text-[10px] font-mono bg-white">{insight.source_model}</Badge>
              )}
              {(insight.signals ?? []).map((s, i) => (
                <Badge key={i} variant="outline" className="text-[10px] bg-white">{s}</Badge>
              ))}
            </div>
          </div>

          {/* ─── Painel de evidência ───────────────────────────────────── */}
          <div className="rounded-md border border-indigo-200 bg-indigo-50/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" /> Evidência disponível
              </h5>
              {onOpenDrillDown && (
                <button
                  type="button"
                  onClick={() => onOpenDrillDown(insight)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                >
                  Drill-down completo <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {evidence.loading ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-600 py-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Computando evidência a partir da cohort…
              </div>
            ) : (
              <>
                {/* 1. Suporte populacional */}
                <div>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="font-medium text-gray-800">Suporte populacional</span>
                    <span className="font-mono text-gray-700">
                      {evidence.matchingPets.length} / {evidence.totalPets} pets ({matchPct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${weakSupport ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, matchPct)}%` }}
                    />
                  </div>
                  {weakSupport && (
                    <p className="mt-1 text-[10px] text-amber-800">
                      ⚠ Amostra fraca para regra clínica (n &lt; 10 ou suporte &lt; 20%).
                    </p>
                  )}
                  {evidence.matchingPets.length === 0 && evidence.totalPets > 0 && (
                    <p className="mt-1 text-[10px] text-red-700">
                      Nenhum pet da cohort casa diretamente com os sinais — o insight pode ser inferência puramente do modelo.
                    </p>
                  )}
                </div>

                {/* 2. Estratificação */}
                {evidence.matchingPets.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-indigo-100">
                    <div>
                      <p className="text-[10px] font-medium text-gray-600 mb-1">Top raças</p>
                      <ul className="space-y-0.5">
                        {evidence.byBreed.map((b) => (
                          <li key={b.breed} className="text-[11px] flex justify-between">
                            <span className="truncate pr-2">{b.breed}</span>
                            <span className="font-mono text-gray-600">{b.n}</span>
                          </li>
                        ))}
                        {evidence.byBreed.length === 0 && <li className="text-[10px] text-gray-400 italic">—</li>}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] font-medium text-gray-600">Idade</p>
                        <p className="text-[11px] font-mono">
                          {evidence.ageStats.mean.toFixed(1)} ± {evidence.ageStats.sd.toFixed(1)} anos
                          <span className="text-gray-400"> (n={evidence.ageStats.count})</span>
                        </p>
                      </div>
                      {evidence.bySeverity.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-gray-600">Severidade das condições</p>
                          <p className="text-[11px] font-mono">
                            {evidence.bySeverity.map((s) => `${s.name}=${s.value}`).join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Top lab flags */}
                {evidence.topFlags.length > 0 && (
                  <div className="pt-1 border-t border-indigo-100">
                    <p className="text-[10px] font-medium text-gray-600 mb-1">Top alterações laboratoriais (nos pets que sustentam)</p>
                    <div className="flex flex-wrap gap-1">
                      {evidence.topFlags.map((f) => (
                        <Badge key={f.flag} variant="outline" className="text-[10px] bg-white font-mono">
                          {f.flag} · {f.n} ({Math.round(f.pct * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Provenance + raw evidence */}
                <div className="pt-1 border-t border-indigo-100 space-y-1">
                  <p className="text-[10px] text-gray-600">
                    <span className="font-medium">Origem:</span>{' '}
                    {evidence.cohortName ? <span className="font-mono">{evidence.cohortName}</span> : <span className="italic">cohort não vinculada</span>}
                    {insight.source_model && <> · gerado por <span className="font-mono">{insight.source_model}</span></>}
                  </p>
                  {rawEvidenceEmpty ? (
                    <div className="rounded border border-amber-200 bg-amber-50 p-1.5 text-[10px] text-amber-900">
                      ⚠ O modelo não forneceu evidência quantitativa estruturada (<code>evidence: {}</code>). Apenas os números derivados da cohort acima são auditáveis.
                    </div>
                  ) : (
                    <details className="text-[10px]">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-900">evidência bruta do modelo (JSON)</summary>
                      <pre className="mt-1 p-1.5 bg-white border rounded text-[10px] overflow-x-auto">
{JSON.stringify(rawEvidence, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Status atual:</span>
            <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${Meta.color}`}>
              <Meta.icon className="h-3 w-3" /> {Meta.label}
            </Badge>
            {insight.vet_reviewed_at && (
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(insight.vet_reviewed_at).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">
              Notas clínicas <span className="text-gray-400 font-normal">(visíveis no card e na auditoria)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: amostra pequena (9/60), padrão hematológico consistente com hemangiossarcoma esplênico mas insuficiente p/ regra clínica — pedir 2 cohorts adicionais ≥30 pets."
              rows={4}
              className="mt-1 text-xs"
            />
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
            <b>Lembrete:</b> aprovação significa que o insight pode ser usado para gerar meta-estudo proposto ou regra clínica. Use <i>Requer ajustes</i> quando precisar de mais dados / refinamento antes de decidir.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-800 border-amber-300 hover:bg-amber-50"
              disabled={!!submitting}
              onClick={() => submit('needs_changes')}
            >
              {submitting === 'needs_changes' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5 mr-1" />}
              Requer ajustes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-300 hover:bg-red-50"
              disabled={!!submitting}
              onClick={() => submit('rejected')}
            >
              {submitting === 'rejected' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
              Rejeitar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!!submitting}
              onClick={() => submit('approved')}
            >
              {submitting === 'approved' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Aprovar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VetCuratorReviewDialog;