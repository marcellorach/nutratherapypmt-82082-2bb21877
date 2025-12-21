import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Database,
  FileText,
  Link2,
  ArrowRight,
  Search,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

type StatType = 'ontology' | 'studies' | 'nodes' | 'edges' | 'positive' | 'negative' | 'nutraceuticals' | 'conditions';

interface KnowledgeGraphStatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statType: StatType;
  stats: {
    ontologyEntities: number;
    tripletCount: number;
    knownRelations: number;
    totalNodes: number;
    totalEdges: number;
    positiveRelations: number;
    negativeRelations: number;
  };
  onEntityClick?: (entityId: string, entityType: string) => void;
  onStudyClick?: (studyId: string) => void;
}

interface OntologyEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  layer: string;
  description?: string;
  synonyms?: string[];
}

interface StudyContribution {
  id: string;
  title: string;
  tripletCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  lastSyncedAt: string | null;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  source: string;
  connections: number;
}

interface GraphRelation {
  id: string;
  sourceName: string;
  targetName: string;
  type: string;
  confidence: number;
  isNegative: boolean;
  studyTitle?: string;
}

export const KnowledgeGraphStatDialog: React.FC<KnowledgeGraphStatDialogProps> = ({
  open,
  onOpenChange,
  statType,
  stats,
  onEntityClick,
  onStudyClick,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Data states
  const [ontologyEntities, setOntologyEntities] = useState<OntologyEntity[]>([]);
  const [studyContributions, setStudyContributions] = useState<StudyContribution[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphRelations, setGraphRelations] = useState<GraphRelation[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, statType]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (statType) {
        case 'ontology':
          await loadOntologyData();
          break;
        case 'studies':
          await loadStudiesData();
          break;
      case 'nodes':
        await loadNodesData();
        break;
      case 'nutraceuticals':
      case 'conditions':
        await loadNodesData(statType);
        break;
      case 'edges':
      case 'positive':
      case 'negative':
        await loadRelationsData();
        break;
      }
    } catch (error) {
      console.error('Error loading stat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOntologyData = async () => {
    const { data } = await supabase
      .from('veterinary_ontology')
      .select('id, entity_name, entity_type, layer, description, synonyms')
      .order('entity_name')
      .limit(500);
    
    setOntologyEntities(data || []);
  };

  const loadStudiesData = async () => {
    // Get all triplets grouped by study with their status
    const { data: triplets } = await supabase
      .from('triplet_extractions')
      .select(`
        id,
        study_id,
        curation_status,
        synced_at,
        processed_studies!inner(id, title)
      `)
      .eq('synced_to_neo4j', true);

    // Group by study
    const studyMap = new Map<string, StudyContribution>();
    
    triplets?.forEach((triplet: any) => {
      const studyId = triplet.study_id;
      const existing = studyMap.get(studyId);
      
      if (existing) {
        existing.tripletCount++;
        if (triplet.curation_status === 'approved') existing.approvedCount++;
        else if (triplet.curation_status === 'pending') existing.pendingCount++;
        else if (triplet.curation_status === 'rejected') existing.rejectedCount++;
        if (triplet.synced_at && (!existing.lastSyncedAt || triplet.synced_at > existing.lastSyncedAt)) {
          existing.lastSyncedAt = triplet.synced_at;
        }
      } else {
        studyMap.set(studyId, {
          id: studyId,
          title: triplet.processed_studies?.title || 'Unknown Study',
          tripletCount: 1,
          approvedCount: triplet.curation_status === 'approved' ? 1 : 0,
          pendingCount: triplet.curation_status === 'pending' ? 1 : 0,
          rejectedCount: triplet.curation_status === 'rejected' ? 1 : 0,
          lastSyncedAt: triplet.synced_at,
        });
      }
    });

    setStudyContributions(Array.from(studyMap.values()).sort((a, b) => b.tripletCount - a.tripletCount));
  };

  const loadNodesData = async (filterType?: 'nutraceuticals' | 'conditions') => {
    // Build query based on filter type
    let typeFilter = '';
    if (filterType === 'nutraceuticals') {
      typeFilter = 'WHERE n:Nutraceutical OR n:Compound OR n:Drug';
    } else if (filterType === 'conditions') {
      typeFilter = 'WHERE n:Condition OR n:Disease';
    }
    
    // Get nodes from Neo4j via the edge function
    const { data } = await supabase.functions.invoke('graph-rag-search', {
      body: {
        queryType: 'cypher',
        cypherQuery: `
          MATCH (n)
          ${typeFilter}
          OPTIONAL MATCH (n)-[r]-()
          WITH n, count(r) as connections
          RETURN n.name as name, labels(n)[0] as type, n.study_id as studyId, connections
          ORDER BY connections DESC
          LIMIT 200
        `
      }
    });

    if (data?.success && data?.data?.rows) {
      // Parse the rows array - Neo4j returns columns: [name, type, studyId, connections]
      const nodes = data.data.rows.map((row: any[], idx: number) => ({
        id: `node-${idx}`,
        label: row[0] || 'Unknown',
        type: row[1] || 'Unknown',
        source: row[2] ? 'study' : 'ontology',
        connections: row[3] || 0,
      }));
      setGraphNodes(nodes);
    } else if (data?.success && data?.data?.nodes) {
      // Fallback for older response format
      const nodes = data.data.nodes.map((node: any) => ({
        id: node.id,
        label: node.properties?.name || node.id,
        type: node.type || 'Unknown',
        source: node.properties?.study_id ? 'study' : 'ontology',
        connections: node.connections || 0,
      }));
      setGraphNodes(nodes);
    }
  };

  const loadRelationsData = async () => {
    // Get relations from Neo4j
    const { data } = await supabase.functions.invoke('graph-rag-search', {
      body: {
        queryType: 'cypher',
        cypherQuery: `
          MATCH (s)-[r]->(t)
          RETURN s.name as sourceName, type(r) as relType, t.name as targetName,
                 r.confidence as confidence, r.direction as direction,
                 r.study_title as studyTitle
          ORDER BY r.confidence DESC
          LIMIT 300
        `
      }
    });

    if (data?.success && data?.data) {
      const relations: GraphRelation[] = [];
      const negativeTypes = ['WORSENS', 'CAUSES_SIDE_EFFECT', 'CONTRAINDICATED_FOR', 'AGGRAVATES'];
      
      // Check if data is in rows format (column array) or relationships format
      if (data.data.rows && Array.isArray(data.data.rows)) {
        // Parse rows array - columns: [sourceName, relType, targetName, confidence, direction, studyTitle]
        data.data.rows.forEach((row: any[], idx: number) => {
          const [sourceName, relType, targetName, confidence, direction, studyTitle] = row;
          const isNegative = direction === 'negative' || negativeTypes.includes(relType);
          
          relations.push({
            id: `rel-${idx}`,
            sourceName: sourceName || 'Unknown',
            targetName: targetName || 'Unknown',
            type: relType || 'UNKNOWN',
            confidence: confidence || 0.8,
            isNegative,
            studyTitle: studyTitle || undefined,
          });
        });
      } else if (data.data.relationships && Array.isArray(data.data.relationships)) {
        // Fallback for older response format
        data.data.relationships.forEach((rel: any, idx: number) => {
          const isNegative = rel.properties?.direction === 'negative' || 
            negativeTypes.includes(rel.type);
          
          relations.push({
            id: `rel-${idx}`,
            sourceName: rel.sourceNode?.name || rel.source || 'Unknown',
            targetName: rel.targetNode?.name || rel.target || 'Unknown',
            type: rel.type,
            confidence: rel.properties?.confidence || 0.8,
            isNegative,
            studyTitle: rel.properties?.study_title,
          });
        });
      }

      setGraphRelations(relations);
    }
  };

  const getTitle = () => {
    switch (statType) {
      case 'ontology':
        return t('knowledgeGraph.dialogs.ontology.title', 'Ontology Entities');
      case 'studies':
        return t('knowledgeGraph.dialogs.studies.title', 'Study Contributions');
      case 'nodes':
        return t('knowledgeGraph.dialogs.nodes.title', 'Graph Nodes');
      case 'nutraceuticals':
        return t('knowledgeGraph.dialogs.nutraceuticals.title', 'Nutraceutical Nodes');
      case 'conditions':
        return t('knowledgeGraph.dialogs.conditions.title', 'Condition Nodes');
      case 'edges':
        return t('knowledgeGraph.dialogs.edges.title', 'All Relations');
      case 'positive':
        return t('knowledgeGraph.dialogs.positive.title', 'Positive Relations');
      case 'negative':
        return t('knowledgeGraph.dialogs.negative.title', 'Negative Relations');
    }
  };

  const getDescription = () => {
    switch (statType) {
      case 'ontology':
        return t('knowledgeGraph.dialogs.ontology.description', 'Base entities from the veterinary knowledge ontology');
      case 'studies':
        return t('knowledgeGraph.dialogs.studies.description', 'Scientific studies contributing to the knowledge graph');
      case 'nodes':
        return t('knowledgeGraph.dialogs.nodes.description', 'All unique entities in the graph');
      case 'nutraceuticals':
        return t('knowledgeGraph.dialogs.nutraceuticals.description', 'Nutraceuticals, compounds and drugs in the knowledge graph');
      case 'conditions':
        return t('knowledgeGraph.dialogs.conditions.description', 'Health conditions and diseases in the knowledge graph');
      case 'edges':
        return t('knowledgeGraph.dialogs.edges.description', 'All connections between entities');
      case 'positive':
        return t('knowledgeGraph.dialogs.positive.description', 'Beneficial relations: treatments, improvements, therapeutic support');
      case 'negative':
        return t('knowledgeGraph.dialogs.negative.description', 'Adverse relations: contraindications, side effects');
    }
  };

  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      nutraceutical: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
      condition: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
      mechanism: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
      effect: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
      pathway: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
    };
    return colors[type.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  // Filter data based on search and active tab
  const filteredOntology = ontologyEntities.filter(e => {
    const matchesSearch = !searchQuery || 
      e.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || e.entity_type.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const filteredStudies = studyContributions.filter(s => 
    !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNodes = graphNodes.filter(n => {
    const matchesSearch = !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || n.type.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const filteredRelations = graphRelations.filter(r => {
    const matchesSearch = !searchQuery || 
      r.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statType === 'positive') return matchesSearch && !r.isNegative;
    if (statType === 'negative') return matchesSearch && r.isNegative;
    return matchesSearch;
  });

  const ontologyTypes = Array.from(new Set(ontologyEntities.map(e => e.entity_type.toLowerCase())));
  const nodeTypes = Array.from(new Set(graphNodes.map(n => n.type.toLowerCase())));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statType === 'ontology' && <Database className="h-5 w-5 text-blue-600" />}
            {statType === 'studies' && <FileText className="h-5 w-5 text-green-600" />}
            {statType === 'nodes' && <Sparkles className="h-5 w-5 text-purple-600" />}
            {(statType === 'edges' || statType === 'positive') && <Link2 className="h-5 w-5 text-emerald-600" />}
            {statType === 'negative' && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {getTitle()}
            <Badge variant="secondary" className="ml-2">
              {statType === 'ontology' && stats.ontologyEntities}
              {statType === 'studies' && stats.tripletCount}
              {statType === 'nodes' && stats.totalNodes}
              {statType === 'nutraceuticals' && graphNodes.length}
              {statType === 'conditions' && graphNodes.length}
              {statType === 'edges' && stats.totalEdges}
              {statType === 'positive' && stats.positiveRelations}
              {statType === 'negative' && stats.negativeRelations}
            </Badge>
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search', 'Search...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Tabs for ontology and nodes only */}
        {(statType === 'ontology' || statType === 'nodes') && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">
                {t('common.all', 'All')}
              </TabsTrigger>
              {(statType === 'ontology' ? ontologyTypes : nodeTypes).slice(0, 6).map(type => (
                <TabsTrigger key={type} value={type} className="text-xs capitalize">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Content - min-h-0 is critical for flex scroll to work */}
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Ontology Entities */}
              {statType === 'ontology' && filteredOntology.map(entity => (
                <div
                  key={entity.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onEntityClick?.(entity.id, entity.entity_type)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{entity.entity_name}</span>
                        <Badge variant="outline" className={`text-[10px] ${getEntityTypeColor(entity.entity_type)}`}>
                          {entity.entity_type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {entity.layer}
                        </Badge>
                      </div>
                      {entity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entity.description}</p>
                      )}
                      {entity.synonyms && entity.synonyms.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {entity.synonyms.slice(0, 3).map((syn, i) => (
                            <span key={i} className="text-[10px] text-muted-foreground">
                              {syn}{i < Math.min(entity.synonyms!.length - 1, 2) ? ',' : ''}
                            </span>
                          ))}
                          {entity.synonyms.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{entity.synonyms.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}

              {/* Study Contributions */}
              {statType === 'studies' && filteredStudies.map(study => (
                <div
                  key={study.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onStudyClick?.(study.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium truncate">{study.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">{study.approvedCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">{study.pendingCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">{study.rejectedCount}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {study.tripletCount} triplets
                        </Badge>
                      </div>
                      {study.lastSyncedAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Last sync: {new Date(study.lastSyncedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}

              {/* Graph Nodes - also used for nutraceuticals and conditions */}
              {(statType === 'nodes' || statType === 'nutraceuticals' || statType === 'conditions') && filteredNodes.map(node => (
                <div
                  key={node.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onEntityClick?.(node.id, node.type)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{node.label}</span>
                      <Badge variant="outline" className={`text-[10px] ${getEntityTypeColor(node.type)}`}>
                        {node.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${node.source === 'study' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}
                      >
                        {node.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {node.connections} conn.
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Relations */}
              {(statType === 'edges' || statType === 'positive' || statType === 'negative') && 
                filteredRelations.map(rel => (
                  <div
                    key={rel.id}
                    className={`p-3 rounded-lg border bg-card ${rel.isNegative ? 'border-red-200 dark:border-red-900' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-blue-700 dark:text-blue-400">{rel.sourceName}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${rel.isNegative ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}`}
                      >
                        {rel.type}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{rel.targetName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${rel.isNegative ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${rel.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{Math.round(rel.confidence * 100)}%</span>
                      </div>
                      {rel.studyTitle && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {rel.studyTitle.length > 30 ? `${rel.studyTitle.substring(0, 30)}...` : rel.studyTitle}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              }

              {/* Empty state */}
              {((statType === 'ontology' && filteredOntology.length === 0) ||
                (statType === 'studies' && filteredStudies.length === 0) ||
                (statType === 'nodes' && filteredNodes.length === 0) ||
                ((statType === 'edges' || statType === 'positive' || statType === 'negative') && filteredRelations.length === 0)) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('common.noResults', 'No results found')}</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
