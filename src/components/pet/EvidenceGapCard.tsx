import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2, Info, Database, Globe, Microscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTriggerGapFill, usePendingGapFillTriplets } from '@/hooks/useKgEvidenceGapFill';
import { toast } from 'sonner';

interface EvidenceGapCardProps {
  petId: string;
  yearsGained: number;
  hasCoverage: boolean; // true if at least one condition is KG-covered
  /** Called when the gap-fill returns at least one new pending triplet, so the
   *  parent (DigitalTwinDog) can auto-enable the "preview pending" toggle and
   *  invalidate the trajectory query. */
  onTripletsAdded?: (count: number) => void;
}

const EvidenceGapCard: React.FC<EvidenceGapCardProps> = ({ petId, yearsGained, hasCoverage, onTripletsAdded }) => {
  const { t } = useTranslation();
  const { userRoles } = useAuth();
  const isAdmin = (userRoles || []).includes('admin');
  const { data: pendingCount, refetch } = usePendingGapFillTriplets();
  const trigger = useTriggerGapFill();
  const [lastResult, setLastResult] = useState<null | {
    pairs_searched: number;
    studies_added: number;
    triplets_pending: number;
    discovery_notes?: string[];
    details?: any[];
    message?: string;
  }>(null);

  // Compute source breakdown from details
  const sourceBreakdown = lastResult?.details
    ? (() => {
        const byProvider: Record<string, { total: number; ok: number; noEvidence: number; failed: number }> = {};
        for (const d of lastResult.details) {
          const prov = d.provider || 'unknown';
          if (!byProvider[prov]) byProvider[prov] = { total: 0, ok: 0, noEvidence: 0, failed: 0 };
          byProvider[prov].total++;
          if (d.status === 'ok' || d.status === 'dry_run') byProvider[prov].ok++;
          else if (d.status === 'no_evidence' || d.status === 'no_records' || d.status === 'no_pubmed_results') byProvider[prov].noEvidence++;
          else byProvider[prov].failed++;
        }
        return byProvider;
      })()
    : null;

  // Only show for admin AND only when twin shows a low gain
  if (!isAdmin) return null;
  if (yearsGained >= 0.3) return null;

  const handleSearch = async () => {
    setLastResult(null);
    try {
      const result = await trigger.mutateAsync({ pet_id: petId, max_pairs: 10 });
      setLastResult(result as any);
      const msg = t('evidenceGap.toastSuccess', {
        studies: result.studies_added,
        triplets: result.triplets_pending,
        pairs: result.pairs_searched,
      });
      if ((result.pairs_searched || 0) === 0) {
        toast.warning(t('evidenceGap.toastNoPairs'));
      } else if ((result.triplets_pending || 0) === 0) {
        toast.info(t('evidenceGap.toastNoTriplets', { pairs: result.pairs_searched }));
      } else {
        toast.success(msg);
        // Notify parent so the digital twin can re-project including these
        // pending triplets and the patient subgraph can render them.
        onTripletsAdded?.(result.triplets_pending || 0);
      }
      refetch();
    } catch (e: any) {
      const msg = e?.message || (typeof e === 'string' ? e : 'unknown');
      console.error('[EvidenceGapCard] gap-fill error', e);
      const isFetchError = msg.includes('Failed to send a request') || msg.includes('Failed to fetch');
      const displayMsg = isFetchError
        ? t('evidenceGap.backendUnavailable', 'Função de busca indisponível no backend. Verifique se as Edge Functions estão publicadas.')
        : msg;
      setLastResult({
        pairs_searched: 0, studies_added: 0, triplets_pending: 0,
        message: displayMsg,
      });
      toast.error(t('evidenceGap.toastError', { error: displayMsg }));
    }
  };

  return (
    <Card className="border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {t('evidenceGap.title')}
          <Badge variant="outline" className="ml-2 text-[10px]">{t('evidenceGap.adminOnly')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-amber-300/60 bg-transparent">
          <AlertDescription className="text-sm leading-relaxed">
            {hasCoverage
              ? t('evidenceGap.explanationLowEfficacy')
              : t('evidenceGap.explanationNoCoverage')}
          </AlertDescription>
        </Alert>

        {lastResult && (
          <div className="rounded-md border bg-background p-3 text-xs space-y-2">
            <p className="font-medium flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              {t('evidenceGap.detailsTitle')}
            </p>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">{t('evidenceGap.pairsLabel')}:</span> <strong>{lastResult.pairs_searched}</strong></div>
              <div><span className="text-muted-foreground">{t('evidenceGap.studiesLabel')}:</span> <strong>{lastResult.studies_added}</strong></div>
              <div><span className="text-muted-foreground">{t('evidenceGap.pendingLabel')}:</span> <strong>{lastResult.triplets_pending}</strong></div>
            </div>

            {/* Source breakdown */}
            {sourceBreakdown && Object.keys(sourceBreakdown).length > 0 && (
              <div className="border-t pt-2 space-y-1">
                <p className="font-medium text-[11px] flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {t('evidenceGap.sourcesConsulted')}
                </p>
                {Object.entries(sourceBreakdown).map(([prov, stats]) => (
                  <div key={prov} className="flex items-center gap-2 text-[11px]">
                    {prov === 'perplexity' ? <Microscope className="h-3 w-3 text-blue-500" /> : <Database className="h-3 w-3 text-green-500" />}
                    <span className="font-medium capitalize">{prov}</span>
                    <span className="text-muted-foreground">
                      {stats.total} {t('evidenceGap.queriesLabel')} · 
                      <span className="text-emerald-600"> {stats.ok} ✓</span> · 
                      <span className="text-amber-600"> {stats.noEvidence} ∅</span>
                      {stats.failed > 0 && <span className="text-destructive"> · {stats.failed} ✗</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {lastResult.message && (
              <p className="text-[11px] text-muted-foreground italic">{lastResult.message}</p>
            )}
            {(lastResult.discovery_notes || []).map((n, i) => (
              <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400">⚠ {n}</p>
            ))}
            {(lastResult.details || []).slice(0, 6).map((d: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px] border-t pt-1">
                <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
                  {t(`evidenceGap.detailStatus.${d.status}`, { defaultValue: d.status })}
                </Badge>
                <span className="text-muted-foreground leading-snug">
                  {d.pair?.compound_en} → {d.pair?.condition_en}
                  {d.efficacy_0_5 != null && <> · ef {d.efficacy_0_5}/5</>}
                  {d.species_hint && d.species_hint !== 'canine' && <> · <em>{d.species_hint}</em></>}
                  {d.provider && <> · <span className="font-medium">{d.provider}</span></>}
                  {d.error && <> · <span className="text-destructive">{String(d.error).slice(0, 80)}</span></>}
                  {d.perplexity_tried === false && <> · <span className="text-amber-600">{t('evidenceGap.noPerplexityKey')}</span></>}
                </span>
              </div>
            ))}
          </div>
        )}

        {(pendingCount || 0) > 0 && (
          <div className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{t('evidenceGap.pendingStatus', { count: pendingCount })}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/administrador?tab=triplet-curation">
                {t('evidenceGap.openCuration')} <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSearch}
            disabled={trigger.isPending}
            className="w-full"
          >
            {trigger.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('evidenceGap.searching')}</>
            ) : (
              <><Search className="mr-2 h-4 w-4" /> {t('evidenceGap.button')}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('evidenceGap.disclaimer')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceGapCard;