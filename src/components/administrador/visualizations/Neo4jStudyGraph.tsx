import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Network, 
  AlertCircle,
  Layers,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import NetworkGraph from './NetworkGraph';

interface Neo4jStudyGraphProps {
  studyId: string;
  studyTitle?: string;
}

interface GraphNode {
  id: string;
  label: string;
  labels: string[];
  properties: Record<string, any>;
}

interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  textContext?: string;
}

// Layer colors for Senex AI hierarchy
const LAYER_COLORS: Record<string, string> = {
  'layer_0_compound': '#3b82f6',     // Blue - Nutraceuticals
  'layer_1_target': '#8b5cf6',       // Purple - Targets/Receptors
  'layer_2_mechanism': '#f59e0b',    // Amber - Mechanisms
  'layer_3_effect': '#10b981',       // Emerald - Effects
  'layer_4_outcome': '#ef4444',      // Red - Outcomes/Conditions
  'Nutraceutical': '#3b82f6',
  'Pathway': '#8b5cf6',
  'Receptor': '#8b5cf6',
  'Enzyme': '#8b5cf6',
  'GeneProtein': '#8b5cf6',
  'Mechanism': '#f59e0b',
  'SignalingCascade': '#f59e0b',
  'BiologicalEffect': '#10b981',
  'SideEffect': '#ec4899',
  'ClinicalOutcome': '#ef4444',
  'Condition': '#ef4444',
  'Disease': '#ef4444',
};

const LAYER_NAMES: Record<string, string> = {
  'layer_0_compound': 'L0: Compostos',
  'layer_1_target': 'L1: Alvos',
  'layer_2_mechanism': 'L2: Mecanismos',
  'layer_3_effect': 'L3: Efeitos',
  'layer_4_outcome': 'L4: Outcomes',
};

const Neo4jStudyGraph: React.FC<Neo4jStudyGraphProps> = ({ studyId, studyTitle }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraphData = useCallback(async () => {
    if (!studyId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Usar queryType 'byStudy' para buscar por study_id no Neo4j
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-search', {
        body: {
          queryType: 'byStudy',
          studyId: studyId,
          maxDepth: 3
        }
      });

      if (fnError) throw fnError;

      if (data?.data) {
        // Transformar dados do formato graph-rag-search para o formato esperado
        const transformedData: GraphData = {
          nodes: data.data.nodes.map((n: any) => ({
            id: n.id,
            label: n.properties?.name || n.label || n.id,
            labels: [n.type || n.label],
            properties: n.properties || {}
          })),
          relationships: data.data.relationships.map((r: any) => ({
            id: `${r.source}-${r.type}-${r.target}`,
            type: r.type,
            startNode: r.source,
            endNode: r.target,
            properties: r.properties || {}
          })),
          textContext: data.data.context
        };
        setGraphData(transformedData);
      } else {
        setGraphData({ nodes: [], relationships: [] });
      }
    } catch (err: any) {
      console.error('Error fetching Neo4j graph:', err);
      setError(err.message || 'Failed to fetch graph data');
      toast({
        title: t('neo4j.errorFetching', 'Error fetching graph'),
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [studyId, toast, t]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Transform Neo4j data to vis-network format
  const transformToVisNetwork = useCallback(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.map(node => {
      const layer = node.properties?.layer || node.labels[0];
      const color = LAYER_COLORS[layer] || LAYER_COLORS[node.labels[0]] || '#6b7280';
      
      return {
        id: node.id,
        label: node.properties?.name || node.label || node.id,
        group: layer,
        color: {
          background: color,
          border: color,
          highlight: { background: color, border: '#1f2937' }
        },
        title: `${node.labels.join(', ')}\n${node.properties?.name || ''}\nLayer: ${layer}`,
        font: { color: '#ffffff' },
        shape: 'box',
        borderWidth: 2,
        margin: 10
      };
    });

    const links = graphData.relationships.map(rel => ({
      from: rel.startNode,
      to: rel.endNode,
      label: rel.type.replace(/_/g, ' '),
      arrows: 'to',
      color: { color: '#9ca3af', highlight: '#4b5563' },
      font: { size: 10, color: '#6b7280' },
      smooth: { type: 'curvedCW', roundness: 0.2 }
    }));

    return { nodes, links };
  }, [graphData]);

  const visData = transformToVisNetwork();

  // Count nodes by layer
  const layerCounts = graphData?.nodes.reduce((acc, node) => {
    const layer = node.properties?.layer || node.labels[0];
    acc[layer] = (acc[layer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const networkOptions = {
    layout: {
      hierarchical: {
        enabled: true,
        direction: 'LR',
        sortMethod: 'directed',
        levelSeparation: 200,
        nodeSpacing: 100
      }
    },
    physics: {
      enabled: false
    },
    edges: {
      smooth: {
        type: 'cubicBezier',
        forceDirection: 'horizontal'
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">
            {t('neo4j.graphTitle', 'Knowledge Graph (Neo4j)')}
          </span>
          {graphData && (
            <Badge variant="secondary">
              {graphData.nodes.length} {t('neo4j.nodes', 'nodes')} • {graphData.relationships.length} {t('neo4j.relations', 'relations')}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchGraphData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Layer Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(LAYER_NAMES).map(([key, name]) => (
          <Badge 
            key={key} 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: LAYER_COLORS[key], color: LAYER_COLORS[key] }}
          >
            <span 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: LAYER_COLORS[key] }}
            />
            {name} ({layerCounts[key] || 0})
          </Badge>
        ))}
      </div>

      {/* Graph or States */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {t('neo4j.loading', 'Loading graph from Neo4j...')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchGraphData}>
                {t('common.tryAgain', 'Try Again')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Info className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">{t('neo4j.noData', 'No graph data available')}</p>
                <p className="text-sm mt-1">
                  {t('neo4j.noDataDesc', 'This study has not been synced to Neo4j yet. Process triplets and sync to see the knowledge graph.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <NetworkGraph
              data={visData}
              height="500px"
              showControls={true}
              showLegend={false}
              customOptions={networkOptions}
            />
          </CardContent>
        </Card>
      )}

      {/* Text Context */}
      {graphData?.textContext && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('neo4j.contextSummary', 'Context Summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {graphData.textContext}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Neo4jStudyGraph;
