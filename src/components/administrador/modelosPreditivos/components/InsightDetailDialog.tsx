import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Calendar, Users, TrendingUp, Activity, Target } from "lucide-react";
import { DegenerativeInsight } from "../types/predictiveModelTypes";

interface InsightDetailDialogProps {
  insight: DegenerativeInsight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InsightDetailDialog = ({ insight, open, onOpenChange }: InsightDetailDialogProps) => {
  const { t } = useTranslation();
  
  if (!insight) return null;

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'high':
        return {
          label: t('predictiveModels.insights.significance.high'),
          className: 'bg-success/10 text-success border-success/20'
        };
      case 'medium':
        return {
          label: t('predictiveModels.insights.significance.medium'),
          className: 'bg-info/10 text-info border-info/20'
        };
      case 'low':
        return {
          label: t('predictiveModels.insights.significance.low'),
          className: 'bg-warning/10 text-warning border-warning/20'
        };
      default:
        return {
          label: significance,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const significanceBadge = getSignificanceBadge(insight.significance);

  // Gerar interpretação baseada nos dados
  const getSignificanceLevel = (pValue: number) => {
    if (pValue < 0.001) return t('predictiveModels.insights.interpretationText.strongSignificance');
    if (pValue < 0.01) return t('predictiveModels.insights.interpretationText.moderateSignificance');
    return t('predictiveModels.insights.interpretationText.mildSignificance');
  };

  const getEffectMagnitude = (effectSize: number) => {
    if (effectSize >= 0.8) return t('predictiveModels.insights.interpretationText.largeEffect');
    if (effectSize >= 0.5) return t('predictiveModels.insights.interpretationText.mediumEffect');
    return t('predictiveModels.insights.interpretationText.smallEffect');
  };

  const interpretation = t('predictiveModels.insights.interpretationText.template', {
    pValue: insight.evidence.pValue.toFixed(4),
    significance: getSignificanceLevel(insight.evidence.pValue),
    effectSize: insight.evidence.effectSize.toFixed(2),
    effectMagnitude: getEffectMagnitude(insight.evidence.effectSize)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
              <Lightbulb className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{insight.title}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{t('predictiveModels.insights.discoveredOn')} {new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <Badge className={significanceBadge.className}>
                  {significanceBadge.label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-primary" />
                {t('predictiveModels.insights.fullDescription')}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">{t('predictiveModels.insights.relatedConditions')}</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.relatedConditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="border-border">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">{t('predictiveModels.insights.affectedBreeds')}</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.relatedBreeds.map((breed, idx) => (
                    <Badge key={idx} variant="secondary">
                      {breed}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-3">{t('predictiveModels.insights.ageRange')}</h4>
              <p className="text-sm text-muted-foreground">{insight.ageRange}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-primary" />
                {t('predictiveModels.insights.scientificEvidence')}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('predictiveModels.insights.sampleSize')}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.sampleSize.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('predictiveModels.insights.pValue')}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.pValue.toFixed(4)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('predictiveModels.insights.effectSize')}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.effectSize.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('predictiveModels.insights.confidenceInterval')}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    [{insight.evidence.confidenceInterval[0].toFixed(2)}, {insight.evidence.confidenceInterval[1].toFixed(2)}]
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{t('predictiveModels.insights.interpretation')}:</strong> {interpretation}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDetailDialog;
