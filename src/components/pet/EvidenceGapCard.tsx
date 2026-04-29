import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTriggerGapFill, usePendingGapFillTriplets } from '@/hooks/useKgEvidenceGapFill';
import { toast } from 'sonner';

interface EvidenceGapCardProps {
  petId: string;
  yearsGained: number;
  hasCoverage: boolean; // true if at least one condition is KG-covered
}

const EvidenceGapCard: React.FC<EvidenceGapCardProps> = ({ petId, yearsGained, hasCoverage }) => {
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
      }
      refetch();
    } catch (e: any) {
      const msg = e?.message || (typeof e === 'string' ? e : 'unknown');
      console.error('[EvidenceGapCard] gap-fill error', e);
      setLastResult({
        pairs_searched: 0, studies_added: 0, triplets_pending: 0,
        message: msg,
      });
      toast.error(t('evidenceGap.toastError', { error: msg }));
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
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">pairs:</span> <strong>{lastResult.pairs_searched}</strong></div>
              <div><span className="text-muted-foreground">studies:</span> <strong>{lastResult.studies_added}</strong></div>
              <div><span className="text-muted-foreground">pending:</span> <strong>{lastResult.triplets_pending}</strong></div>
            </div>
            {lastResult.message && (
              <p className="text-[11px] text-muted-foreground italic">{lastResult.message}</p>
            )}
            {(lastResult.discovery_notes || []).map((n, i) => (
              <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400">⚠ {n}</p>
            ))}
            {(lastResult.details || []).slice(0, 6).map((d: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px] border-t pt-1">
                <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
                  {t(`evidenceGap.detailStatus.${d.status}`, d.status)}
                </Badge>
                <span className="text-muted-foreground leading-snug">
                  {d.pair?.compound_en} → {d.pair?.condition_en}
                  {d.efficacy_0_5 != null && <> · ef {d.efficacy_0_5}/5</>}
                  {d.species_hint && d.species_hint !== 'canine' && <> · <em>{d.species_hint}</em></>}
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