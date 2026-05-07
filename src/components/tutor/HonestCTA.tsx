import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck, TrendingDown } from 'lucide-react';
import { computeProposalROI, ROIInput } from '@/services/proposal-roi';

interface Props {
  monthlyPriceBrl: number;
  subscriptionMonths: number;
  primaryConditionName?: string;
  installedTreatmentCostBrl?: number;
  status: string;
  accepting: boolean;
  onAcceptFirstBox: () => void;
  onOpenChat: () => void;
}

const formatBRL = (v: number) =>
  `R$ ${v.toFixed(2).replace('.', ',')}`;

const HonestCTA: React.FC<Props> = ({
  monthlyPriceBrl,
  subscriptionMonths,
  primaryConditionName,
  installedTreatmentCostBrl,
  status,
  accepting,
  onAcceptFirstBox,
  onOpenChat,
}) => {
  const { t } = useTranslation();

  const roi = computeProposalROI({
    monthlyPriceBrl,
    subscriptionMonths,
    installedTreatmentCostBrl,
  } as ROIInput);

  const isAccepted = status === 'accepted';

  return (
    <div className="space-y-4">
      {/* ROI comparison block */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('tutor.proposal.cta.roiTitle')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('tutor.proposal.cta.roiDesc')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-background rounded p-2 border">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
              {t('tutor.proposal.cta.planAnnual')}
            </p>
            <p className="text-base font-bold text-foreground">{formatBRL(roi.annualPlanCost)}</p>
          </div>
          <div className="bg-background rounded p-2 border">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
              {t('tutor.proposal.cta.installedCost', {
                condition: primaryConditionName || t('tutor.proposal.cta.aChronicCondition'),
              })}
            </p>
            <p className="text-base font-bold text-foreground">
              {roi.installedCost != null ? formatBRL(roi.installedCost) : '—'}
            </p>
          </div>
          <div className="bg-primary/10 rounded p-2 border border-primary/30">
            <p className="text-[10px] uppercase text-primary tracking-wide">
              {t('tutor.proposal.cta.projectedDelta')}
            </p>
            <p className="text-base font-bold text-primary">
              {roi.projectedDelta != null ? formatBRL(roi.projectedDelta) : '—'}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          {t('tutor.proposal.cta.roiCaveat')}
        </p>
      </Card>

      {/* M3 promise */}
      <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded p-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {t('tutor.proposal.cta.m3PromiseTitle')}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            {t('tutor.proposal.cta.m3PromiseDesc', {
              credit: formatBRL(roi.m3CreditBrl),
            })}
          </p>
        </div>
      </div>

      {/* Two-step CTA */}
      {!isAccepted && (
        <div className="space-y-2">
          <Button
            onClick={onAcceptFirstBox}
            disabled={accepting}
            className="w-full gap-2"
            size="lg"
          >
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('tutor.proposal.cta.primary', { price: formatBRL(monthlyPriceBrl) })}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            {t('tutor.proposal.cta.primaryHint')}
          </p>

          <Button variant="outline" className="w-full gap-2" size="sm">
            <Badge variant="secondary" className="text-[10px]">M3</Badge>
            {t('tutor.proposal.cta.secondary')}
          </Button>

          <Button variant="ghost" className="w-full gap-2" size="sm" onClick={onOpenChat}>
            <MessageSquare className="h-4 w-4" />
            {t('tutor.proposal.cta.askQuestions')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default HonestCTA;