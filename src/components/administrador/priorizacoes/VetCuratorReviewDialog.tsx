import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type VetReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';

interface InsightLite {
  id: string;
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
}

const STATUS_META: Record<VetReviewStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending:       { label: 'Pendente',         color: 'bg-gray-100 text-gray-700 border-gray-300',           icon: AlertCircle },
  approved:      { label: 'Aprovado',         color: 'bg-emerald-100 text-emerald-800 border-emerald-300',  icon: CheckCircle2 },
  rejected:      { label: 'Rejeitado',        color: 'bg-red-100 text-red-800 border-red-300',              icon: XCircle },
  needs_changes: { label: 'Requer ajustes',   color: 'bg-amber-100 text-amber-800 border-amber-300',        icon: AlertCircle },
};

const VetCuratorReviewDialog: React.FC<Props> = ({ insight, open, onOpenChange, onReviewed }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<VetReviewStatus | null>(null);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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