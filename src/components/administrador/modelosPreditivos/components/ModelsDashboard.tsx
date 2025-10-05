import React from 'react';
import { Card } from "@/components/ui/card";
import { Brain, Database, Lightbulb, TrendingUp, Target, Activity } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { modelEvolutionData } from '../data/modelEvolutionData';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

const ModelsDashboard: React.FC = () => {
  const { t } = useTranslation();

  // Calcular métricas gerais
  const totalModels = modelEvolutionData.length;
  const averageAccuracy = (modelEvolutionData.reduce((sum, m) => sum + m.currentAccuracy, 0) / totalModels).toFixed(1);
  const totalSamples = modelEvolutionData.reduce((sum, m) => sum + m.totalSamples, 0);
  const totalInsights = modelEvolutionData.reduce((sum, m) => sum + m.insights.length, 0);
  const avgGrowthRate = (modelEvolutionData.reduce((sum, m) => sum + m.monthlyGrowthRate, 0) / totalModels).toFixed(1);

  // Top 3 modelos
  const topModels = [...modelEvolutionData]
    .sort((a, b) => b.currentAccuracy - a.currentAccuracy)
    .slice(0, 3);

  // Últimos insights
  const recentInsights = modelEvolutionData
    .flatMap(m => m.insights.map(i => ({ ...i, modelName: m.modelName })))
    .sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime())
    .slice(0, 5);

  // Dados para radar chart
  const radarData = modelEvolutionData.map(model => ({
    model: model.modelName.split(' - ')[0],
    'Precisão': model.currentAccuracy,
    'Dados': (model.totalSamples / 1000), // normalizado para k
    'Insights': model.insights.length * 10, // multiplicado para escala visual
    'Crescimento': model.monthlyGrowthRate * 5 // multiplicado para escala visual
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'state-of-art': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'mature': return 'bg-green-100 text-green-700 border-green-200';
      case 'growing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'initial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'state-of-art': t('admin.models.status.stateOfArt', '🎯 Estado da Arte'),
      'mature': t('admin.models.status.mature', '✅ Maduro'),
      'growing': t('admin.models.status.growing', '📈 Crescendo'),
      'initial': t('admin.models.status.initial', '🌱 Inicial')
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-semibold mb-2">
          {t('admin.models.dashboard.title', 'Visão Geral dos Modelos Preditivos')}
        </h3>
        <p className="text-muted-foreground">
          {t('admin.models.dashboard.subtitle', 'Acompanhe a evolução e performance dos nossos modelos proprietários baseados em dados longitudinais')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.totalModels', 'Modelos Ativos')}
              </p>
              <p className="text-2xl font-bold">{totalModels}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.avgAccuracy', 'Precisão Média')}
              </p>
              <p className="text-2xl font-bold">{averageAccuracy}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.totalSamples', 'Total Amostras')}
              </p>
              <p className="text-2xl font-bold">{(totalSamples / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.insights', 'Insights')}
              </p>
              <p className="text-2xl font-bold">{totalInsights}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.growthRate', 'Crescimento')}
              </p>
              <p className="text-2xl font-bold">+{avgGrowthRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Activity className="h-5 w-5 text-pink-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.models.dashboard.active', 'Em Coleta')}
              </p>
              <p className="text-2xl font-bold">{totalModels}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            {t('admin.models.dashboard.comparison', 'Comparação de Modelos')}
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="model" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar 
                name="Métricas" 
                dataKey="Precisão" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Models */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            {t('admin.models.dashboard.topModels', 'Top 3 Modelos por Performance')}
          </h4>
          <div className="space-y-4">
            {topModels.map((model, index) => (
              <div key={model.modelId} className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{model.modelName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(model.status)}`}>
                      {getStatusLabel(model.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(model.totalSamples / 1000).toFixed(1)}k {t('admin.models.dashboard.samples', 'amostras')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{model.currentAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.models.dashboard.accuracy', 'precisão')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Insights */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">
          {t('admin.models.dashboard.recentInsights', 'Descobertas Recentes')}
        </h4>
        <div className="space-y-3">
          {recentInsights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
              <div className={`p-2 rounded-lg ${
                insight.significance === 'high' ? 'bg-purple-100' :
                insight.significance === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Lightbulb className={`h-4 w-4 ${
                  insight.significance === 'high' ? 'text-purple-700' :
                  insight.significance === 'medium' ? 'text-blue-700' : 'text-gray-700'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{insight.title_pt}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {insight.description_pt}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {insight.modelName}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                insight.significance === 'high' ? 'bg-purple-100 text-purple-700' :
                insight.significance === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {insight.significance === 'high' ? 'Alto Impacto' :
                 insight.significance === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ModelsDashboard;
