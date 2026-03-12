import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dna, Shield, FlaskConical, Sparkles, Heart, CheckCircle2,
  Clock, TrendingUp, MessageSquare, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TreatmentProposal {
  id: string;
  pet_id: string;
  veterinarian_name: string;
  status: string;
  conditions: any[];
  compounds: any[];
  scientific_summary: any;
  confidence_level: string | null;
  rationale: string | null;
  monthly_price_brl: number;
  subscription_months: number;
  created_at: string | null;
  accepted_at: string | null;
}

interface Props {
  proposal: TreatmentProposal;
  petName: string;
  petBreed: string;
  petAge: number;
  onAccepted: () => void;
}

const TreatmentProposalCard: React.FC<Props> = ({
  proposal,
  petName,
  petBreed,
  petAge,
  onAccepted,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { error } = await (supabase as any)
        .from('treatment_proposals')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', proposal.id);

      if (error) throw error;

      toast({
        title: t('tutor.proposal.acceptedTitle'),
        description: t('tutor.proposal.acceptedDesc'),
      });
      onAccepted();
    } catch (err) {
      console.error('Error accepting proposal:', err);
      toast({
        title: t('tutor.proposal.errorTitle'),
        description: t('tutor.proposal.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const summary = proposal.scientific_summary || {};
  const totalAnnual = proposal.monthly_price_brl * proposal.subscription_months;

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/20">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t('tutor.proposal.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {petName} • {petBreed} • {petAge} {t('tutor.petInfo.years')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit text-xs gap-1">
          <Clock className="h-3 w-3" />
          {proposal.created_at
            ? new Date(proposal.created_at).toLocaleDateString()
            : '-'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Geroscience Section */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('tutor.proposal.geroscienceTitle')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('tutor.proposal.geroscienceDesc', { petName })}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conditions */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            {t('tutor.proposal.conditionsTitle')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {proposal.conditions.map((c: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {c.name || c.condition_name || c}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Scientific Evidence */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t('tutor.proposal.evidenceTitle')}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{summary.tripletCount || 0}</p>
              <p className="text-xs text-muted-foreground">{t('tutor.proposal.triplets')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{summary.studyCount || 0}</p>
              <p className="text-xs text-muted-foreground">{t('tutor.proposal.studies')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {summary.kgCoverage ? `${Math.round(summary.kgCoverage * 100)}%` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">{t('tutor.proposal.kgCoverage')}</p>
            </div>
          </div>
          {proposal.confidence_level && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t('tutor.proposal.confidenceLabel')}: {proposal.confidence_level}
            </p>
          )}
        </div>

        <Separator />

        {/* Compounds */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            {t('tutor.proposal.compoundsTitle')}
          </h3>
          <div className="space-y-2">
            {proposal.compounds.map((c: any, i: number) => (
              <div key={i} className="bg-muted/50 rounded p-3 flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground text-sm">{c.name}</p>
                  {c.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.reason}</p>
                  )}
                </div>
                {c.dosage && (
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    {c.dosage}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rationale */}
        {proposal.rationale && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
              "{proposal.rationale}"
            </div>
          </>
        )}

        <Separator />

        {/* Vet Approval */}
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
          <Shield className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {t('tutor.proposal.vetApproval')}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              {t('tutor.proposal.vetApprovalBy', { name: proposal.veterinarian_name })}
            </p>
          </div>
        </div>

        {/* Living Program */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
          <p className="font-medium text-foreground mb-1">{t('tutor.proposal.livingProgramTitle')}</p>
          <p>{t('tutor.proposal.livingProgramDesc')}</p>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">{t('tutor.proposal.pricingLabel')}</p>
          <p className="text-3xl font-bold text-primary">
            R$ {proposal.monthly_price_brl.toFixed(2).replace('.', ',')}
            <span className="text-base font-normal text-muted-foreground">/{t('tutor.proposal.perMonth')}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('tutor.proposal.annualSubscription', {
              months: proposal.subscription_months,
              total: `R$ ${totalAnnual.toFixed(2).replace('.', ',')}`,
            })}
          </p>
        </div>

        {/* Action Buttons */}
        {proposal.status === 'pending' && (
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 gap-2"
              size="lg"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t('tutor.proposal.accept')}
            </Button>
            <Button variant="outline" className="flex-1 gap-2" size="lg">
              <MessageSquare className="h-4 w-4" />
              {t('tutor.proposal.questions')}
            </Button>
          </div>
        )}

        {proposal.status === 'accepted' && (
          <div className="text-center py-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              {t('tutor.proposal.alreadyAccepted')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TreatmentProposalCard;
