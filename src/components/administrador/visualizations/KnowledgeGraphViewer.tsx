import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import NetworkGraph from './NetworkGraph';
import KnowledgeGraphDataSources from './KnowledgeGraphDataSources';
import { Network, GitBranch, Activity, Database, RefreshCcw, Filter, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nutraceuticals: number;
  conditions: number;
  mechanisms: number;
  effects: number;
  avgConnections: number;
  positiveRelations: number;
  negativeRelations: number;
  topConnected: Array<{ name: string; connections: number }>;
}

interface StudyOption {
  id: string;
  title: string;
  tripletCount: number;
  lastSyncedAt: string | null;
}

interface DataSourceStats {
  ontologyEntities: number;
  tripletCount: number;
  knownRelations: number;
  studyContributions: Array<{
    id: string;
    title: string;
    tripletCount: number;
    lastSyncedAt: string | null;
    status: 'synced' | 'partial' | 'pending';
  }>;
}

export const KnowledgeGraphViewer: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);
  const [relationFilter, setRelationFilter] = useState<string>('all');
  const [studyFilter, setStudyFilter] = useState<string>('all');
  const [studyOptions, setStudyOptions] = useState<StudyOption[]>([]);
  const [dataSourceStats, setDataSourceStats] = useState<DataSourceStats>({
    ontologyEntities: 0,
    tripletCount: 0,
    knownRelations: 0,
    studyContributions: []
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingDataSources, setLoadingDataSources] = useState(true);

  useEffect(() => {
    loadGraphData();
    loadDataSourceStats();
  }, []);

  useEffect(() => {
    if (studyFilter !== 'all') {
      loadGraphDataByStudy(studyFilter);
    } else {
      loadGraphData();
    }
  }, [studyFilter]);

  const loadDataSourceStats = async () => {
    try {
      setLoadingDataSources(true);

      // Get ontology entity count
      const { count: ontologyCount } = await supabase
        .from('veterinary_ontology')
        .select('*', { count: 'exact', head: true });

      // Get triplets synced to Neo4j grouped by study
      const { data: syncedTriplets } = await supabase
        .from('triplet_extractions')
        .select(`
          id,
          study_id,
          synced_to_neo4j,
          synced_at,
          curation_status,
          processed_studies!inner(id, title)
        `)
        .eq('synced_to_neo4j', true);

      // Group by study
      const studyMap = new Map<string, {
        id: string;
        title: string;
        count: number;
        lastSyncedAt: string | null;
        allApproved: boolean;
      }>();

      syncedTriplets?.forEach((triplet: any) => {
        const studyId = triplet.study_id;
        const existing = studyMap.get(studyId);
        if (existing) {
          existing.count++;
          if (triplet.synced_at && (!existing.lastSyncedAt || triplet.synced_at > existing.lastSyncedAt)) {
            existing.lastSyncedAt = triplet.synced_at;
          }
          if (triplet.curation_status !== 'approved') {
            existing.allApproved = false;
          }
        } else {
          studyMap.set(studyId, {
            id: studyId,
            title: triplet.processed_studies?.title || 'Unknown Study',
            count: 1,
            lastSyncedAt: triplet.synced_at,
            allApproved: triplet.curation_status === 'approved'
          });
        }
      });

      const studyContributions = Array.from(studyMap.values()).map(s => ({
        id: s.id,
        title: s.title,
        tripletCount: s.count,
        lastSyncedAt: s.lastSyncedAt,
        status: s.allApproved ? 'synced' as const : 'partial' as const
      }));

      // Set study options for filter
      setStudyOptions(studyContributions.map(s => ({
        id: s.id,
        title: s.title,
        tripletCount: s.tripletCount,
        lastSyncedAt: s.lastSyncedAt
      })));

      // Estimate known relations (hardcoded in sync function)
      const knownRelationsEstimate = 24;

      setDataSourceStats({
        ontologyEntities: ontologyCount || 0,
        tripletCount: syncedTriplets?.length || 0,
        knownRelations: knownRelationsEstimate,
        studyContributions
      });

    } catch (error) {
      console.error('Error loading data source stats:', error);
    } finally {
      setLoadingDataSources(false);
    }
  };

  const loadGraphDataByStudy = async (studyId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('graph-rag-search', {
        body: {
          queryType: 'byStudy',
          studyId: studyId
        }
      });

      if (error) throw error;

      if (!data?.success || !data?.data) {
        toast.info('No graph data available for this study');
        setGraphData({ nodes: [], links: [] });
        return;
      }

      processGraphResult(data.data, 'study');
    } catch (error: any) {
      toast.error('Error loading graph data for study');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGraphData = async () => {
    try {
      setLoading(true);

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

      processGraphResult(data.data, 'all');
      toast.success(`Loaded ${data.data.nodes.length} nodes from Neo4j`);
    } catch (error: any) {
      toast.error('Error loading graph data from Neo4j');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processGraphResult = (graphResult: any, source: 'all' | 'study') => {
    const nodeMap = new Map<string, any>();
    const links: any[] = [];

    // Process nodes
    graphResult.nodes.forEach((node: any) => {
      const nodeId = node.id;
      if (!nodeMap.has(nodeId)) {
        // Determine if node is from ontology or study extraction
        const isFromStudy = node.properties?.study_id || node.properties?.triplet_id;
        const nodeSource = isFromStudy ? 'study' : 'ontology';
        
        nodeMap.set(nodeId, {
          id: nodeId,
          label: node.properties.name || node.properties.title || node.id,
          type: node.type,
          group: node.type,
          value: 1,
          title: `${node.type}: ${node.properties.name || node.id}\n[Source: ${nodeSource}]`,
          properties: node.properties,
          source: nodeSource
        });
      } else {
        const existing = nodeMap.get(nodeId);
        existing.value += 1;
      }
    });

    // Process relationships
    graphResult.relationships.forEach((rel: any) => {
      const sourceNode = nodeMap.get(rel.source);
      const targetNode = nodeMap.get(rel.target);
      
      if (sourceNode && targetNode) {
        const confidence = rel.properties?.confidence || rel.properties?.extraction_confidence || 0.8;
        const direction = rel.properties?.direction || 'positive';
        const isNegative = direction === 'negative' || direction === 'worsens' || 
          ['WORSENS', 'CAUSES_SIDE_EFFECT', 'CONTRAINDICATED_FOR', 'AGGRAVATES'].includes(rel.type);
        
        // Determine relationship source
        const relSource = rel.properties?.study_id ? 'study' : 
                         rel.properties?.source === 'ontology' ? 'ontology' : 'known';
        
        links.push({
          from: rel.source,
          to: rel.target,
          label: rel.type,
          title: `${rel.type} ${isNegative ? '⚠️ Negative' : '✓ Positive'} (${Math.round(confidence * 100)}%)\n[Source: ${relSource}]`,
          value: confidence,
          color: getEdgeColor(confidence, isNegative, relSource),
          width: 2 + confidence * 2,
          dashes: isNegative ? [5, 5] : false,
          properties: rel.properties,
          direction: direction,
          isNegative: isNegative,
          source: relSource
        });
      }
    });

    // Convert map to array with colors based on source
    const nodes = Array.from(nodeMap.values()).map(node => ({
      ...node,
      color: getNodeColor(node.type, node.source)
    }));

    // Calculate stats
    const negativeLinks = links.filter(l => l.isNegative);
    const positiveLinks = links.filter(l => !l.isNegative);
    
    const stats: GraphStats = {
      totalNodes: nodes.length,
      totalEdges: links.length,
      nutraceuticals: nodes.filter(n => n.type === 'Nutraceutical').length,
      conditions: nodes.filter(n => n.type === 'Condition').length,
      mechanisms: nodes.filter(n => n.type === 'Mechanism').length,
      effects: nodes.filter(n => n.type === 'Effect').length,
      avgConnections: links.length > 0 ? (links.length * 2) / nodes.length : 0,
      positiveRelations: positiveLinks.length,
      negativeRelations: negativeLinks.length,
      topConnected: nodes
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(n => ({ name: n.label, connections: n.value }))
    };

    setGraphData({ nodes, links });
    setStats(stats);
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

  const getNodeColor = (type: string, source?: string) => {
    // Base colors by type
    const typeColors: Record<string, { base: string; study: string }> = {
      'Nutraceutical': { base: '#3b82f6', study: '#22c55e' },
      'Condition': { base: '#10b981', study: '#22c55e' },
      'Mechanism': { base: '#f59e0b', study: '#22c55e' },
      'Effect': { base: '#8b5cf6', study: '#22c55e' },
      'Outcome': { base: '#ec4899', study: '#22c55e' },
      'Unknown': { base: '#6b7280', study: '#22c55e' }
    };
    
    const colors = typeColors[type] || typeColors['Unknown'];
    
    // If from study, use green-tinted version
    if (source === 'study') {
      return {
        background: colors.study,
        border: '#16a34a',
        highlight: { background: '#4ade80', border: '#16a34a' }
      };
    }
    
    return colors.base;
  };

  const getEdgeColor = (confidence: number, isNegative: boolean = false, source?: string) => {
    // If from study, tint green
    if (source === 'study' && !isNegative) {
      if (confidence >= 0.85) return '#16a34a';
      if (confidence >= 0.70) return '#22c55e';
      return '#4ade80';
    }
    
    // Negative relations
    if (isNegative) {
      if (confidence >= 0.85) return '#dc2626';
      if (confidence >= 0.70) return '#ea580c';
      return '#f87171';
    }
    
    // Positive relations
    if (confidence >= 0.85) return '#10b981';
    if (confidence >= 0.70) return '#f59e0b';
    return '#6b7280';
  };

  // Apply filters
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
      
      const matchesRelationType = relationFilter === 'all' ||
        (relationFilter === 'positive' && !l.isNegative) ||
        (relationFilter === 'negative' && l.isNegative);
      
      return matchesEntityFilter && matchesConfidence && matchesRelationType;
    })
  };

  const handleStudyClick = (studyId: string) => {
    setStudyFilter(studyId);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header Row: Title + Data Sources + Stats */}
        <div className="flex flex-wrap items-stretch gap-3">
          {/* Data Sources Compact */}
          <Card className="flex-shrink-0">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{t('knowledgeGraph.dataSources.title', 'Data Sources')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold text-blue-600">{dataSourceStats.ontologyEntities}</div>
                        <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.dataSources.ontology', 'Ontology')}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px]">
                      <p>{t('knowledgeGraph.tooltips.ontology', 'Base entities from veterinary ontology (nutraceuticals, conditions, mechanisms)')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold text-green-600">{dataSourceStats.tripletCount}</div>
                        <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.dataSources.triplets', 'From Studies')}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px]">
                      <p>{t('knowledgeGraph.tooltips.fromStudies', 'Triplets automatically extracted from scientific studies by AI')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold text-amber-600">{dataSourceStats.knownRelations}</div>
                        <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.dataSources.known', 'Known')}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px]">
                      <p>{t('knowledgeGraph.tooltips.knownRelations', 'Pre-defined high-confidence relationships based on established literature')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {/* Legend badges */}
                <div className="hidden xl:flex items-center gap-2 border-l pl-3 ml-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 text-[10px] py-0 cursor-help">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                        Ontology
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{t('knowledgeGraph.tooltips.legendOntology', 'Nodes derived from the system base ontology')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-[10px] py-0 cursor-help">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                        Study
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{t('knowledgeGraph.tooltips.legendStudy', 'Nodes automatically extracted from scientific studies')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] py-0 cursor-help">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                        Known
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{t('knowledgeGraph.tooltips.legendKnown', 'Known and pre-defined relationships with high confidence')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {stats && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold">{stats.totalNodes}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.totalNodes', 'Nodes')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.totalNodes', 'Total unique entities in the graph')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold">{stats.totalEdges}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.totalRelations', 'Relations')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.totalRelations', 'Total connections between entities in the graph')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold text-green-600">{stats.positiveRelations}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.positive', 'Positive')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.positiveRelations', 'Beneficial relations: treatments, improvements, therapeutic support')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold text-red-600">{stats.negativeRelations}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.negative', 'Negative')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.negativeRelations', 'Adverse relations: contraindications, symptom worsening, side effects')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold">{stats.nutraceuticals}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.nutraceuticals', 'Nutraceuticals')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.nutraceuticals', 'Bioactive substances with therapeutic potential')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex-shrink-0 cursor-help">
                    <CardContent className="py-3 px-4 text-center">
                      <div className="text-lg font-bold">{stats.conditions}</div>
                      <div className="text-[10px] text-muted-foreground">{t('knowledgeGraph.stats.conditions', 'Conditions')}</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.conditions', 'Diseases, symptoms or treatable health states')}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testNeo4jConnection}
                  disabled={testingConnection}
                >
                  <Database className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Test</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[250px]">
                <p>{t('knowledgeGraph.tooltips.testConnection', 'Test connection with Neo4j graph database')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStudyFilter('all');
                    loadGraphData();
                    loadDataSourceStats();
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[250px]">
                <p>{t('knowledgeGraph.tooltips.refresh', 'Reload all graph data')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters Row */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Study Filter */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={studyFilter} onValueChange={setStudyFilter}>
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder={t('knowledgeGraph.filters.allStudies', 'All Studies')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('knowledgeGraph.filters.allStudies', 'All Studies')}
                        </SelectItem>
                        {studyOptions.map(study => (
                          <SelectItem key={study.id} value={study.id}>
                            <span className="truncate max-w-[150px]">
                              {study.title.length > 25 ? `${study.title.substring(0, 25)}...` : study.title}
                            </span>
                            <Badge variant="secondary" className="ml-1 text-[10px]">
                              {study.tripletCount}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px]">
                  <p>{t('knowledgeGraph.tooltips.studyFilter', 'Show only data extracted from a specific study')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Entity Type */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('knowledgeGraph.filters.allTypes', 'All Types')}</SelectItem>
                        <SelectItem value="Nutraceutical">{t('knowledgeGraph.filters.nutraceuticals', 'Nutraceuticals')}</SelectItem>
                        <SelectItem value="Condition">{t('knowledgeGraph.filters.conditions', 'Conditions')}</SelectItem>
                        <SelectItem value="Mechanism">{t('knowledgeGraph.filters.mechanisms', 'Mechanisms')}</SelectItem>
                        <SelectItem value="Effect">{t('knowledgeGraph.filters.effects', 'Effects')}</SelectItem>
                        <SelectItem value="Outcome">{t('knowledgeGraph.filters.outcomes', 'Outcomes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.entityFilter', 'Filter by entity category')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Relation Type */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={relationFilter} onValueChange={setRelationFilter}>
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('knowledgeGraph.filters.allRelations', 'All Relations')}</SelectItem>
                        <SelectItem value="positive">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Positive
                          </span>
                        </SelectItem>
                        <SelectItem value="negative">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Negative
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                  <p>{t('knowledgeGraph.tooltips.relationFilter', 'Filter by relation nature')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Min Confidence */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={confidenceFilter.toString()} onValueChange={(v) => setConfidenceFilter(parseFloat(v))}>
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('knowledgeGraph.filters.all', 'All (0%)')}</SelectItem>
                        <SelectItem value="0.5">{t('knowledgeGraph.filters.medium', 'Medium (50%+)')}</SelectItem>
                        <SelectItem value="0.7">{t('knowledgeGraph.filters.high', 'High (70%+)')}</SelectItem>
                        <SelectItem value="0.85">{t('knowledgeGraph.filters.veryHigh', 'Very High (85%+)')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px]">
                  <p>{t('knowledgeGraph.tooltips.confidenceFilter', 'Filter by extraction confidence level')}</p>
                </TooltipContent>
              </Tooltip>

            {/* Results count */}
            <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <span>
                {t('knowledgeGraph.filters.showing', 'Showing')} <strong>{filteredData.nodes.length}</strong> {t('knowledgeGraph.filters.nodes', 'nodes')}, <strong>{filteredData.links.length}</strong> {t('knowledgeGraph.filters.edges', 'edges')}
              </span>
              {studyFilter !== 'all' && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 text-[10px]">
                  Study filter
                </Badge>
              )}
              {relationFilter === 'negative' && (
                <Badge variant="outline" className="bg-red-500/10 text-red-700 text-[10px]">
                  ⚠️ Negative
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph - Full Width */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-320px)] min-h-[500px]">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">{t('knowledgeGraph.loading', 'Loading graph...')}</div>
              </div>
            </div>
          ) : filteredData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-[calc(100vh-320px)] min-h-[500px]">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-lg font-medium mb-2">{t('knowledgeGraph.empty.title', 'No graph data available')}</div>
                <div className="text-sm text-muted-foreground mb-4">
                  {t('knowledgeGraph.empty.description', 'Approve and sync some triplets to visualize the knowledge graph')}
                </div>
              </div>
            </div>
          ) : (
            <NetworkGraph
              data={filteredData}
              height="calc(100vh - 320px)"
              showControls={true}
              showLegend={false}
            />
          )}
        </CardContent>
      </Card>

        {/* Top Connected - Inline at bottom */}
        {stats && stats.topConnected.length > 0 && (
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-6 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help">
                      <GitBranch className="h-4 w-4" />
                      {t('knowledgeGraph.topConnected', 'Top Connected')}:
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <p>{t('knowledgeGraph.tooltips.topConnected', 'Entities with the most connections in the graph, indicating high relevance')}</p>
                  </TooltipContent>
                </Tooltip>
                {stats.topConnected.map((entity, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm">{entity.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{entity.connections}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default KnowledgeGraphViewer;
