import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Database, Lightbulb, AlertCircle } from "lucide-react";
import { PredictiveModel } from '../types/predictiveModelTypes';
import { DataSourcesChart } from './DataSourcesChart';
import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface ModelDetailDialogProps {
  model: PredictiveModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModelDetailDialog = ({ model, open, onOpenChange }: ModelDetailDialogProps) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!model) return null;

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'high':
        return <Badge className="bg-success/10 text-success border-success/20">{t('modelDetail.significance.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning border-warning/20">{t('modelDetail.significance.medium')}</Badge>;
      case 'low':
        return <Badge className="bg-muted/50 text-muted-foreground border-muted">{t('modelDetail.significance.low')}</Badge>;
      default:
        return null;
    }
  };

  const milestoneProgress = ((model.nextMilestone.current / model.nextMilestone.target) * 100).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{model.modelName}</DialogTitle>
              <span className="text-sm text-muted-foreground">{model.algorithm}</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-primary">{model.currentAccuracy}%</p>
              <p className="text-xs text-muted-foreground">{t('modelDetail.currentAccuracy')}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('modelDetail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="evolution">{t('modelDetail.tabs.evolution')}</TabsTrigger>
            <TabsTrigger value="sources">{t('modelDetail.tabs.sources')}</TabsTrigger>
            <TabsTrigger value="insights">{t('modelDetail.tabs.insights')}</TabsTrigger>
            <TabsTrigger value="performance">{t('modelDetail.tabs.performance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4 bg-muted/30 border-border">
              <p className="text-sm text-foreground">{model.description}</p>
            </Card>

            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-info" />
                  <p className="text-xs text-muted-foreground">{t('modelDetail.stats.totalMonitored')}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{model.totalPetsMonitored.toLocaleString()}</p>
              </Card>

              <Card className="p-4 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  <p className="text-xs text-muted-foreground">{t('modelDetail.stats.treatmentGroup')}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{model.treatmentGroup.toLocaleString()}</p>
              </Card>

              <Card className="p-4 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-chart-3" />
                  <p className="text-xs text-muted-foreground">{t('modelDetail.stats.controlGroup')}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{model.controlGroup.toLocaleString()}</p>
              </Card>

              <Card className="p-4 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-chart-5" />
                  <p className="text-xs text-muted-foreground">{t('modelDetail.stats.monthlyGrowth')}</p>
                </div>
                <p className="text-2xl font-bold text-success">+{model.monthlyGrowthRate}%</p>
              </Card>
            </div>

            <Card className="p-4 border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('modelDetail.nextMilestone')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{model.nextMilestone.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('modelDetail.progress')}</span>
                  <span className="font-medium text-foreground">{milestoneProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary transition-all"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{model.nextMilestone.current.toLocaleString()} pets</span>
                  <span>{t('modelDetail.target')}: {model.nextMilestone.target.toLocaleString()} pets</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card className="p-4 border-border">
              <h4 className="text-sm font-semibold text-foreground mb-4">{t('modelDetail.accuracyEvolution')}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={model.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    domain={[50, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="hsl(var(--brand-primary))" 
                    fill="hsl(var(--brand-primary) / 0.2)"
                    strokeWidth={2}
                    name={t('modelDetail.accuracyPercent')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 border-border">
              <h4 className="text-sm font-semibold text-foreground mb-4">{t('modelDetail.dataVolume')}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={model.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    formatter={(value: number) => [value.toLocaleString(), 'Pets']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="petsMonitored" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                    name={t('modelDetail.petsMonitored')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card className="p-4 border-border">
              <h4 className="text-sm font-semibold text-foreground mb-4">{t('modelDetail.dataSourcesComposition')}</h4>
              <DataSourcesChart dataSources={model.dataSources} />
            </Card>

            <div className="grid grid-cols-1 gap-3">
              {model.dataSources.map((source, index) => (
                <Card key={index} className="p-4 border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }} />
                      <p className="font-medium text-foreground">{source.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{source.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{source.sampleCount.toLocaleString()} pets</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-warning" />
              <h4 className="text-sm font-semibold text-foreground">
                {t('modelDetail.degenerativeInsights')}
              </h4>
            </div>

            <div className="space-y-4">
              {model.degenerativeInsights.map((insight) => (
                <Card key={insight.id} className="p-4 border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-foreground mb-2">{insight.title}</h5>
                      {getSignificanceBadge(insight.significance)}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {new Date(insight.discoveredAt).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground mb-4">{insight.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('modelDetail.relatedConditions')}</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.relatedConditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('modelDetail.analyzedBreeds')}</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.relatedBreeds.slice(0, 3).map((breed, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {breed}
                          </Badge>
                        ))}
                        {insight.relatedBreeds.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{insight.relatedBreeds.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('modelDetail.evidence.sampleSize')}</p>
                      <p className="text-sm font-semibold text-foreground">{insight.evidence.sampleSize.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('modelDetail.evidence.pValue')}</p>
                      <p className="text-sm font-semibold text-foreground">{insight.evidence.pValue.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('modelDetail.evidence.effectSize')}</p>
                      <p className="text-sm font-semibold text-foreground">{(insight.evidence.effectSize * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('modelDetail.evidence.ci95')}</p>
                      <p className="text-sm font-semibold text-foreground">
                        [{(insight.evidence.confidenceInterval[0] * 100).toFixed(1)}%, {(insight.evidence.confidenceInterval[1] * 100).toFixed(1)}%]
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="p-4 border-border">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{t('modelDetail.segmentedPerformance')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('modelDetail.segmentedDescription')}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-border">
                <h5 className="text-sm font-semibold text-foreground mb-3">{t('modelDetail.byAgeRange')}</h5>
                <div className="space-y-3">
                  {[
                    { range: '0-2', accuracy: model.currentAccuracy - 5.2 },
                    { range: '3-6', accuracy: model.currentAccuracy - 2.1 },
                    { range: '7-10', accuracy: model.currentAccuracy + 1.8 },
                    { range: '11+', accuracy: model.currentAccuracy + 2.5 }
                  ].map((segment, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{segment.range}</span>
                        <span className="font-medium text-foreground">{segment.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-chart-2"
                          style={{ width: `${segment.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 border-border">
                <h5 className="text-sm font-semibold text-foreground mb-3">{t('modelDetail.bySize')}</h5>
                <div className="space-y-3">
                  {[
                    { size: t('modelDetail.sizes.miniature'), accuracy: model.currentAccuracy - 3.1 },
                    { size: t('modelDetail.sizes.small'), accuracy: model.currentAccuracy - 1.4 },
                    { size: t('modelDetail.sizes.medium'), accuracy: model.currentAccuracy + 0.8 },
                    { size: t('modelDetail.sizes.large'), accuracy: model.currentAccuracy + 2.2 },
                    { size: t('modelDetail.sizes.giant'), accuracy: model.currentAccuracy + 1.1 }
                  ].map((segment, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{segment.size}</span>
                        <span className="font-medium text-foreground">{segment.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-chart-4"
                          style={{ width: `${segment.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-4 border-border">
              <h5 className="text-sm font-semibold text-foreground mb-3">{t('modelDetail.byDegenerativeCondition')}</h5>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { condition: t('modelDetail.conditions.osteoarthritis'), accuracy: model.currentAccuracy + 3.2 },
                  { condition: t('modelDetail.conditions.cognitiveDegradation'), accuracy: model.currentAccuracy + 1.8 },
                  { condition: t('modelDetail.conditions.cardiomyopathy'), accuracy: model.currentAccuracy - 0.5 },
                  { condition: t('modelDetail.conditions.chronicKidneyDisease'), accuracy: model.currentAccuracy + 2.1 },
                  { condition: t('modelDetail.conditions.sarcopenia'), accuracy: model.currentAccuracy - 1.2 },
                  { condition: t('modelDetail.conditions.retinalDegeneration'), accuracy: model.currentAccuracy - 2.8 }
                ].map((segment, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{segment.condition}</span>
                      <span className="font-medium text-foreground">{segment.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary"
                        style={{ width: `${segment.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDetailDialog;
