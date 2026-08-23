import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { isClinicalOutcomeShim } from '@/hooks/useStudyRichData.pure';

interface Props {
  estudo: any;
}

interface RichCounts {
  mechanisms: number;
  outcomes: number;
}

/**
 * Conta os campos extract-owned direto do banco (fonte: study_extractions,
 * fallback processed_studies). Usado para o antes/depois auditado.
 */
async function countRichFields(studyId: string): Promise<RichCounts> {
  const [{ data: ext }, { data: proc }] = await Promise.all([
    supabase
      .from('study_extractions')
      .select('extracted_data')
      .eq('study_id', studyId)
      .maybeSingle(),
    supabase
      .from('processed_studies')
      .select('analysis_data')
      .eq('id', studyId)
      .maybeSingle(),
  ]);

  const ed = (ext?.extracted_data || {}) as any;
  const ad = (proc?.analysis_data || {}) as any;

  const mechanisms = Array.isArray(ed.molecular_mechanisms) && ed.molecular_mechanisms.length > 0
    ? ed.molecular_mechanisms.length
    : Array.isArray(ad.molecularMechanisms) ? ad.molecularMechanisms.length : 0;

  const edOutcomes = Array.isArray(ed.clinical_outcomes) && !isClinicalOutcomeShim(ed.clinical_outcomes)
    ? ed.clinical_outcomes
    : null;
  const adOutcomes = Array.isArray(ad.clinicalOutcomes) && !isClinicalOutcomeShim(ad.clinicalOutcomes)
    ? ad.clinicalOutcomes
    : null;

  return {
    mechanisms,
    outcomes: (edOutcomes || adOutcomes || []).length,
  };
}

const ForceReextractPanel: React.FC<Props> = ({ estudo }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const studyId: string | undefined = estudo?.id;

  const { data: counts } = useQuery<RichCounts>({
    queryKey: ['study-rich-counts', studyId],
    enabled: !!studyId,
    queryFn: () => countRichFields(studyId as string),
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<any[]>({
    queryKey: ['study-reextract-audit', studyId],
    enabled: !!studyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_audit_logs')
        .select('id, performed_at, performed_by, metadata, notes')
        .eq('action_type', 'force_reextract')
        .contains('study_ids', [studyId])
        .order('performed_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
  });

  const runForceReextract = async () => {
    if (!studyId) return;
    setOpen(false);
    setRunning(true);
    const before = await countRichFields(studyId);
    try {
      const { error } = await supabase.functions.invoke('extract-study-entities', {
        body: { studyId, force_reextract: true },
      });
      if (error) throw error;

      const after = await countRichFields(studyId);
      const { data: auth } = await supabase.auth.getUser();

      await supabase.from('study_audit_logs').insert({
        action_type: 'force_reextract',
        study_ids: [studyId],
        study_titles: [estudo?.title || estudo?.file_name || null].filter(Boolean),
        performed_by: auth?.user?.id ?? null,
        metadata: { before, after, source: 'curator_ui' },
        notes: `mechanisms ${before.mechanisms} → ${after.mechanisms} · outcomes ${before.outcomes} → ${after.outcomes}`,
      });

      toast({
        title: t('studies.forceReextract.doneTitle', 'Re-extração concluída'),
        description: t(
          'studies.forceReextract.doneDescription',
          'Mecanismos {{mb}} → {{ma}} · desfechos {{ob}} → {{oa}}',
          { mb: before.mechanisms, ma: after.mechanisms, ob: before.outcomes, oa: after.outcomes },
        ),
      });

      queryClient.invalidateQueries({ queryKey: ['study-rich-counts', studyId] });
      queryClient.invalidateQueries({ queryKey: ['study-rich-data', studyId] });
      queryClient.invalidateQueries({ queryKey: ['study-triplets', studyId] });
      refetchHistory();
    } catch (e: any) {
      toast({
        title: t('studies.forceReextract.errorTitle', 'Falha na re-extração'),
        description: e?.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  if (!studyId) return null;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            {t('studies.forceReextract.title', 'Re-extração forçada')}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            {t(
              'studies.forceReextract.subtitle',
              'Substitui mecanismos e desfechos já gravados pelo resultado da nova rodada, mesmo que ela retorne menos itens. A guarda anti-sobrescrita fica desativada nesta execução.',
            )}
          </p>
          {counts && (
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {t('studies.forceReextract.mechanisms', 'Mecanismos')}: {counts.mechanisms}
              </Badge>
              <Badge variant="outline">
                {t('studies.forceReextract.outcomes', 'Desfechos')}: {counts.outcomes}
              </Badge>
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" disabled={running} onClick={() => setOpen(true)}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {running
            ? t('studies.forceReextract.running', 'Re-extraindo…')
            : t('studies.forceReextract.action', 'Re-extrair (forçado)')}
        </Button>
      </div>

      {history.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <History className="h-3.5 w-3.5" />
            {t('studies.forceReextract.historyTitle', 'Histórico de re-extrações')}
          </p>
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id} className="text-xs text-muted-foreground flex gap-2">
                <span className="tabular-nums">
                  {new Date(h.performed_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </span>
                <span>{h.notes}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studies.forceReextract.confirmTitle', 'Forçar re-extração deste estudo?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('studies.forceReextract.confirmDescription', {
                defaultValue:
                  'Estudo: {{title}}. Os mecanismos ({{mechanisms}}) e desfechos ({{outcomes}}) atuais serão substituídos pelo resultado da nova rodada, mesmo que venha com menos itens. O evento fica registrado na auditoria com as contagens antes e depois.',
                title: estudo?.title || estudo?.file_name || studyId,
                mechanisms: counts?.mechanisms ?? 0,
                outcomes: counts?.outcomes ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction onClick={runForceReextract}>
              {t('studies.forceReextract.confirmAction', 'Re-extrair agora')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForceReextractPanel;
