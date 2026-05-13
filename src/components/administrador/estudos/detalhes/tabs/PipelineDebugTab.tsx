import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RefreshCw, ChevronDown, ChevronRight, Database, 
  Brain, Network, CheckCircle2, XCircle, AlertTriangle,
  FileText, Loader2, Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PipelineDebugTabProps {
  estudo: any;
  onRefresh?: () => void;
}

interface TripletData {
  id: string;
  subject_name: string;
  predicate: string;
  object_name: string;
  synced_to_neo4j: boolean;
  curation_status: string;
  extraction_confidence: number;
}

const PipelineDebugTab: React.FC<PipelineDebugTabProps> = ({ estudo, onRefresh }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [triplets, setTriplets] = useState<TripletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rawExtraction: true,
    entities: true,
    triplets: true,
    neo4j: true
  });

  useEffect(() => {
    loadTriplets();
  }, [estudo?.id]);

  const loadTriplets = async () => {
    if (!estudo?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('id, subject_name, predicate, object_name, synced_to_neo4j, curation_status, extraction_confidence')
        .eq('study_id', estudo.id);
      
      if (error) throw error;
      setTriplets(data || []);
    } catch (error: any) {
      console.error('Error loading triplets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToNeo4j = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-study-to-neo4j', {
        body: { studyId: estudo.id }
      });

      if (error) throw error;

      toast({
        title: 'Neo4J Sync Complete',
        description: `${data?.synced || 0} triplets synchronized to knowledge graph`,
      });

      loadTriplets();
      onRefresh?.();
    } catch (error: any) {
      console.error('Neo4J sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync to Neo4J',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const analysisData = estudo?.analysis_data;
  const extractedData = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
  
  const pendingSync = triplets.filter(t => !t.synced_to_neo4j).length;
  const syncedCount = triplets.filter(t => t.synced_to_neo4j).length;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-lg font-bold">{extractedData?.nutraceuticals?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Nutraceuticals</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-green-50 dark:bg-green-950/30">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-lg font-bold">{extractedData?.mechanisms?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Mechanisms</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-purple-50 dark:bg-purple-950/30">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-lg font-bold">{triplets.length}</div>
              <div className="text-xs text-muted-foreground">Triplets</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-600" />
            <div>
              <div className="text-lg font-bold">{syncedCount}/{triplets.length}</div>
              <div className="text-xs text-muted-foreground">Neo4J Synced</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Neo4J Sync Action */}
      {pendingSync > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {pendingSync} triplets pending Neo4J sync
                </p>
                <p className="text-sm text-amber-600">
                  Click to synchronize triplets to the knowledge graph
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSyncToNeo4j} 
              disabled={syncing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Sync to Neo4J
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Raw Extraction Data */}
      <Collapsible open={expandedSections.rawExtraction}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 flex flex-row items-center justify-between py-3"
              onClick={() => toggleSection('rawExtraction')}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Stage 1: Gemini Raw Extraction
              </CardTitle>
              {expandedSections.rawExtraction ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(extractedData, null, 2) || 'No extraction data available'}
                </pre>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2: Extracted Entities */}
      <Collapsible open={expandedSections.entities}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 flex flex-row items-center justify-between py-3"
              onClick={() => toggleSection('entities')}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Stage 2: Entity Extraction Summary
              </CardTitle>
              {expandedSections.entities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* Nutraceuticals */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Badge variant="outline" className="bg-blue-100">{extractedData?.nutraceuticals?.length || 0}</Badge>
                  Nutraceuticals
                </h4>
                <div className="flex flex-wrap gap-1">
                  {extractedData?.nutraceuticals?.map((n: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {n.name || n}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mechanisms */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Badge variant="outline" className="bg-green-100">{extractedData?.mechanisms?.length || 0}</Badge>
                  Mechanisms & Pathways
                </h4>
                <div className="flex flex-wrap gap-1">
                  {extractedData?.mechanisms?.map((m: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {m.name || m}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Biological Effects */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Badge variant="outline" className="bg-purple-100">{extractedData?.biological_effects?.length || 0}</Badge>
                  Biological Effects
                </h4>
                <div className="flex flex-wrap gap-1">
                  {extractedData?.biological_effects?.map((e: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {e.name || e}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Badge variant="outline" className="bg-amber-100">{extractedData?.conditions?.length || 0}</Badge>
                  Health Conditions
                </h4>
                <div className="flex flex-wrap gap-1">
                  {extractedData?.conditions?.map((c: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {c.name || c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Interactions */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Badge variant="outline" className="bg-red-100">{extractedData?.interactions?.length || 0}</Badge>
                  Interactions (Chain Mapping)
                </h4>
                <div className="space-y-1">
                  {(extractedData?.interactions || []).slice(0, 5).map((i: any, idx: number) => (
                    <div key={idx} className="text-xs bg-muted/50 p-2 rounded flex items-center gap-2">
                      <span className="font-medium">{i.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-xs">{i.type}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{i.to}</span>
                    </div>
                  ))}
                  {(extractedData?.interactions?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {(extractedData?.interactions?.length || 0) - 5} more
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Generated Triplets */}
      <Collapsible open={expandedSections.triplets}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 flex flex-row items-center justify-between py-3"
              onClick={() => toggleSection('triplets')}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4" />
                Stage 3: Senex AI Triplets
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); loadTriplets(); }}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              {expandedSections.triplets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {triplets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No triplets generated yet
                    </p>
                  ) : (
                    triplets.map((triplet) => (
                      <div 
                        key={triplet.id} 
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium text-blue-600">{triplet.subject_name}</span>
                          <Badge variant="outline" className="text-[10px]">{triplet.predicate}</Badge>
                          <span className="font-medium text-green-600">{triplet.object_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={triplet.curation_status === 'approved' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {triplet.curation_status}
                          </Badge>
                          {triplet.synced_to_neo4j ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Neo4J Status */}
      <Collapsible open={expandedSections.neo4j}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 flex flex-row items-center justify-between py-3"
              onClick={() => toggleSection('neo4j')}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Stage 4: Neo4J Knowledge Graph
              </CardTitle>
              {expandedSections.neo4j ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 text-center">
                  <div className="text-2xl font-bold text-green-700">{syncedCount}</div>
                  <div className="text-xs text-muted-foreground">Synced</div>
                </div>
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-center">
                  <div className="text-2xl font-bold text-amber-700">{pendingSync}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 text-center">
                  <div className="text-2xl font-bold text-blue-700">{triplets.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              
              {triplets.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button 
                    onClick={handleSyncToNeo4j} 
                    disabled={syncing || pendingSync === 0}
                    variant={pendingSync > 0 ? "default" : "outline"}
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Synchronizing...
                      </>
                    ) : pendingSync > 0 ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Sync {pendingSync} Triplets to Neo4J
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        All Synced
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default PipelineDebugTab;
