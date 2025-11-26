import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NetworkGraph from './NetworkGraph';
import { Network, GitBranch, Activity, Database, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nutraceuticals: number;
  conditions: number;
  mechanisms: number;
  effects: number;
  avgConnections: number;
  topConnected: Array<{ name: string; connections: number }>;
}

export const KnowledgeGraphViewer: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);

      // Consultar Neo4j diretamente via graph-rag-search
      const { data, error } = await supabase.functions.invoke('graph-rag-search', {
        body: {
          queryType: 'cypher',
          cypherQuery: `
            MATCH (n)-[r]->(m)
            RETURN n, r, m
            LIMIT 500
          `
        }
      });

      if (error) throw error;

      if (!data?.success || !data?.data) {
        toast.info('No graph data available from Neo4j');
        setGraphData({ nodes: [], links: [] });
        return;
      }

      const graphResult = data.data;
      const nodeMap = new Map<string, any>();
      const links: any[] = [];

      // Processar nós do Neo4j
      graphResult.nodes.forEach((node: any) => {
        const nodeId = node.id;
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            label: node.properties.name || node.properties.title || node.id,
            type: node.type,
            group: node.type,
            value: 1,
            title: `${node.type}: ${node.properties.name || node.id}`,
            properties: node.properties
          });
        } else {
          const existing = nodeMap.get(nodeId);
          existing.value += 1;
        }
      });

      // Processar relações do Neo4j
      graphResult.relationships.forEach((rel: any) => {
        const sourceNode = nodeMap.get(rel.source);
        const targetNode = nodeMap.get(rel.target);
        
        if (sourceNode && targetNode) {
          const confidence = rel.properties?.confidence || rel.properties?.extraction_confidence || 0.8;
          links.push({
            from: rel.source,
            to: rel.target,
            label: rel.type,
            title: `${rel.type} (Neo4j)`,
            value: confidence,
            color: getEdgeColor(confidence),
            width: 2 + confidence * 2,
            properties: rel.properties
          });
        }
      });

      // Converter mapa para array
      const nodes = Array.from(nodeMap.values()).map(node => ({
        ...node,
        color: getNodeColor(node.type)
      }));

      // Calcular estatísticas
      const stats: GraphStats = {
        totalNodes: nodes.length,
        totalEdges: links.length,
        nutraceuticals: nodes.filter(n => n.type === 'Nutraceutical').length,
        conditions: nodes.filter(n => n.type === 'Condition').length,
        mechanisms: nodes.filter(n => n.type === 'Mechanism').length,
        effects: nodes.filter(n => n.type === 'Effect').length,
        avgConnections: links.length > 0 ? (links.length * 2) / nodes.length : 0,
        topConnected: nodes
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map(n => ({ name: n.label, connections: n.value }))
      };

      setGraphData({ nodes, links });
      setStats(stats);
      toast.success(`Loaded ${nodes.length} nodes from Neo4j`);
    } catch (error: any) {
      toast.error('Error loading graph data from Neo4j');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testNeo4jConnection = async () => {
    try {
      setTestingConnection(true);
      const { data, error } = await supabase.functions.invoke('sync-approved-triplets');
      
      if (error) throw error;
      
      toast.success('Neo4j connection successful!');
    } catch (error: any) {
      toast.error('Failed to connect to Neo4j');
      console.error('Error:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Nutraceutical': '#3b82f6',
      'Condition': '#10b981',
      'Mechanism': '#f59e0b',
      'Effect': '#8b5cf6',
      'Outcome': '#ec4899',
      'Unknown': '#6b7280'
    };
    return colors[type] || colors['Unknown'];
  };

  const getEdgeColor = (confidence: number) => {
    if (confidence >= 0.85) return '#10b981';
    if (confidence >= 0.70) return '#f59e0b';
    return '#ef4444';
  };

  // Aplicar filtros
  const filteredData = {
    nodes: entityFilter === 'all' 
      ? graphData.nodes 
      : graphData.nodes.filter(n => n.type === entityFilter),
    links: graphData.links.filter(l => {
      const sourceNode = graphData.nodes.find(n => n.id === l.from);
      const targetNode = graphData.nodes.find(n => n.id === l.to);
      
      const matchesEntityFilter = entityFilter === 'all' ||
        sourceNode?.type === entityFilter ||
        targetNode?.type === entityFilter;
      
      const matchesConfidence = l.value >= confidenceFilter;
      
      return matchesEntityFilter && matchesConfidence;
    })
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Knowledge Graph Visualization
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testNeo4jConnection}
                disabled={testingConnection}
              >
                <Database className="h-4 w-4 mr-2" />
                Test Neo4j Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadGraphData}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Interactive visualization of the medical knowledge graph
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalNodes}</div>
              <div className="text-sm text-muted-foreground">Total Nodes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalEdges}</div>
              <div className="text-sm text-muted-foreground">Total Relationships</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.nutraceuticals}</div>
              <div className="text-sm text-muted-foreground">Nutraceuticals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.conditions}</div>
              <div className="text-sm text-muted-foreground">Conditions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Nutraceutical">Nutraceuticals</SelectItem>
                  <SelectItem value="Condition">Conditions</SelectItem>
                  <SelectItem value="Mechanism">Mechanisms</SelectItem>
                  <SelectItem value="Effect">Effects</SelectItem>
                  <SelectItem value="Outcome">Outcomes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min Confidence</label>
              <Select value={confidenceFilter.toString()} onValueChange={(v) => setConfidenceFilter(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All (0%)</SelectItem>
                  <SelectItem value="0.5">Medium (50%+)</SelectItem>
                  <SelectItem value="0.7">High (70%+)</SelectItem>
                  <SelectItem value="0.85">Very High (85%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Showing {filteredData.nodes.length} nodes, {filteredData.links.length} edges
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Loading graph...</div>
              </div>
            </div>
          ) : filteredData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-lg font-medium mb-2">No graph data available</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Approve and sync some triplets to visualize the knowledge graph
                </div>
              </div>
            </div>
          ) : (
            <NetworkGraph
              data={filteredData}
              height="600px"
              showControls={true}
              showLegend={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Top Connected */}
      {stats && stats.topConnected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Top Connected Entities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topConnected.map((entity, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{entity.name}</span>
                  <Badge variant="outline">{entity.connections} connections</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KnowledgeGraphViewer;
