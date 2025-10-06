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
  if (!insight) return null;

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'high':
        return {
          label: 'Alta Significância',
          className: 'bg-success/10 text-success border-success/20'
        };
      case 'medium':
        return {
          label: 'Média Significância',
          className: 'bg-info/10 text-info border-info/20'
        };
      case 'low':
        return {
          label: 'Baixa Significância',
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
                  <span>Descoberto em {new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}</span>
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
                Descrição Completa
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">Condições Relacionadas</h4>
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
                <h4 className="font-semibold text-foreground mb-3">Raças Afetadas</h4>
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
              <h4 className="font-semibold text-foreground mb-3">Faixa Etária</h4>
              <p className="text-sm text-muted-foreground">{insight.ageRange}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-primary" />
                Evidências Científicas
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Tamanho da Amostra</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.sampleSize.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">p-Value</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.pValue.toFixed(4)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Effect Size</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {insight.evidence.effectSize.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">IC 95%</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    [{insight.evidence.confidenceInterval[0].toFixed(2)}, {insight.evidence.confidenceInterval[1].toFixed(2)}]
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Interpretação:</strong> Um p-value de {insight.evidence.pValue.toFixed(4)} indica uma {insight.evidence.pValue < 0.01 ? 'forte' : insight.evidence.pValue < 0.05 ? 'moderada' : 'leve'} significância estatística. 
                  O effect size de {insight.evidence.effectSize.toFixed(2)} sugere um efeito {insight.evidence.effectSize > 0.8 ? 'grande' : insight.evidence.effectSize > 0.5 ? 'médio' : 'pequeno'} na prática clínica.
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
