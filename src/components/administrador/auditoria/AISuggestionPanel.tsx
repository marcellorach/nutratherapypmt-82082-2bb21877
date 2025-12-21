import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Brain,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { TAXONOMY_CATEGORIES } from '@/data/biomedical-taxonomy';

interface AISuggestion {
  id?: string;
  entity: string;
  suggested_category: string;
  confidence: number;
  reasoning: string;
  alternative_categories?: string[];
  status?: 'pending' | 'accepted' | 'rejected';
}

interface UnclassifiedEntity {
  name: string;
  current_type: string;
  source_id: string;
  source: 'triplet_subject' | 'triplet_object';
}

const AISuggestionPanel: React.FC = () => {
  const { t } = useTranslation();
  const [unclassifiedEntities, setUnclassifiedEntities] = useState<UnclassifiedEntity[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadUnclassifiedEntities = useCallback(async () => {
    setLoading(true);
    try {
      const { data: triplets, error } = await supabase
        .from('triplet_extractions')
        .select('id, subject_name, subject_type, object_name, object_type')
        .or('subject_type.eq.Unknown,object_type.eq.Unknown,subject_type.is.null,object_type.is.null')
        .limit(200);

      if (error) throw error;

      const entities: UnclassifiedEntity[] = [];
      const seen = new Set<string>();

      triplets?.forEach(triplet => {
        if ((triplet.subject_type === 'Unknown' || !triplet.subject_type) && !seen.has(triplet.subject_name)) {
          seen.add(triplet.subject_name);
          entities.push({
            name: triplet.subject_name,
            current_type: triplet.subject_type || 'Unknown',
            source_id: triplet.id,
            source: 'triplet_subject'
          });
        }
        if ((triplet.object_type === 'Unknown' || !triplet.object_type) && !seen.has(triplet.object_name)) {
          seen.add(triplet.object_name);
          entities.push({
            name: triplet.object_name,
            current_type: triplet.object_type || 'Unknown',
            source_id: triplet.id,
            source: 'triplet_object'
          });
        }
      });

      setUnclassifiedEntities(entities);
    } catch (error) {
      console.error('Error loading unclassified entities:', error);
      toast.error(t('ontologyAudit.aiSuggestions.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadPendingSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('taxonomy_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingSuggestions(data?.map(s => ({
        id: s.id,
        entity: s.entity_name,
        suggested_category: s.suggested_category,
        confidence: Number(s.confidence),
        reasoning: s.reasoning || '',
        alternative_categories: s.alternative_categories || [],
        status: s.status as 'pending' | 'accepted' | 'rejected'
      })) || []);
    } catch (error) {
      console.error('Error loading pending suggestions:', error);
    }
  }, []);

  useEffect(() => {
    loadUnclassifiedEntities();
    loadPendingSuggestions();
  }, [loadUnclassifiedEntities, loadPendingSuggestions]);

  const analyzeWithAI = async () => {
    if (unclassifiedEntities.length === 0) {
      toast.info(t('ontologyAudit.aiSuggestions.noEntities'));
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setSuggestions([]);

    try {
      // Process in batches of 10
      const batchSize = 10;
      const entitiesToAnalyze = unclassifiedEntities.slice(0, 50); // Limit to 50
      const batches = [];
      
      for (let i = 0; i < entitiesToAnalyze.length; i += batchSize) {
        batches.push(entitiesToAnalyze.slice(i, i + batchSize));
      }

      const allSuggestions: AISuggestion[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setProgress(((i + 1) / batches.length) * 100);

        const { data, error } = await supabase.functions.invoke('suggest-taxonomy-terms', {
          body: {
            entities: batch.map(e => e.name),
            context: 'veterinary nutraceutical research'
          }
        });

        if (error) {
          console.error('Error calling AI:', error);
          continue;
        }

        if (data?.suggestions) {
          allSuggestions.push(...data.suggestions);
        }
      }

      setSuggestions(allSuggestions);

      // Save suggestions to database
      if (allSuggestions.length > 0) {
        const { error } = await supabase
          .from('taxonomy_suggestions')
          .insert(allSuggestions.map(s => ({
            entity_name: s.entity,
            suggested_category: s.suggested_category,
            confidence: s.confidence,
            reasoning: s.reasoning,
            alternative_categories: s.alternative_categories || [],
            status: 'pending'
          })));

        if (error) {
          console.error('Error saving suggestions:', error);
        } else {
          loadPendingSuggestions();
        }
      }

      toast.success(t('ontologyAudit.aiSuggestions.analysisComplete', { count: allSuggestions.length }));
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast.error(t('ontologyAudit.aiSuggestions.errorAnalyzing'));
    } finally {
      setAnalyzing(false);
      setProgress(100);
    }
  };

  const handleAccept = async (suggestion: AISuggestion) => {
    try {
      // Add to taxonomy dictionary
      const { error: insertError } = await supabase
        .from('taxonomy_dictionaries')
        .insert({
          category: suggestion.suggested_category,
          term: suggestion.entity,
          term_normalized: suggestion.entity.toLowerCase().trim(),
          source: 'ai_suggested'
        });

      if (insertError) throw insertError;

      // Update suggestion status
      if (suggestion.id) {
        const { error: updateError } = await supabase
          .from('taxonomy_suggestions')
          .update({ status: 'accepted', reviewed_at: new Date().toISOString() })
          .eq('id', suggestion.id);

        if (updateError) throw updateError;
      }

      toast.success(t('ontologyAudit.aiSuggestions.accepted', { entity: suggestion.entity }));
      loadPendingSuggestions();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error(t('ontologyAudit.aiSuggestions.errorAccepting'));
    }
  };

  const handleReject = async (suggestion: AISuggestion) => {
    try {
      if (suggestion.id) {
        const { error } = await supabase
          .from('taxonomy_suggestions')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('id', suggestion.id);

        if (error) throw error;
      }

      toast.info(t('ontologyAudit.aiSuggestions.rejected', { entity: suggestion.entity }));
      loadPendingSuggestions();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast.error(t('ontologyAudit.aiSuggestions.errorRejecting'));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryMeta = (key: string) => {
    return TAXONOMY_CATEGORIES.find(c => c.key === key);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('ontologyAudit.aiSuggestions.title')}
            </CardTitle>
            <CardDescription>
              {t('ontologyAudit.aiSuggestions.description')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <AlertCircle className="h-3 w-3 mr-1" />
              {unclassifiedEntities.length} {t('ontologyAudit.aiSuggestions.unclassified')}
            </Badge>
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || unclassifiedEntities.length === 0}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t('ontologyAudit.aiSuggestions.analyzeWithAI')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {analyzing && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('ontologyAudit.aiSuggestions.analyzing')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('ontologyAudit.aiSuggestions.tabs.pending')}
              {pendingSuggestions.length > 0 && (
                <Badge variant="secondary">{pendingSuggestions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unclassified">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t('ontologyAudit.aiSuggestions.tabs.unclassified')}
            </TabsTrigger>
            {suggestions.length > 0 && (
              <TabsTrigger value="results">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('ontologyAudit.aiSuggestions.tabs.results')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pending">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p>{t('ontologyAudit.aiSuggestions.noPending')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {pendingSuggestions.map((suggestion, idx) => {
                    const categoryMeta = getCategoryMeta(suggestion.suggested_category);
                    return (
                      <div 
                        key={suggestion.id || idx}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{suggestion.entity}</span>
                              <Badge 
                                variant="outline"
                                className={`${categoryMeta?.color || 'bg-gray-500'} text-white border-0`}
                              >
                                {suggestion.suggested_category.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={`${getConfidenceColor(suggestion.confidence)} text-white border-0`}
                              >
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <Info className="h-3 w-3 inline mr-1" />
                              {suggestion.reasoning}
                            </p>
                            {suggestion.alternative_categories && suggestion.alternative_categories.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{t('ontologyAudit.aiSuggestions.alternatives')}:</span>
                                {suggestion.alternative_categories.map(alt => (
                                  <Badge key={alt} variant="outline" className="text-xs">
                                    {alt.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccept(suggestion)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {t('ontologyAudit.aiSuggestions.accept')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(suggestion)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="unclassified">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : unclassifiedEntities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p>{t('ontologyAudit.aiSuggestions.allClassified')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pr-4">
                  {unclassifiedEntities.slice(0, 100).map((entity, idx) => (
                    <div 
                      key={idx}
                      className="p-2 border rounded text-sm bg-muted/30"
                    >
                      <span className="font-medium">{entity.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {entity.current_type}
                      </Badge>
                    </div>
                  ))}
                </div>
                {unclassifiedEntities.length > 100 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {t('ontologyAudit.aiSuggestions.andMore', { count: unclassifiedEntities.length - 100 })}
                  </p>
                )}
              </ScrollArea>
            )}
          </TabsContent>

          {suggestions.length > 0 && (
            <TabsContent value="results">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {suggestions.map((suggestion, idx) => {
                    const categoryMeta = getCategoryMeta(suggestion.suggested_category);
                    return (
                      <div 
                        key={idx}
                        className="p-4 border rounded-lg bg-green-50/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{suggestion.entity}</span>
                            <Badge 
                              variant="outline"
                              className={`ml-2 ${categoryMeta?.color || 'bg-gray-500'} text-white border-0`}
                            >
                              {suggestion.suggested_category.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={`ml-1 ${getConfidenceColor(suggestion.confidence)} text-white border-0`}
                            >
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AISuggestionPanel;
