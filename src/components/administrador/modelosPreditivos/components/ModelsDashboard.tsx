import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Lightbulb, Target, Percent } from "lucide-react";
import { predictiveModelsData } from '../data/predictiveModelsData';

export const ModelsDashboard = () => {
  // Calcular métricas gerais
  const totalModels = predictiveModelsData.length;
  const activeModels = predictiveModelsData.filter(m => m.status !== 'initial').length;
  const avgAccuracy = (predictiveModelsData.reduce((sum, m) => sum + m.currentAccuracy, 0) / totalModels).toFixed(1);
  const totalPetsMonitored = predictiveModelsData.reduce((sum, m) => sum + m.totalPetsMonitored, 0);
  const totalInsights = predictiveModelsData.reduce((sum, m) => sum + m.degenerativeInsights.length, 0);
  const avgGrowthRate = (predictiveModelsData.reduce((sum, m) => sum + m.monthlyGrowthRate, 0) / totalModels).toFixed(1);
  
  // Aprendizados recentes (últimos 11)
  const recentLearnings = predictiveModelsData
    .flatMap(model => 
      model.degenerativeInsights.map(insight => ({
        ...insight,
        modelName: model.modelName
      }))
    )
    .sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime())
    .slice(0, 11);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'state-of-art':
        return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      case 'mature':
        return 'bg-success/10 text-success border-success/20';
      case 'growing':
        return 'bg-info/10 text-info border-info/20';
      case 'initial':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'state-of-art':
        return 'Estado da Arte';
      case 'mature':
        return 'Maduro';
      case 'growing':
        return 'Em Crescimento';
      case 'initial':
        return 'Fase Inicial';
      default:
        return status;
    }
  };

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'high':
        return <Badge className="bg-success/10 text-success border-success/20">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Média</Badge>;
      case 'low':
        return <Badge className="bg-muted/50 text-muted-foreground border-muted">Baixa</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Dashboard de Modelos Preditivos</h2>
        <p className="text-muted-foreground">
          Visão executiva dos modelos de IA que evoluem com os dados da plataforma
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10">
              <Activity className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modelos Ativos</p>
              <p className="text-2xl font-semibold text-foreground">{activeModels}/{totalModels}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Target className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Precisão Média</p>
              <p className="text-2xl font-semibold text-foreground">{avgAccuracy}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pets Monitorados</p>
              <p className="text-2xl font-semibold text-foreground">{(totalPetsMonitored / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Lightbulb className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insights Degenerativos</p>
              <p className="text-2xl font-semibold text-foreground">{totalInsights}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-chart-2/20">
              <Percent className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Adesão</p>
              <p className="text-2xl font-semibold text-foreground">87.3%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-chart-5/20">
              <TrendingUp className="h-4 w-4 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Crescimento Mensal</p>
              <p className="text-2xl font-semibold text-foreground">+{avgGrowthRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Modelos Preditivos e Aprendizados Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Modelos Preditivos em Deep Learning */}
        <Card className="lg:col-span-3 p-6 border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Modelos Preditivos em Deep Learning</h3>
          <div className="space-y-3">
            {predictiveModelsData.map((model) => (
              <div key={model.modelId} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{model.modelName}</p>
                    <Badge variant="outline" className={getStatusColor(model.status)}>
                      {getStatusLabel(model.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.algorithm}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-foreground">{model.currentAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">{(model.totalPetsMonitored / 1000).toFixed(0)}k pets</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Aprendizados Recentes */}
        <Card className="lg:col-span-2 p-6 border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Aprendizados Recentes</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {recentLearnings.map((learning) => (
              <div key={learning.id} className="p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{learning.title}</p>
                  {getSignificanceBadge(learning.significance)}
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{learning.description}</p>
                <p className="text-xs text-muted-foreground mb-1">{learning.modelName}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(learning.discoveredAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    n={learning.evidence.sampleSize.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
