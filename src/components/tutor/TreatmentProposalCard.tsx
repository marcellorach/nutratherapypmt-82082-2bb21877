import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dna, Shield, FlaskConical, Sparkles, Heart, CheckCircle2,
  Clock, TrendingUp, MessageSquare, Loader2, ArrowDown,
  Calendar, TestTube, ChevronDown, ChevronUp, Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProposalAIChat from './ProposalAIChat';
import ConditionProgressionChart from './ConditionProgressionChart';

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
  proposal, petName, petBreed, petAge, onAccepted,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { error } = await (supabase as any)
        .from('treatment_proposals')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', proposal.id);
      if (error) throw error;
      toast({ title: t('tutor.proposal.acceptedTitle'), description: t('tutor.proposal.acceptedDesc') });
      onAccepted();
    } catch (err) {
      console.error('Error accepting proposal:', err);
      toast({ title: t('tutor.proposal.errorTitle'), description: t('tutor.proposal.errorDesc'), variant: 'destructive' });
    } finally {
      setAccepting(false);
    }
  };

  const summary = proposal.scientific_summary || {};
  const totalAnnual = proposal.monthly_price_brl * proposal.subscription_months;
  const pathways = summary.biological_pathways || [];
  const keyTriplets = summary.key_triplets || [];
  const timeline = summary.treatment_timeline || [];
  const periodicExams = summary.periodic_exams || [];

  const stepColors: Record<string, string> = {
    compound: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    mechanism: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    effect: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    outcome: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    contraindication: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };

  const timelinePhaseKeys: Record<string, string> = {
    adaptation: 'tutor.proposal.timeline.month1',
    early_effects: 'tutor.proposal.timeline.month2_3',
    measurable_improvement: 'tutor.proposal.timeline.month4_6',
    consolidation: 'tutor.proposal.timeline.month7_9',
    reassessment: 'tutor.proposal.timeline.month10_12',
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/20">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('tutor.proposal.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {petName} • {petBreed} • {petAge} {t('tutor.petInfo.years')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit text-xs gap-1">
          <Clock className="h-3 w-3" />
          {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : '-'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Geroscience Section */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t('tutor.proposal.geroscienceTitle')}</h3>
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
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                {c.name || c.condition_name || c}
                {c.severity && (
                  <span className={`ml-1 text-[10px] px-1 rounded ${
                    c.severity === 'severe' ? 'bg-red-200 text-red-800' :
                    c.severity === 'moderate' ? 'bg-orange-200 text-orange-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {c.severity}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Biological Pathways */}
        {pathways.length > 0 && (
          <>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary" />
                {t('tutor.proposal.pathwaysTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">{t('tutor.proposal.pathwaysDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pathways.map((pathway: any, pIdx: number) => (
                  <div key={pIdx} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{pathway.condition}</p>
                    <div className="flex flex-col items-center gap-0">
                      {(pathway.steps || []).map((step: any, sIdx: number) => (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && (
                            <ArrowDown className="h-3 w-3 text-muted-foreground my-0.5" />
                          )}
                          <div className={`w-full rounded-md border px-3 py-1.5 text-xs text-center ${stepColors[step.type] || 'bg-muted'}`}>
                            {step.label}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Scientific Evidence + Key Relationships */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t('tutor.proposal.evidenceTitle')}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
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
            <p className="text-xs text-muted-foreground text-center mb-3">
              {t('tutor.proposal.confidenceLabel')}: <strong>{proposal.confidence_level}</strong>
            </p>
          )}

          {/* Key Triplets as readable sentences */}
          {keyTriplets.length > 0 && (
            <div className="space-y-1.5 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t('tutor.proposal.keyRelationshipsTitle')}</p>
              {keyTriplets.slice(0, 5).map((trip: any, i: number) => (
                <div key={i} className="text-xs text-foreground bg-background/50 rounded px-2 py-1.5 flex items-center gap-1.5">
                  <span className="text-primary font-medium">{trip.subject}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{trip.predicate}</Badge>
                  <span className="font-medium">{trip.object}</span>
                  {trip.confidence && (
                    <span className="ml-auto text-muted-foreground text-[10px]">
                      {Math.round(trip.confidence * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
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
              <div key={i} className="bg-muted/50 rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.name}</p>
                    {c.reason && <p className="text-xs text-muted-foreground mt-0.5">{c.reason}</p>}
                    {c.mechanism && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{c.mechanism}</p>}
                  </div>
                  {c.dosage && (
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{c.dosage}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Treatment Timeline */}
        {timeline.length > 0 && (
          <>
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {t('tutor.proposal.timelineTitle')}
              </h3>
              <div className="relative space-y-0">
                {timeline.map((item: any, i: number) => (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-primary text-primary-foreground' :
                        i === timeline.length - 1 ? 'bg-green-500 text-white' :
                        'bg-muted text-muted-foreground border'
                      }`}>
                        {item.month}
                      </div>
                      {i < timeline.length - 1 && (
                        <div className="w-px h-full bg-border min-h-[20px]" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm text-foreground leading-relaxed">
                        {t(timelinePhaseKeys[item.phase] || 'tutor.proposal.timeline.month1')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Periodic Exam Schedule */}
        {periodicExams.length > 0 && (
          <>
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <TestTube className="h-4 w-4 text-blue-500" />
                {t('tutor.proposal.periodicExamsTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">{t('tutor.proposal.periodicExamsDesc')}</p>
              <div className="space-y-2">
                {periodicExams.map((pe: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded p-3 flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {t('tutor.proposal.examMonth', { month: pe.month })}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {(pe.exams || []).map((exam: string, j: number) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">
                          {t(`tutor.proposal.examTypes.${exam}`, exam)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Rationale */}
        {proposal.rationale && (
          <>
            <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
              "{proposal.rationale}"
            </div>
            <Separator />
          </>
        )}

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

        {/* AI Chat Section */}
        <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {t('tutor.proposal.aiChatTitle')}
              </span>
              {chatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ProposalAIChat
              petName={petName}
              petBreed={petBreed}
              petAge={petAge}
              conditions={proposal.conditions}
              compounds={proposal.compounds}
              scientificSummary={proposal.scientific_summary}
              rationale={proposal.rationale}
            />
          </CollapsibleContent>
        </Collapsible>

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
            <Button onClick={handleAccept} disabled={accepting} className="flex-1 gap-2" size="lg">
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t('tutor.proposal.accept')}
            </Button>
            <Button variant="outline" className="flex-1 gap-2" size="lg" onClick={() => setChatOpen(true)}>
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
