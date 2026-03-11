import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import TripletReviewDialog from './kg-stats/TripletReviewDialog';
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

type StatType = 'ontology' | 'studies' | 'nodes' | 'edges' | 'positive' | 'negative' | 'nutraceuticals' | 'conditions' | 'pathways' | 'outcomes' | 'chebi' | 'entities-ai' | 'relations-ai' | 'approved-triplets' | 'pending-triplets';

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
  const [genericData, setGenericData] = useState<any[]>([]);
  const [reviewingTriplet, setReviewingTriplet] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, statType]);

  const loadData = async () => {
    setLoading(true);
    setGenericData([]);
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
          await loadNutraceuticalsData();
          break;
        case 'conditions':
          await loadConditionsData();
          break;
        case 'edges':
        case 'positive':
        case 'negative':
          await loadRelationsData();
          break;
        case 'pathways':
          await loadPathwaysData();
          break;
        case 'outcomes':
          await loadOutcomesData();
          break;
        case 'chebi':
          await loadChebiData();
          break;
        case 'entities-ai':
          await loadEntitiesAIData();
          break;
        case 'relations-ai':
          await loadRelationsAIData();
          break;
        case 'approved-triplets':
          await loadTripletsData('approved');
          break;
        case 'pending-triplets':
          await loadTripletsData('pending');
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

  const loadNutraceuticalsData = async () => {
    const { data } = await supabase
      .from('nutraceuticals')
      .select('id, name, name_en, description, description_en, chemical_compound, source')
      .order('name')
      .limit(500);
    setGenericData(data || []);
  };

  const loadConditionsData = async () => {
    const { data } = await supabase
      .from('health_conditions')
      .select('id, name, name_en, description, description_en, category, severity_level')
      .order('name')
      .limit(500);
    setGenericData(data || []);
  };

  const loadPathwaysData = async () => {
    const { data } = await supabase
      .from('veterinary_ontology')
      .select('id, entity_name, entity_type, layer, description')
      .eq('layer', 'layer_2_mechanism')
      .order('entity_name')
      .limit(500);
    setGenericData(data || []);
  };

  const loadOutcomesData = async () => {
    const { data } = await (supabase as any)
      .from('outcome_families')
      .select('id, name, name_en, description, description_en, color, icon, sort_order')
      .order('sort_order', { ascending: true });
    setGenericData(data || []);
  };

  const loadChebiData = async () => {
    const { data } = await supabase
      .from('veterinary_ontology')
      .select('id, entity_name, entity_type, layer, description, synonyms')
      .eq('source', 'ChEBI')
      .order('entity_name')
      .limit(500);
    setGenericData(data || []);
  };

  const loadEntitiesAIData = async () => {
    const { data } = await supabase
      .from('veterinary_ontology')
      .select('id, entity_name, entity_type, layer, description, synonyms')
      .eq('source', 'gemini_extraction')
      .order('entity_name')
      .limit(500);
    setGenericData(data || []);
  };

  const loadRelationsAIData = async () => {
    const { data } = await supabase
      .from('hierarchical_edges')
      .select('id, source_type, target_type, relationship, confidence, evidence_level, source_id, target_id')
      .not('study_ids', 'is', null)
      .order('confidence', { ascending: false })
      .limit(300);
    setGenericData(data || []);
  };

  const loadTripletsData = async (status: 'approved' | 'pending') => {
    const { data } = await supabase
      .from('triplet_extractions')
      .select('id, subject_name, subject_type, predicate, object_name, object_type, extraction_confidence, curation_status, confidence_rationale, evidence_level, species_context, study_id')
      .eq('curation_status', status)
      .order('extraction_confidence', { ascending: false })
      .limit(300);
    setGenericData(data || []);
  };

  const handleTripletReviewed = (tripletId: string, newStatus: string) => {
    setGenericData(prev => prev.filter(item => item.id !== tripletId));
  };

  const getTitle = () => {
    switch (statType) {
      case 'ontology': return t('knowledgeGraph.dialogs.ontology.title', 'Ontology Entities (Manual)');
      case 'studies': return t('knowledgeGraph.dialogs.studies.title', 'Study Contributions');
      case 'nodes': return t('knowledgeGraph.dialogs.nodes.title', 'Graph Nodes');
      case 'nutraceuticals': return t('knowledgeGraph.dialogs.nutraceuticals.title', 'Nutraceuticals');
      case 'conditions': return t('knowledgeGraph.dialogs.conditions.title', 'Health Conditions');
      case 'edges': return t('knowledgeGraph.dialogs.edges.title', 'All Relations');
      case 'positive': return t('knowledgeGraph.dialogs.positive.title', 'Positive Relations');
      case 'negative': return t('knowledgeGraph.dialogs.negative.title', 'Negative Relations');
      case 'pathways': return t('knowledgeGraph.dialogs.pathways.title', 'Pathways / Mechanisms');
      case 'outcomes': return t('knowledgeGraph.dialogs.outcomes.title', 'Outcome Families');
      case 'chebi': return t('knowledgeGraph.dialogs.chebi.title', 'ChEBI Entities');
      case 'entities-ai': return t('knowledgeGraph.dialogs.entitiesAI.title', 'AI-Extracted Entities');
      case 'relations-ai': return t('knowledgeGraph.dialogs.relationsAI.title', 'AI-Extracted Relations');
      case 'approved-triplets': return t('knowledgeGraph.dialogs.approvedTriplets.title', 'Approved Triplets');
      case 'pending-triplets': return t('knowledgeGraph.dialogs.pendingTriplets.title', 'Pending Triplets');
      default: return '';
    }
  };

  const getDescription = () => {
    switch (statType) {
      case 'ontology': return t('knowledgeGraph.dialogs.ontology.description', 'Manually curated base entities from the veterinary knowledge ontology');
      case 'studies': return t('knowledgeGraph.dialogs.studies.description', 'Scientific studies contributing to the knowledge graph');
      case 'nodes': return t('knowledgeGraph.dialogs.nodes.description', 'All unique entities in the graph');
      case 'nutraceuticals': return t('knowledgeGraph.dialogs.nutraceuticals.description', 'Nutraceuticals registered in the base catalog');
      case 'conditions': return t('knowledgeGraph.dialogs.conditions.description', 'Health conditions registered in the base catalog');
      case 'edges': return t('knowledgeGraph.dialogs.edges.description', 'All connections between entities');
      case 'positive': return t('knowledgeGraph.dialogs.positive.description', 'Beneficial relations: treatments, improvements, therapeutic support');
      case 'negative': return t('knowledgeGraph.dialogs.negative.description', 'Adverse relations: contraindications, side effects');
      case 'pathways': return t('knowledgeGraph.dialogs.pathways.description', 'Biological pathways and mechanisms from the veterinary ontology');
      case 'outcomes': return t('knowledgeGraph.dialogs.outcomes.description', 'Outcome families used to categorize therapeutic results');
      case 'chebi': return t('knowledgeGraph.dialogs.chebi.description', 'Chemical entities from the ChEBI database');
      case 'entities-ai': return t('knowledgeGraph.dialogs.entitiesAI.description', 'Entities automatically extracted from studies by AI');
      case 'relations-ai': return t('knowledgeGraph.dialogs.relationsAI.description', 'Relations extracted from studies with evidence links');
      case 'approved-triplets': return t('knowledgeGraph.dialogs.approvedTriplets.description', 'Triplets approved for inclusion in the knowledge graph');
      case 'pending-triplets': return t('knowledgeGraph.dialogs.pendingTriplets.description', 'Triplets awaiting curation review');
      default: return '';
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

  const filteredGeneric = genericData.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  const isGenericType = ['pathways', 'outcomes', 'chebi', 'entities-ai', 'relations-ai', 'approved-triplets', 'pending-triplets', 'nutraceuticals', 'conditions'].includes(statType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(statType === 'ontology' || statType === 'chebi' || statType === 'entities-ai') && <Database className="h-5 w-5 text-primary" />}
            {(statType === 'studies' || statType === 'approved-triplets' || statType === 'pending-triplets') && <FileText className="h-5 w-5 text-primary" />}
            {(statType === 'nodes' || statType === 'nutraceuticals' || statType === 'conditions' || statType === 'pathways' || statType === 'outcomes') && <Sparkles className="h-5 w-5 text-primary" />}
            {(statType === 'edges' || statType === 'positive' || statType === 'relations-ai') && <Link2 className="h-5 w-5 text-primary" />}
            {statType === 'negative' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {getTitle()}
            <Badge variant="secondary" className="ml-2">
              {isGenericType ? filteredGeneric.length : null}
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
              {statType === 'nodes' && filteredNodes.map(node => (
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

              {/* Generic data rendering for new types */}
              {isGenericType && filteredGeneric.map((item, idx) => (
                <div
                  key={item.id || `item-${idx}`}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {(statType === 'pathways' || statType === 'chebi' || statType === 'entities-ai') && (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.entity_name}</span>
                          <Badge variant="outline" className={`text-[10px] ${getEntityTypeColor(item.entity_type || '')}`}>
                            {item.entity_type}
                          </Badge>
                          {item.layer && (
                            <Badge variant="outline" className="text-[10px]">{item.layer}</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {statType === 'nutraceuticals' && (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.name}</span>
                        {item.chemical_compound && (
                          <Badge variant="outline" className="text-[10px] ml-2">{item.chemical_compound}</Badge>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {statType === 'conditions' && (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.category && (
                            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          )}
                          {item.severity_level && (
                            <Badge variant="secondary" className="text-[10px]">{item.severity_level}</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {statType === 'outcomes' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || '#888' }} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px]">#{item.sort_order}</Badge>
                    </div>
                  )}
                  {statType === 'relations-ai' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{item.source_type}</Badge>
                      <span className="font-medium text-primary">{item.relationship}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-[10px]">{item.target_type}</Badge>
                      {item.confidence && (
                        <Badge variant="secondary" className="text-[10px]">{Math.round(item.confidence * 100)}%</Badge>
                      )}
                      {item.evidence_level && (
                        <Badge variant="outline" className="text-[10px]">{item.evidence_level}</Badge>
                      )}
                    </div>
                  )}
                   {(statType === 'approved-triplets' || statType === 'pending-triplets') && (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary">{item.subject_name}</span>
                        <Badge variant="outline" className="text-[10px]">{item.predicate}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.object_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{item.subject_type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.object_type}</Badge>
                        {item.extraction_confidence && (
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(item.extraction_confidence * 100)}%
                          </Badge>
                        )}
                        <Badge variant={statType === 'approved-triplets' ? 'default' : 'secondary'} className="text-[10px]">
                          {item.curation_status}
                        </Badge>
                        {statType === 'pending-triplets' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto h-6 text-[10px] px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewingTriplet(item);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t('knowledgeGraph.tripletReview.reviewButton', 'Review')}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {!loading && (
                (statType === 'ontology' && filteredOntology.length === 0) ||
                (statType === 'studies' && filteredStudies.length === 0) ||
                ((statType === 'nodes' || statType === 'nutraceuticals' || statType === 'conditions') && filteredNodes.length === 0) ||
                ((statType === 'edges' || statType === 'positive' || statType === 'negative') && filteredRelations.length === 0) ||
                (isGenericType && filteredGeneric.length === 0)
              ) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('common.noResults', 'No results found')}</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      <TripletReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        triplet={reviewingTriplet}
        onReviewed={handleTripletReviewed}
      />
    </Dialog>
  );
};
