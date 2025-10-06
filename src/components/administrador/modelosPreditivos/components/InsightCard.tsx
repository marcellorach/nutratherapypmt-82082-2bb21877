import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Calendar, Users, TrendingUp } from "lucide-react";
import { DegenerativeInsight } from "../types/predictiveModelTypes";

interface InsightCardProps {
  insight: DegenerativeInsight;
  onViewDetails: () => void;
}

const InsightCard = ({ insight, onViewDetails }: InsightCardProps) => {
  const { t } = useTranslation();
  
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

  return (
    <Card className="border-border bg-card hover:border-brand-primary/40 transition-all duration-300 h-full">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
            <Lightbulb className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm mb-1 leading-tight">
              {insight.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <Badge className={`${significanceBadge.className} w-fit mb-3 text-xs`}>
          {significanceBadge.label}
        </Badge>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">
          {insight.description}
        </p>

        <div className="space-y-3 mb-4">
          {insight.relatedConditions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">
                {t('predictiveModels.insights.relatedConditions')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insight.relatedConditions.slice(0, 3).map((condition, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-border">
                    {condition}
                  </Badge>
                ))}
                {insight.relatedConditions.length > 3 && (
                  <Badge variant="outline" className="text-xs border-border">
                    +{insight.relatedConditions.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {insight.relatedBreeds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">
                {t('predictiveModels.insights.affectedBreeds')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insight.relatedBreeds.slice(0, 2).map((breed, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {breed}
                  </Badge>
                ))}
                {insight.relatedBreeds.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{insight.relatedBreeds.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {t('predictiveModels.insights.sample')}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {insight.evidence.sampleSize.toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {t('predictiveModels.insights.effectSize')}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {insight.evidence.effectSize.toFixed(2)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="w-full"
        >
          {t('predictiveModels.insights.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
