import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { ModelEvolution } from '../types/evolutionTypes';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Database, Target, Calendar, ArrowUp, ArrowRight, ArrowDown, Lightbulb, Activity } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { conditionPerformanceData } from '../data/modelEvolutionData';

interface ModelDetailDialogProps {
  model: ModelEvolution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModelDetailDialog: React.FC<ModelDetailDialogProps> = ({ model, open, onOpenChange }) => {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('evolution');

  if (!model) return null;

  const isPortuguese = i18n.language === 'pt';

  // Preparar dados para gráfico de evolução
  const evolutionChartData = model.snapshots.map(snapshot => ({
    date: new Date(snapshot.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    accuracy: snapshot.accuracy,
    dataSamples: snapshot.dataPoints,
    treatment: snapshot.treatmentSamples,
    control: snapshot.controlSamples
  }));

  const getConfidenceBadge = (confidence: string) => {
    const configs = {
      high: { label: t('admin.models.confidence.high', 'Alta Confiança'), color: 'bg-green-100 text-green-700 border-green-200' },
      medium: { label: t('admin.models.confidence.medium', 'Média Confiança'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      low: { label: t('admin.models.confidence.low', 'Requer Dados'), color: 'bg-red-100 text-red-700 border-red-200' }
    };
    return configs[confidence as keyof typeof configs] || configs.low;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowUp className="h-3 w-3 text-green-600" />;
      case 'stable': return <ArrowRight className="h-3 w-3 text-blue-600" />;
      case 'declining': return <ArrowDown className="h-3 w-3 text-red-600" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{model.modelName}</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="evolution">
              {t('admin.models.tabs.evolution', 'Evolução')}
            </TabsTrigger>
            <TabsTrigger value="performance">
              {t('admin.models.tabs.performance', 'Performance')}
            </TabsTrigger>
            <TabsTrigger value="longitudinal">
              {t('admin.models.tabs.longitudinal', 'Impacto')}
            </TabsTrigger>
            <TabsTrigger value="insights">
              {t('admin.models.tabs.insights', 'Insights')}
            </TabsTrigger>
            <TabsTrigger value="comparison">
              {t('admin.models.tabs.comparison', 'Comparação')}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Evolução do Modelo */}
          <TabsContent value="evolution" className="space-y-4">
            {/* Mini Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t('admin.models.evolution.totalSamples', 'Total de Amostras')}
                  </p>
                </div>
                <p className="text-2xl font-bold">{model.totalSamples.toLocaleString()}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    {t('admin.models.evolution.growthRate', 'Crescimento Mensal')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{model.monthlyGrowthRate}%</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t('admin.models.evolution.currentAccuracy', 'Precisão Atual')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">{model.currentAccuracy}%</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <p className="text-sm text-muted-foreground">
                    {t('admin.models.evolution.nextMilestone', 'Próxima Meta')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{model.nextMilestone.target.toLocaleString()}</p>
                  <Progress 
                    value={(model.nextMilestone.current / model.nextMilestone.target) * 100} 
                    className="h-2"
                  />
                </div>
              </Card>
            </div>

            {/* Gráfico de Evolução */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">
                {t('admin.models.evolution.accuracyOverTime', 'Evolução de Precisão ao Longo do Tempo')}
              </h4>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={11} />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--primary))" 
                    fontSize={11}
                    domain={[60, 100]}
                    label={{ value: 'Precisão (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    label={{ value: 'Amostras', angle: 90, position: 'insideRight', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Precisão (%)"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="dataSamples" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Total Amostras"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Gráfico de Tratamento vs Controle */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">
                {t('admin.models.evolution.dataGrowth', 'Crescimento de Dataset: Tratamento vs Controle')}
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="treatment" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Tratamento"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="control" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Controle"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Tab 2: Performance por Condição */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">
                {t('admin.models.performance.byCondition', 'Performance por Condição de Saúde')}
              </h4>
              <div className="space-y-3">
                {conditionPerformanceData.map((condition) => (
                  <div 
                    key={condition.conditionId} 
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">
                            {isPortuguese ? condition.conditionName_pt : condition.conditionName_en}
                          </h5>
                          {getTrendIcon(condition.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground">{condition.system}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getConfidenceBadge(condition.confidence).color} border`}
                      >
                        {getConfidenceBadge(condition.confidence).label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('admin.models.performance.accuracy', 'Precisão')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={condition.accuracy} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{condition.accuracy}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('admin.models.performance.effectiveness', 'Efetividade')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={condition.treatmentEffectiveness} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{condition.treatmentEffectiveness}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('admin.models.performance.samples', 'Amostras')}
                        </p>
                        <p className="text-sm font-medium">{condition.sampleSize.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab 3: Impacto Longitudinal */}
          <TabsContent value="longitudinal" className="space-y-4">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">
                {t('admin.models.longitudinal.correlation', 'Correlação: Volume de Dados × Precisão')}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('admin.models.longitudinal.description', 'Visualize como o aumento no volume de dados longitudinais impacta diretamente a precisão do modelo.')}
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="dataSamples" 
                    stroke="hsl(var(--foreground))" 
                    fontSize={11}
                    label={{ value: 'Volume de Dados', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))" 
                    fontSize={11}
                    domain={[60, 100]}
                    label={{ value: 'Precisão (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-medium mb-2">
                      {t('admin.models.longitudinal.keyInsight', 'Insight Principal')}
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {t('admin.models.longitudinal.insightText', 
                        'O modelo demonstra retornos decrescentes após ~20.000 amostras, atingindo patamar de maturidade. Novos dados continuam refinando predições específicas, especialmente em subgrupos menos representados.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 4: Insights Proprietários */}
          <TabsContent value="insights" className="space-y-4">
            {model.insights.length > 0 ? (
              <div className="space-y-4">
                {model.insights.map((insight) => (
                  <Card key={insight.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        insight.significance === 'high' ? 'bg-purple-100' :
                        insight.significance === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Lightbulb className={`h-6 w-6 ${
                          insight.significance === 'high' ? 'text-purple-700' :
                          insight.significance === 'medium' ? 'text-blue-700' : 'text-gray-700'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-semibold">
                            {isPortuguese ? insight.title_pt : insight.title_en}
                          </h4>
                          <Badge variant="outline" className={
                            insight.significance === 'high' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            insight.significance === 'medium' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }>
                            {insight.significance === 'high' ? 'Alto Impacto' :
                             insight.significance === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isPortuguese ? insight.description_pt : insight.description_en}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Descoberto em</p>
                            <p className="text-sm font-medium">
                              {new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Dados Necessários</p>
                            <p className="text-sm font-medium">{insight.dataRequirement.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Amostras</p>
                            <p className="text-sm font-medium">{insight.evidence.sampleSize}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">P-value</p>
                            <p className="text-sm font-medium">{insight.evidence.pValue.toFixed(3)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <p className="text-xs text-muted-foreground">Raças relacionadas:</p>
                          {insight.relatedBreeds.map((breed, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {breed}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">
                  {t('admin.models.insights.noInsights', 'Nenhum Insight Descoberto Ainda')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('admin.models.insights.waitingData', 
                    'Insights proprietários serão descobertos conforme o modelo acumula mais dados longitudinais.'
                  )}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Tab 5: Comparação Tratamento/Controle */}
          <TabsContent value="comparison" className="space-y-4">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">
                {t('admin.models.comparison.treatmentVsControl', 'Tratamento vs Controle ao Longo do Tempo')}
              </h4>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="treatment" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Grupo Tratamento"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="control" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Grupo Controle"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Grupo Tratamento</p>
                  <p className="text-3xl font-bold text-green-700">{model.treatmentSamples.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((model.treatmentSamples / model.totalSamples) * 100).toFixed(1)}% do total
                  </p>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-muted-foreground mb-1">Grupo Controle</p>
                  <p className="text-3xl font-bold text-blue-700">{model.controlSamples.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((model.controlSamples / model.totalSamples) * 100).toFixed(1)}% do total
                  </p>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDetailDialog;
