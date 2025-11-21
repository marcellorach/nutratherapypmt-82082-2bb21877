import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  Network, 
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react';
import NetworkGraph from '../../visualizations/NetworkGraph';
import { useTranslation } from 'react-i18next';

interface EnhancedStudyVisualizationProps {
  study: any;
  extractedData?: any;
}

const EnhancedStudyVisualization: React.FC<EnhancedStudyVisualizationProps> = ({ 
  study, 
  extractedData 
}) => {
  const { t } = useTranslation();
  const [activeViz, setActiveViz] = useState('timeline');

  // Extract data for visualizations
  const nutraceuticals = extractedData?.nutraceuticals || study.analysis_data?.nutraceuticals || [];
  const conditions = extractedData?.conditions || study.analysis_data?.conditions || [];
  const findings = extractedData?.findings || study.analysis_data?.findings || [];
  const mechanisms = extractedData?.mechanisms || study.analysis_data?.mechanisms || [];

  // Build network graph data
  const buildNetworkData = () => {
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Add nutraceutical nodes
    nutraceuticals.forEach((nutra: any, idx: number) => {
      nodes.push({
        id: `nutra-${idx}`,
        label: nutra.name || nutra,
        group: 'nutraceutical',
        value: nutra.efficacy_score || 3,
      });
    });

    // Add condition nodes
    conditions.forEach((cond: any, idx: number) => {
      nodes.push({
        id: `cond-${idx}`,
        label: cond.name || cond,
        group: 'condition',
        value: cond.treatability_score || 3,
      });
    });

    // Create links between nutraceuticals and conditions
    nutraceuticals.forEach((nutra: any, nIdx: number) => {
      conditions.slice(0, 2).forEach((cond: any, cIdx: number) => {
        links.push({
          source: `nutra-${nIdx}`,
          target: `cond-${cIdx}`,
          value: Math.random() * 5 + 1, // Random weight for demo
        });
      });
    });

    return { nodes, links };
  };

  const networkData = buildNetworkData();

  // Timeline data
  const timelineSteps = [
    { 
      name: t('viz.timeline.upload', 'Upload'), 
      status: 'completed', 
      time: study.created_at,
      icon: CheckCircle2
    },
    { 
      name: t('viz.timeline.fileSearch', 'File Search'), 
      status: 'completed', 
      time: study.created_at,
      icon: CheckCircle2
    },
    { 
      name: t('viz.timeline.extraction', 'Extração'), 
      status: extractedData ? 'completed' : 'in-progress',
      time: extractedData?.created_at,
      icon: extractedData ? CheckCircle2 : Activity
    },
    { 
      name: t('viz.timeline.analysis', 'Análise'), 
      status: extractedData ? 'completed' : 'pending',
      time: extractedData?.updated_at,
      icon: extractedData ? CheckCircle2 : Clock
    },
  ];

  // Stats cards data
  const statsCards = [
    {
      title: t('viz.stats.nutraceuticals', 'Nutracêuticos'),
      value: nutraceuticals.length,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('viz.stats.conditions', 'Condições'),
      value: conditions.length,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('viz.stats.mechanisms', 'Mecanismos'),
      value: mechanisms.length,
      icon: Network,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('viz.stats.findings', 'Achados'),
      value: findings.length,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualizations */}
      <Tabs value={activeViz} onValueChange={setActiveViz}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            {t('viz.tabs.timeline', 'Timeline')}
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="h-4 w-4 mr-2" />
            {t('viz.tabs.network', 'Rede')}
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('viz.tabs.distribution', 'Distribuição')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('viz.timeline.title', 'Linha do Tempo do Processamento')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`
                      p-2 rounded-full
                      ${step.status === 'completed' ? 'bg-green-100 text-green-600' : ''}
                      ${step.status === 'in-progress' ? 'bg-blue-100 text-blue-600 animate-pulse' : ''}
                      ${step.status === 'pending' ? 'bg-gray-100 text-gray-400' : ''}
                    `}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{step.name}</p>
                        <Badge variant={
                          step.status === 'completed' ? 'default' :
                          step.status === 'in-progress' ? 'secondary' :
                          'outline'
                        }>
                          {step.status === 'completed' && t('viz.status.completed', 'Concluído')}
                          {step.status === 'in-progress' && t('viz.status.inProgress', 'Em andamento')}
                          {step.status === 'pending' && t('viz.status.pending', 'Pendente')}
                        </Badge>
                      </div>
                      {step.time && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(step.time).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('viz.network.title', 'Rede de Relações: Nutracêuticos → Condições')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('viz.network.description', 'Visualização das conexões entre nutracêuticos e condições de saúde')}
              </p>
            </CardHeader>
            <CardContent>
              {networkData.nodes.length > 0 ? (
                <div className="h-[400px]">
                  <NetworkGraph
                    data={networkData}
                    height={400}
                    showControls={true}
                    showLegend={true}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {t('viz.network.noData', 'Dados insuficientes para visualização')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('viz.distribution.title', 'Distribuição de Eficácia')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nutraceuticals.slice(0, 8).map((nutra: any, idx: number) => {
                  const score = nutra.efficacy_score || 3;
                  const percentage = (score / 5) * 100;
                  
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-[70%]">
                          {nutra.name || nutra}
                        </span>
                        <Badge variant="outline">
                          {score.toFixed(1)}/5
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedStudyVisualization;
