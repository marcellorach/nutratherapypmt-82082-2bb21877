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
  CheckCircle2,
  Database,
  Cpu
} from 'lucide-react';
import NetworkGraph from '../../visualizations/NetworkGraph';
import BiologicalNetworkGraph from '../../visualizations/biological/BiologicalNetworkGraph';
import { buildBiologicalNetworkData } from '../../visualizations/biological/dataBuilder';
import Neo4jStudyGraph from '../../visualizations/Neo4jStudyGraph';
import { useTranslation } from 'react-i18next';
import { normalizeScore, toDisplayScale, toPercentage, getScoreColorClass } from '@/utils/score-normalization';

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

  // Extract data for visualizations (CORRIGIDO - usar campos corretos)
  const nutraceuticals = extractedData?.extractedNutraceuticals || 
                        study.analysis_data?.extractedNutraceuticals || [];
  const conditions = extractedData?.extractedConditions || 
                    study.analysis_data?.extractedConditions || [];
  const interactions = extractedData?.extractedInteractions || 
                      study.analysis_data?.extractedInteractions || [];
  const sideEffects = extractedData?.extractedSideEffects || 
                     study.analysis_data?.extractedSideEffects || [];
  const findings = extractedData?.findings || study.analysis_data?.findings || [];
  const mechanisms = extractedData?.mechanisms || study.analysis_data?.mechanisms || [];

  // Build biological network data (hierárquico e científico)
  const biologicalNetworkData = buildBiologicalNetworkData({
    extractedNutraceuticals: nutraceuticals,
    extractedConditions: conditions,
    extractedInteractions: interactions,
    extractedSideEffects: sideEffects
  });

  // Legacy network data (mantido para compatibilidade)
  const buildNetworkData = () => {
    const nodes: any[] = [];
    const links: any[] = [];
    
    nutraceuticals.forEach((nutra: any, idx: number) => {
      const normalized = normalizeScore(nutra.confidence || nutra.efficacy_score);
      nodes.push({
        id: `nutra-${idx}`,
        label: nutra.name || nutra,
        group: 'nutraceutical',
        value: toDisplayScale(normalized),
        title: `Confiança: ${toPercentage(nutra.confidence || nutra.efficacy_score).toFixed(0)}%`
      });
    });

    conditions.forEach((cond: any, idx: number) => {
      const normalized = normalizeScore(cond.confidence);
      nodes.push({
        id: `cond-${idx}`,
        label: cond.name || cond,
        group: 'condition',
        value: toDisplayScale(normalized),
        title: `Confiança: ${toPercentage(cond.confidence).toFixed(0)}%`
      });
    });

    interactions.forEach((interaction: any, idx: number) => {
      if (!interaction?.interaction) return;
      
      const nutraIdx = nutraceuticals.findIndex((n: any) => 
        (n?.name || n) === interaction.nutraceutical
      );
      const condName = interaction.interaction.toLowerCase();
      const condIdx = conditions.findIndex((c: any) => {
        const name = c?.name || (typeof c === 'string' ? c : '');
        return name && condName.includes(name.toLowerCase());
      });
      
      if (nutraIdx >= 0 && condIdx >= 0) {
        const normalized = normalizeScore(interaction.confidence);
        links.push({
          source: `nutra-${nutraIdx}`,
          target: `cond-${condIdx}`,
          value: toDisplayScale(normalized),
          label: interaction.interaction.substring(0, 30) + '...',
          title: interaction.interaction
        });
      }
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
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            {t('viz.tabs.timeline', 'Timeline')}
          </TabsTrigger>
          <TabsTrigger value="local-network">
            <Cpu className="h-4 w-4 mr-2" />
            {t('viz.tabs.localNetwork', 'Extração')}
          </TabsTrigger>
          <TabsTrigger value="neo4j-graph">
            <Database className="h-4 w-4 mr-2" />
            {t('viz.tabs.neo4jGraph', 'Neo4j')}
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

        <TabsContent value="local-network" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                {t('viz.localNetwork.title', 'Extração Local (LLM)')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('viz.localNetwork.description', 'Dados extraídos diretamente do estudo via LLM - útil para revisão antes de sincronizar')}
              </p>
            </CardHeader>
            <CardContent>
              {biologicalNetworkData.nodes.length > 0 ? (
                <BiologicalNetworkGraph
                  data={biologicalNetworkData}
                  height="600px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {t('viz.network.noData', 'Dados insuficientes para visualização')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neo4j-graph" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                {t('viz.neo4jGraph.title', 'Knowledge Graph (Neo4j)')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('viz.neo4jGraph.description', 'Grafo hierárquico Senex AI com relações reais sincronizadas')}
              </p>
            </CardHeader>
            <CardContent>
              <Neo4jStudyGraph 
                studyId={study.id || study.study_id} 
                studyTitle={study.title}
              />
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
                  // Normalize: handle both 0-1 and 0-5 scales from Gemini
                  const rawConfidence = nutra.confidence || nutra.efficacy_score || 0.5;
                  const normalized = normalizeScore(rawConfidence);
                  const score = toDisplayScale(normalized);
                  const percentage = toPercentage(rawConfidence);
                  
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
                          className={`h-2 rounded-full transition-all ${getScoreColorClass(percentage)}`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
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
