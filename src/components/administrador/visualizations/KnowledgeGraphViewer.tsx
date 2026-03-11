import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import NetworkGraph from './NetworkGraph';
import KnowledgeGraphDataSources from './KnowledgeGraphDataSources';
import { KnowledgeGraphStatDialog } from './KnowledgeGraphStatDialog';
import { TripletBankDialog } from './kg-stats/TripletBankDialog';
import { KnowledgeGraphChat } from './KnowledgeGraphChat';
import { NodeDetailsSidebar, NodeDetailsData } from './graph/NodeDetailsSidebar';
import { GraphLimitSlider } from './GraphLimitSlider';
import { KnowledgeGraph3D } from './KnowledgeGraph3D';
import { KnowledgeGraphStatsSection } from './kg-stats';
import { EnrichKnowledgeGraphDialog } from './EnrichKnowledgeGraphDialog';
import { Network, GitBranch, Activity, Database, RefreshCcw, Filter, HelpCircle, FileText, X, Calendar, CheckCircle2, AlertCircle, BookOpen, MessageCircle, MousePointerClick, ExternalLink, Box, Square, Sparkles } from 'lucide-react';
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

interface StudyDetails {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  tripletCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  lastSyncedAt: string | null;
  extractedEntities: {
    nutraceuticals: string[];
    conditions: string[];
    mechanisms: string[];
    effects: string[];
  };
  topRelations: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }>;
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
  const [studyPanelOpen, setStudyPanelOpen] = useState(false);
  const [selectedStudyDetails, setSelectedStudyDetails] = useState<StudyDetails | null>(null);
  const [loadingStudyDetails, setLoadingStudyDetails] = useState(false);
  
  // New states for dialogs, chat and node details
  const [statDialogOpen, setStatDialogOpen] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState<'ontology' | 'studies' | 'nodes' | 'edges' | 'positive' | 'negative' | 'nutraceuticals' | 'conditions' | 'pathways' | 'outcomes' | 'chebi' | 'entities-ai' | 'relations-ai' | 'approved-triplets' | 'pending-triplets'>('ontology');
  const [chatOpen, setChatOpen] = useState(false);
  const [nodeDetailsSidebarOpen, setNodeDetailsSidebarOpen] = useState(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<NodeDetailsData | null>(null);
  
  // New states for configurable limit and 3D toggle
  const [edgeLimit, setEdgeLimit] = useState(2000);
  const [enrichDialogOpen, setEnrichDialogOpen] = useState(false);
  const [use3DGraph, setUse3DGraph] = useState(false);

  // Load data sources once on mount
  useEffect(() => {
    loadDataSourceStats();
  }, []);

  // Load graph data with debounce when edgeLimit changes
  useEffect(() => {
    if (studyFilter !== 'all') return; // study filter has its own useEffect
    const timer = setTimeout(() => {
      loadGraphData();
    }, 500);
    return () => clearTimeout(timer);
  }, [edgeLimit]);

  useEffect(() => {
    if (studyFilter !== 'all') {
      loadGraphDataByStudy(studyFilter);
      loadStudyDetails(studyFilter);
      setStudyPanelOpen(true);
    } else {
      loadGraphData();
      setStudyPanelOpen(false);
      setSelectedStudyDetails(null);
    }
  }, [studyFilter]);

  const loadStudyDetails = async (studyId: string) => {
    try {
      setLoadingStudyDetails(true);
      
      // Get study info
      const { data: studyData } = await supabase
        .from('processed_studies')
        .select('id, title, description, authors, journal, year')
        .eq('id', studyId)
        .single();
      
      if (!studyData) return;
      
      // Get all triplets for this study with their status
      const { data: triplets } = await supabase
        .from('triplet_extractions')
        .select('subject_name, subject_type, predicate, object_name, object_type, curation_status, extraction_confidence, synced_at')
        .eq('study_id', studyId);
      
      const approvedCount = triplets?.filter(t => t.curation_status === 'approved').length || 0;
      const pendingCount = triplets?.filter(t => t.curation_status === 'pending').length || 0;
      const rejectedCount = triplets?.filter(t => t.curation_status === 'rejected').length || 0;
      
      // Extract unique entities by type
      const nutraceuticals = new Set<string>();
      const conditions = new Set<string>();
      const mechanisms = new Set<string>();
      const effects = new Set<string>();
      
      triplets?.forEach(t => {
        [{ name: t.subject_name, type: t.subject_type }, { name: t.object_name, type: t.object_type }].forEach(entity => {
          if (entity.type === 'nutraceutical') nutraceuticals.add(entity.name);
          else if (entity.type === 'condition') conditions.add(entity.name);
          else if (entity.type === 'mechanism') mechanisms.add(entity.name);
          else if (entity.type === 'biological_effect') effects.add(entity.name);
        });
      });
      
      // Get top approved relations
      const topRelations = triplets
        ?.filter(t => t.curation_status === 'approved')
        .sort((a, b) => (b.extraction_confidence || 0) - (a.extraction_confidence || 0))
        .slice(0, 5)
        .map(t => ({
          subject: t.subject_name,
          predicate: t.predicate,
          object: t.object_name,
          confidence: t.extraction_confidence || 0
        })) || [];
      
      const lastSyncedAt = triplets?.find(t => t.synced_at)?.synced_at || null;
      
      setSelectedStudyDetails({
        id: studyData.id,
        title: studyData.title || 'Untitled Study',
        description: studyData.description || undefined,
        authors: studyData.authors || undefined,
        journal: studyData.journal || undefined,
        year: studyData.year || undefined,
        tripletCount: triplets?.length || 0,
        approvedCount,
        pendingCount,
        rejectedCount,
        lastSyncedAt,
        extractedEntities: {
          nutraceuticals: Array.from(nutraceuticals),
          conditions: Array.from(conditions),
          mechanisms: Array.from(mechanisms),
          effects: Array.from(effects)
        },
        topRelations
      });
      
    } catch (error) {
      console.error('Error loading study details:', error);
    } finally {
      setLoadingStudyDetails(false);
    }
  };

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
        toast.info(t('knowledgeGraph.toast.noDataStudy'));
        setGraphData({ nodes: [], links: [] });
        return;
      }

      processGraphResult(data.data, 'study');
    } catch (error: any) {
      toast.error(t('knowledgeGraph.toast.errorLoadStudy'));
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
            LIMIT ${edgeLimit}
          `
        }
      });

      if (error) throw error;

      if (!data?.success || !data?.data) {
        toast.info(t('knowledgeGraph.toast.noDataNeo4j'));
        setGraphData({ nodes: [], links: [] });
        return;
      }

      processGraphResult(data.data, 'all');
      toast.success(t('knowledgeGraph.toast.loadedNodes', { count: data.data.nodes.length }));
    } catch (error: any) {
      toast.error(t('knowledgeGraph.toast.errorLoadNeo4j'));
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processGraphResult = (graphResult: any, source: 'all' | 'study') => {
    const nodeMap = new Map<string, any>();
    const links: any[] = [];

    console.log('📊 processGraphResult input:', {
      nodesCount: graphResult.nodes?.length || 0,
      relationshipsCount: graphResult.relationships?.length || 0,
      sampleNode: graphResult.nodes?.[0],
      sampleRelationship: graphResult.relationships?.[0]
    });

    // Process nodes - build a map for fast lookups
    (graphResult.nodes || []).forEach((node: any) => {
      const nodeId = String(node.id);
      if (!nodeMap.has(nodeId)) {
        // Determine if node is from ontology or study extraction
        const isFromStudy = node.properties?.study_id || node.properties?.triplet_id;
        const nodeSource = isFromStudy ? 'study' : 'ontology';
        
        nodeMap.set(nodeId, {
          id: nodeId,
          label: node.label || node.properties?.name || node.properties?.title || nodeId,
          type: node.type,
          group: node.type,
          value: 1,
          title: `${node.type}: ${node.label || node.properties?.name || nodeId}\n[Source: ${nodeSource}]`,
          properties: node.properties || {},
          source: nodeSource
        });
      } else {
        const existing = nodeMap.get(nodeId);
        existing.value += 1;
      }
    });

    console.log(`📊 Nodes processed: ${nodeMap.size}`);

    // Process relationships - using nodeMap for O(1) lookups
    // Support both 'relationships' array and alternative formats
    const relationships = graphResult.relationships || [];
    
    relationships.forEach((rel: any) => {
      // Support both source/target (from backend) and from/to formats
      const sourceId = String(rel.source || rel.from || '');
      const targetId = String(rel.target || rel.to || '');
      
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);
      
      if (sourceNode && targetNode) {
        const confidence = rel.properties?.confidence || rel.properties?.extraction_confidence || 0.8;
        const direction = rel.properties?.direction || 'positive';
        const isNegative = direction === 'negative' || direction === 'worsens' || 
          ['WORSENS', 'CAUSES_SIDE_EFFECT', 'CONTRAINDICATED_FOR', 'AGGRAVATES'].includes(rel.type);
        
        // Determine relationship source
        const relSource = rel.properties?.study_id ? 'study' : 
                         rel.properties?.source === 'ontology' ? 'ontology' : 'known';
        
        links.push({
          from: sourceId,
          to: targetId,
          // Also include source/target for 3D graph compatibility
          source: sourceId,
          target: targetId,
          label: rel.type,
          title: `${rel.type} ${isNegative ? '⚠️ Negative' : '✓ Positive'} (${Math.round(confidence * 100)}%)\n[Source: ${relSource}]`,
          value: confidence,
          color: getEdgeColor(confidence, isNegative, relSource),
          width: 2 + confidence * 2,
          dashes: isNegative ? [5, 5] : false,
          properties: rel.properties || {},
          direction: direction,
          isNegative: isNegative,
          relSource: relSource
        });
      } else {
        console.log(`  ⚠️ Skipped relationship: source=${sourceId} (exists: ${!!sourceNode}), target=${targetId} (exists: ${!!targetNode})`);
      }
    });

    console.log(`📊 Links processed: ${links.length} (from ${relationships.length} relationships)`);

    // Calculate real connection counts from edges
    const connectionCounts = new Map<string, number>();
    links.forEach(link => {
      connectionCounts.set(link.from, (connectionCounts.get(link.from) || 0) + 1);
      connectionCounts.set(link.to, (connectionCounts.get(link.to) || 0) + 1);
    });

    // Convert map to array with colors based on source and real connection counts
    const nodes = Array.from(nodeMap.values()).map(node => ({
      ...node,
      color: getNodeColor(node.type, node.source),
      connections: connectionCounts.get(node.id) || 0
    }));

    // Calculate stats
    const negativeLinks = links.filter(l => l.isNegative);
    const positiveLinks = links.filter(l => !l.isNegative);
    
    const stats: GraphStats = {
      totalNodes: nodes.length,
      totalEdges: links.length,
      nutraceuticals: nodes.filter(n => n.type?.toLowerCase() === 'nutraceutical').length,
      conditions: nodes.filter(n => n.type?.toLowerCase() === 'condition').length,
      mechanisms: nodes.filter(n => n.type?.toLowerCase() === 'mechanism').length,
      effects: nodes.filter(n => n.type?.toLowerCase() === 'effect' || n.type?.toLowerCase() === 'biological_effect').length,
      avgConnections: nodes.length > 0 ? (links.length * 2) / nodes.length : 0,
      positiveRelations: positiveLinks.length,
      negativeRelations: negativeLinks.length,
      topConnected: nodes
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 5)
        .map(n => ({ name: n.label, connections: n.connections }))
    };

    console.log('📊 Final stats:', stats);

    setGraphData({ nodes, links });
    setStats(stats);
  };

  const testNeo4jConnection = async () => {
    try {
      setTestingConnection(true);
      const { data, error } = await supabase.functions.invoke('sync-approved-triplets');
      
      if (error) throw error;
      
      toast.success(t('knowledgeGraph.toast.connectionSuccess'));
    } catch (error: any) {
      toast.error(t('knowledgeGraph.toast.connectionFailed'));
      console.error('Error:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const getNodeColor = (type: string, source?: string) => {
    // Normalizar tipo para lowercase para comparações consistentes
    const normalizedType = type?.toLowerCase() || 'unknown';
    
    // Paleta sincronizada com KnowledgeGraph3D.tsx
    const NODE_COLORS: Record<string, string> = {
      nutraceutical: '#22c55e',    // Verde vibrante
      compound: '#eab308',         // Amarelo dourado
      drug: '#3b82f6',             // Azul médio
      condition: '#f97316',        // Laranja
      disease: '#991b1b',          // Vermelho escuro
      mechanism: '#1e3a5f',        // Azul escuro
      effect: '#06b6d4',           // Ciano
      biological_effect: '#71717a', // Cinza
      biologicalprocess: '#14b8a6', // Teal
      target: '#0ea5e9',           // Sky blue
      pathway: '#10b981',          // Emerald
      receptor: '#6366f1',         // Indigo
      enzyme: '#f43f5e',           // Rose
      gene: '#a855f7',             // Purple
      protein: '#84cc16',          // Lime
      outcome: '#d946ef',          // Fuchsia
      gene_protein: '#0ea5e9',     // Sky blue
      unknown: '#64748b',          // Slate
    };
    
    const baseColor = NODE_COLORS[normalizedType] || NODE_COLORS['unknown'];
    
    // Para nós de estudo, usar borda diferenciada
    if (source === 'study') {
      return {
        background: baseColor,
        border: '#16a34a',
        highlight: { background: baseColor, border: '#16a34a' }
      };
    }
    
    // Return consistent object format for non-study sources too
    return {
      background: baseColor,
      border: baseColor,
      highlight: { background: baseColor, border: baseColor }
    };
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

  // Apply filters - usando comparação case-insensitive para consistência
  const filteredData = {
    nodes: entityFilter === 'all' 
      ? graphData.nodes 
      : graphData.nodes.filter(n => n.type?.toLowerCase() === entityFilter.toLowerCase()),
    links: graphData.links.filter(l => {
      const sourceNode = graphData.nodes.find(n => n.id === l.from);
      const targetNode = graphData.nodes.find(n => n.id === l.to);
      
      const matchesEntityFilter = entityFilter === 'all' ||
        sourceNode?.type?.toLowerCase() === entityFilter.toLowerCase() ||
        targetNode?.type?.toLowerCase() === entityFilter.toLowerCase();
      
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

  const openStatDialog = (cardId: string) => {
    const cardIdToStatType: Record<string, typeof selectedStatType> = {
      'ontology-manual': 'ontology',
      'ontology-chebi': 'chebi',
      'nutraceuticals': 'nutraceuticals',
      'conditions': 'conditions',
      'outcomes': 'outcomes',
      'pathways': 'pathways',
      'entities-ai': 'entities-ai',
      'relations-ai': 'relations-ai',
      'active-studies': 'studies',
      'approved-triplets': 'approved-triplets',
      'pending-triplets': 'pending-triplets',
      'total-nodes': 'nodes',
      'total-relations': 'edges',
      'positive-relations': 'positive',
      'negative-relations': 'negative',
    };
    const mappedType = cardIdToStatType[cardId] || 'ontology';
    setSelectedStatType(mappedType);
    setStatDialogOpen(true);
  };

  const handleEntityClick = (entityId: string, entityType: string) => {
    setStatDialogOpen(false);
    setEntityFilter(entityType);
    toast.info(t('knowledgeGraph.toast.filteredBy', { type: entityType }));
  };

  const handleStudyFromDialogClick = (studyId: string) => {
    setStatDialogOpen(false);
    setStudyFilter(studyId);
  };

  const handleHighlightEntity = (entityName: string) => {
    // Could be used to highlight entity in the graph
    toast.info(t('knowledgeGraph.toast.entityHighlight', { name: entityName }));
  };

  // Handle node click to show details sidebar
  const handleNodeClick = useCallback((nodeId: string, nodeData: any) => {
    // Find all connections for this node
    const connectedNodes: NodeDetailsData['connectedNodes'] = [];
    
    filteredData.links.forEach((link: any) => {
      const fromId = link.from || link.source;
      const toId = link.to || link.target;
      
      if (fromId === nodeId) {
        // Outgoing connection
        const targetNode = filteredData.nodes.find((n: any) => n.id === toId);
        if (targetNode) {
          connectedNodes.push({
            id: targetNode.id,
            label: targetNode.label,
            type: targetNode.group || targetNode.type || 'unknown',
            relationLabel: link.label || link.relationship,
            relationDirection: 'outgoing',
            confidence: link.confidence || link.value
          });
        }
      } else if (toId === nodeId) {
        // Incoming connection
        const sourceNode = filteredData.nodes.find((n: any) => n.id === fromId);
        if (sourceNode) {
          connectedNodes.push({
            id: sourceNode.id,
            label: sourceNode.label,
            type: sourceNode.group || sourceNode.type || 'unknown',
            relationLabel: link.label || link.relationship,
            relationDirection: 'incoming',
            confidence: link.confidence || link.value
          });
        }
      }
    });

    setSelectedNodeDetails({
      id: nodeId,
      label: nodeData.label || nodeData.name || nodeData.title || nodeId,
      type: nodeData.group || nodeData.type || 'unknown',
      connections: connectedNodes.length,
      connectedNodes
    });
    setNodeDetailsSidebarOpen(true);
  }, [filteredData]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Section - 3 Rows: Base Knowledge, Extracted Knowledge, Graph Structure */}
        <KnowledgeGraphStatsSection onCardClick={openStatDialog} />

        {/* Actions Row */}
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={() => setEnrichDialogOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">{t('enrich.button', 'Enrich with Studies')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[250px]">
              <p>{t('enrich.buttonTooltip', 'Search, download and process real scientific studies to enrich the knowledge graph')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={testNeo4jConnection}
                disabled={testingConnection}
              >
                <Database className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Test Neo4j</span>
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
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('knowledgeGraph.filters.allTypes', 'All Types')}</SelectItem>
                        <SelectItem value="Nutraceutical">{t('knowledgeGraph.filters.nutraceuticals', 'Nutraceuticals')}</SelectItem>
                        <SelectItem value="Compound">{t('knowledgeGraph.filters.drugs', 'Drugs/Compounds')}</SelectItem>
                        <SelectItem value="Condition">{t('knowledgeGraph.filters.conditions', 'Conditions')}</SelectItem>
                        <SelectItem value="Target">{t('knowledgeGraph.filters.targets', 'Targets')}</SelectItem>
                        <SelectItem value="Pathway">{t('knowledgeGraph.filters.pathways', 'Pathways')}</SelectItem>
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
            
            {/* 3D Toggle */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <Switch 
                      checked={use3DGraph} 
                      onCheckedChange={setUse3DGraph}
                      id="3d-toggle"
                    />
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('knowledgeGraph.controls.toggle3D', 'Toggle 2D/3D visualization')}</p>
                </TooltipContent>
              </Tooltip>
              <Badge variant={use3DGraph ? 'default' : 'secondary'} className="text-xs">
                {use3DGraph ? '3D' : '2D'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edge Limit Slider */}
      <Card>
        <CardContent className="py-3 px-4">
          <GraphLimitSlider
            value={edgeLimit}
            onChange={(newLimit) => {
              setEdgeLimit(newLimit);
            }}
          />
        </CardContent>
      </Card>

      {/* Graph - Full Width */}
      <Card>
        <CardContent className="p-4">
          {/* Node/Edge count badge */}
          {stats && !loading && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-xs">
                {stats.totalNodes.toLocaleString()} {t('knowledgeGraph.nodes', 'nodes')} · {stats.totalEdges.toLocaleString()} {t('knowledgeGraph.edges', 'edges')}
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">Neo4j</Badge>
            </div>
          )}
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
          ) : use3DGraph ? (
            <KnowledgeGraph3D
              data={filteredData}
              height="calc(100vh - 400px)"
              onNodeClick={handleNodeClick}
              enable3D={true}
            />
          ) : (
            <NetworkGraph
              data={filteredData}
              height="calc(100vh - 400px)"
              showControls={true}
              showLegend={true}
              onNodeClick={handleNodeClick}
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

        {/* Knowledge Graph Chat - Inline Card */}
        <KnowledgeGraphChat
          variant="inline"
          open={true}
          onOpenChange={() => {}}
          onHighlightEntity={handleHighlightEntity}
          onFilterByEntity={(name, type) => setEntityFilter(type)}
        />
      </div>

      {/* Study Details Side Panel */}
      <Sheet open={studyPanelOpen} onOpenChange={setStudyPanelOpen}>
        <SheetContent className="w-[400px] sm:w-[450px] overflow-hidden flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                {t('knowledgeGraph.studyPanel.title', 'Study Details')}
              </SheetTitle>
            </div>
            <SheetDescription>
              {t('knowledgeGraph.studyPanel.description', 'Detailed information about the selected study and its extracted knowledge')}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {loadingStudyDetails ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedStudyDetails ? (
              <div className="space-y-6 py-4">
                {/* Study Title & Meta */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg leading-tight">{selectedStudyDetails.title}</h3>
                  {selectedStudyDetails.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{selectedStudyDetails.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {selectedStudyDetails.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {selectedStudyDetails.year}
                      </span>
                    )}
                    {selectedStudyDetails.journal && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {selectedStudyDetails.journal}
                      </span>
                    )}
                  </div>
                  {selectedStudyDetails.authors && selectedStudyDetails.authors.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedStudyDetails.authors.slice(0, 3).join(', ')}
                      {selectedStudyDetails.authors.length > 3 && ` +${selectedStudyDetails.authors.length - 3} more`}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Triplet Stats */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {t('knowledgeGraph.studyPanel.extractionStats', 'Extraction Stats')}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedStudyDetails.approvedCount}</div>
                      <div className="text-[10px] text-green-700 dark:text-green-400">{t('knowledgeGraph.studyPanel.approved', 'Approved')}</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-amber-600">{selectedStudyDetails.pendingCount}</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400">{t('knowledgeGraph.studyPanel.pending', 'Pending')}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{selectedStudyDetails.rejectedCount}</div>
                      <div className="text-[10px] text-red-700 dark:text-red-400">{t('knowledgeGraph.studyPanel.rejected', 'Rejected')}</div>
                    </div>
                  </div>
                  {selectedStudyDetails.lastSyncedAt && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {t('knowledgeGraph.studyPanel.lastSync', 'Last synced')}: {new Date(selectedStudyDetails.lastSyncedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Extracted Entities */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">{t('knowledgeGraph.studyPanel.extractedEntities', 'Extracted Entities')}</h4>
                  
                  {selectedStudyDetails.extractedEntities.nutraceuticals.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-600">{t('knowledgeGraph.studyPanel.nutraceuticals', 'Nutraceuticals')} ({selectedStudyDetails.extractedEntities.nutraceuticals.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudyDetails.extractedEntities.nutraceuticals.slice(0, 8).map((n, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                            {n}
                          </Badge>
                        ))}
                        {selectedStudyDetails.extractedEntities.nutraceuticals.length > 8 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{selectedStudyDetails.extractedEntities.nutraceuticals.length - 8}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedStudyDetails.extractedEntities.conditions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-emerald-600">{t('knowledgeGraph.studyPanel.conditions', 'Conditions')} ({selectedStudyDetails.extractedEntities.conditions.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudyDetails.extractedEntities.conditions.slice(0, 8).map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                            {c}
                          </Badge>
                        ))}
                        {selectedStudyDetails.extractedEntities.conditions.length > 8 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{selectedStudyDetails.extractedEntities.conditions.length - 8}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedStudyDetails.extractedEntities.mechanisms.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-600">{t('knowledgeGraph.studyPanel.mechanisms', 'Mechanisms')} ({selectedStudyDetails.extractedEntities.mechanisms.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudyDetails.extractedEntities.mechanisms.slice(0, 6).map((m, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            {m}
                          </Badge>
                        ))}
                        {selectedStudyDetails.extractedEntities.mechanisms.length > 6 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{selectedStudyDetails.extractedEntities.mechanisms.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedStudyDetails.extractedEntities.effects.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-purple-600">{t('knowledgeGraph.studyPanel.effects', 'Effects')} ({selectedStudyDetails.extractedEntities.effects.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStudyDetails.extractedEntities.effects.slice(0, 6).map((e, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                            {e}
                          </Badge>
                        ))}
                        {selectedStudyDetails.extractedEntities.effects.length > 6 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{selectedStudyDetails.extractedEntities.effects.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedStudyDetails.topRelations.length > 0 && (
                  <>
                    <Separator />
                    
                    {/* Top Relations */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">{t('knowledgeGraph.studyPanel.topRelations', 'Top Relations')}</h4>
                      <div className="space-y-2">
                        {selectedStudyDetails.topRelations.map((rel, idx) => (
                          <div key={idx} className="bg-muted/50 rounded-lg p-2.5 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-blue-700 dark:text-blue-400">{rel.subject}</span>
                              <span className="text-muted-foreground px-1.5 py-0.5 bg-background rounded text-[10px]">{rel.predicate}</span>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">{rel.object}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full" 
                                  style={{ width: `${rel.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px]">{Math.round(rel.confidence * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Clear Filter Button */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setStudyFilter('all');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('knowledgeGraph.studyPanel.clearFilter', 'Clear Study Filter')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                {t('knowledgeGraph.studyPanel.noData', 'No study data available')}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Stat Dialog */}
      <KnowledgeGraphStatDialog
        open={statDialogOpen}
        onOpenChange={setStatDialogOpen}
        statType={selectedStatType}
        stats={{
          ontologyEntities: dataSourceStats.ontologyEntities,
          tripletCount: dataSourceStats.tripletCount,
          knownRelations: dataSourceStats.knownRelations,
          totalNodes: stats?.totalNodes || 0,
          totalEdges: stats?.totalEdges || 0,
          positiveRelations: stats?.positiveRelations || 0,
          negativeRelations: stats?.negativeRelations || 0,
        }}
        onEntityClick={handleEntityClick}
        onStudyClick={handleStudyFromDialogClick}
      />

      {/* Node Details Sidebar */}
      <NodeDetailsSidebar
        open={nodeDetailsSidebarOpen}
        onOpenChange={setNodeDetailsSidebarOpen}
        nodeData={selectedNodeDetails}
      />

      {/* Enrich Knowledge Graph Dialog */}
      <EnrichKnowledgeGraphDialog
        open={enrichDialogOpen}
        onOpenChange={setEnrichDialogOpen}
      />
    </TooltipProvider>
  );
};

export default KnowledgeGraphViewer;
