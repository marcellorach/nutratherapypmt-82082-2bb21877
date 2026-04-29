import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

  // Only show for admin AND only when twin shows a low gain
  if (!isAdmin) return null;
  if (yearsGained >= 0.3) return null;

  const handleSearch = async () => {
    try {
      const result = await trigger.mutateAsync({ pet_id: petId, max_pairs: 10 });
      const msg = t('evidenceGap.toastSuccess', {
        studies: result.studies_added,
        triplets: result.triplets_pending,
        pairs: result.pairs_searched,
      });
      toast.success(msg);
      refetch();
    } catch (e: any) {
      toast.error(t('evidenceGap.toastError', { error: e?.message || 'unknown' }));
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