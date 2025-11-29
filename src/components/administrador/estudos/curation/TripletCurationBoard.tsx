import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Sparkles, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Triplet {
  id: string;
  study_id: string;
  subject_type: string;
  subject_name: string;
  subject_layer: string | null;
  predicate: string;
  object_type: string;
  object_name: string;
  object_layer: string | null;
  extraction_confidence: number;
  kg_match_score: number;
  llm_confidence: number;
  curation_status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  auto_approved: boolean;
  synced_to_neo4j: boolean;
  created_at: string;
  // VetGraphRAG fields
  evidence_level: string | null;
  intensity: number | null;
  mechanism_path: string[] | null;
  relationship_category: string | null;
  species_context: string[] | null;
}

interface Column {
  id: string;
  title: string;
  triplets: Triplet[];
}

export const TripletCurationBoard: React.FC = () => {
  const { t } = useTranslation();
  const [columns, setColumns] = useState<Record<string, Column>>({
    pending: { id: 'pending', title: 'Pending', triplets: [] },
    reviewing: { id: 'reviewing', title: 'Reviewing', triplets: [] },
    approved: { id: 'approved', title: 'Approved', triplets: [] },
    rejected: { id: 'rejected', title: 'Rejected', triplets: [] }
  });
  const [loading, setLoading] = useState(true);
  const [selectedTriplets, setSelectedTriplets] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);

  useEffect(() => {
    fetchTriplets();
    setupRealtimeSubscription();
  }, []);

  const fetchTriplets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organizar triplets por coluna
      const newColumns = { ...columns };
      Object.values(newColumns).forEach(col => col.triplets = []);

      data?.forEach((triplet: any) => {
        const status = triplet.curation_status || 'pending';
        if (newColumns[status]) {
          newColumns[status].triplets.push(triplet);
        }
      });

      setColumns(newColumns);
    } catch (error: any) {
      toast.error('Error fetching triplets');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('triplet_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'triplet_extractions' },
        () => fetchTriplets()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const movedTriplet = sourceColumn.triplets[source.index];

    // Atualizar estado local
    const newColumns = { ...columns };
    newColumns[source.droppableId].triplets.splice(source.index, 1);
    newColumns[destination.droppableId].triplets.splice(destination.index, 0, movedTriplet);
    setColumns(newColumns);

    // Atualizar no banco de dados
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: destination.droppableId,
          reviewed_by: userId,
          review_date: new Date().toISOString(),
          review_notes: reviewNotes[draggableId] || ''
        })
        .eq('id', draggableId);

      if (error) throw error;

      toast.success(`Triplet moved to ${destColumn.title}`);

      // Se aprovado, sincronizar com Neo4j
      if (destination.droppableId === 'approved') {
        syncToNeo4j();
      }
    } catch (error: any) {
      toast.error('Error updating triplet status');
      console.error('Error:', error);
      fetchTriplets(); // Reverter mudanças
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTriplets.size === 0) {
      toast.error('No triplets selected');
      return;
    }

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'approved',
          reviewed_by: userId,
          review_date: new Date().toISOString()
        })
        .in('id', Array.from(selectedTriplets));

      if (error) throw error;

      toast.success(`Approved ${selectedTriplets.size} triplets`);
      setSelectedTriplets(new Set());
      fetchTriplets();
      syncToNeo4j();
    } catch (error: any) {
      toast.error('Error approving triplets');
      console.error('Error:', error);
    }
  };

  const handleAutoApprove = async (minConfidence: number = 0.9) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'approved',
          reviewed_by: userId,
          review_date: new Date().toISOString(),
          auto_approved: true
        })
        .eq('curation_status', 'pending')
        .gte('extraction_confidence', minConfidence);

      if (error) throw error;

      toast.success(`Auto-approved high-confidence triplets`);
      fetchTriplets();
      syncToNeo4j();
    } catch (error: any) {
      toast.error('Error auto-approving triplets');
      console.error('Error:', error);
    }
  };

  const syncToNeo4j = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-approved-triplets');
      
      if (error) throw error;
      
      if (data?.results) {
        toast.success(`Synced ${data.results.synced} triplets to Neo4j`);
      }
    } catch (error: any) {
      console.error('Neo4j sync error:', error);
      toast.error('Failed to sync with Neo4j');
    }
  };

  const toggleTripletSelection = (tripletId: string) => {
    const newSelection = new Set(selectedTriplets);
    if (newSelection.has(tripletId)) {
      newSelection.delete(tripletId);
    } else {
      newSelection.add(tripletId);
    }
    setSelectedTriplets(newSelection);
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-green-500';
    if (confidence >= 0.70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLayerBadge = (layer: string | null) => {
    if (!layer) return null;
    const layerColors: Record<string, string> = {
      'layer_0_compound': 'bg-purple-500',
      'layer_1_target': 'bg-blue-500',
      'layer_2_mechanism': 'bg-cyan-500',
      'layer_3_effect': 'bg-orange-500',
      'layer_4_outcome': 'bg-green-500',
    };
    const layerLabels: Record<string, string> = {
      'layer_0_compound': 'L0',
      'layer_1_target': 'L1',
      'layer_2_mechanism': 'L2',
      'layer_3_effect': 'L3',
      'layer_4_outcome': 'L4',
    };
    return (
      <Badge className={`${layerColors[layer] || 'bg-gray-500'} text-white text-[9px] px-1`}>
        {layerLabels[layer] || layer}
      </Badge>
    );
  };

  const getEvidenceBadge = (level: string | null) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      'high': 'bg-green-500',
      'moderate': 'bg-yellow-500',
      'low': 'bg-orange-500',
      'very_low': 'bg-red-500',
    };
    return (
      <Badge className={`${colors[level] || 'bg-gray-500'} text-white text-[9px]`}>
        {level}
      </Badge>
    );
  };

  const filteredColumns = Object.entries(columns).reduce((acc, [key, col]) => {
    const filtered = col.triplets.filter(t => {
      const matchesSearch = searchTerm === '' || 
        t.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.object_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.predicate.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesConfidence = t.extraction_confidence >= confidenceFilter;
      
      return matchesSearch && matchesConfidence;
    });

    acc[key] = { ...col, triplets: filtered };
    return acc;
  }, {} as Record<string, Column>);

  return (
    <div className="space-y-4">
      {/* Header e controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Triplet Curation Board
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAutoApprove(0.9)}
              >
                Auto-Approve High Confidence
              </Button>
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedTriplets.size === 0}
              >
                Bulk Approve ({selectedTriplets.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={syncToNeo4j}
              >
                Sync to Neo4j
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search triplets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                placeholder="Min Confidence (0-1)"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              Total: {Object.values(columns).reduce((sum, col) => sum + col.triplets.length, 0)} triplets
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(filteredColumns).map(([columnId, column]) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <Card className={snapshot.isDraggingOver ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {column.title}
                      <Badge variant="outline">{column.triplets.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[400px]"
                    >
                      {column.triplets.map((triplet, index) => (
                        <Draggable key={triplet.id} draggableId={triplet.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                cursor-move p-3 space-y-2
                                ${snapshot.isDragging ? 'shadow-lg' : ''}
                                ${selectedTriplets.has(triplet.id) ? 'ring-2 ring-primary' : ''}
                              `}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                  toggleTripletSelection(triplet.id);
                                }
                              }}
                            >
                              {/* Triplet content with VetGraphRAG layers */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs">
                                  {getLayerBadge(triplet.subject_layer)}
                                  <Badge variant="outline" className="text-[10px]">
                                    {triplet.subject_type}
                                  </Badge>
                                  <span className="font-semibold truncate flex-1">{triplet.subject_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <ArrowRight className="h-3 w-3" />
                                  <Badge className="text-[10px]">{triplet.predicate}</Badge>
                                  {triplet.relationship_category && (
                                    <span className="text-[9px] text-muted-foreground">({triplet.relationship_category})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  {getLayerBadge(triplet.object_layer)}
                                  <Badge variant="outline" className="text-[10px]">
                                    {triplet.object_type}
                                  </Badge>
                                  <span className="font-semibold truncate flex-1">{triplet.object_name}</span>
                                </div>
                              </div>

                              {/* VetGraphRAG enrichment */}
                              {(triplet.evidence_level || triplet.intensity !== null || triplet.mechanism_path) && (
                                <div className="pt-1 border-t border-dashed space-y-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {getEvidenceBadge(triplet.evidence_level)}
                                    {triplet.intensity !== null && (
                                      <Badge variant="secondary" className="text-[9px]">
                                        Int: {(triplet.intensity * 100).toFixed(0)}%
                                      </Badge>
                                    )}
                                    {triplet.species_context && triplet.species_context.length > 0 && (
                                      <Badge variant="outline" className="text-[9px]">
                                        🐾 {triplet.species_context.join(', ')}
                                      </Badge>
                                    )}
                                  </div>
                                  {triplet.mechanism_path && triplet.mechanism_path.length > 0 && (
                                    <div className="text-[9px] text-muted-foreground bg-muted/50 p-1 rounded">
                                      <span className="font-medium">Path:</span> {triplet.mechanism_path.join(' → ')}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Scores */}
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex gap-1">
                                  <Badge className={`${getConfidenceBadgeColor(triplet.extraction_confidence)} text-white`}>
                                    {(triplet.extraction_confidence * 100).toFixed(0)}%
                                  </Badge>
                                  {triplet.auto_approved && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Auto
                                    </Badge>
                                  )}
                                  {triplet.synced_to_neo4j && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Synced
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Review notes input (only for reviewing) */}
                              {columnId === 'reviewing' && (
                                <Textarea
                                  placeholder="Review notes..."
                                  value={reviewNotes[triplet.id] || ''}
                                  onChange={(e) => setReviewNotes({ ...reviewNotes, [triplet.id]: e.target.value })}
                                  rows={2}
                                  className="text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TripletCurationBoard;
