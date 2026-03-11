import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BaseKnowledgeStats {
  ontologyManual: number;
  ontologyChEBI: number;
  nutraceuticals: number;
  conditions: number;
  outcomes: number;
  pathways: number;
  total: number;
}

export interface ExtractedKnowledgeStats {
  entitiesAI: number;
  relationsAI: number;
  activeStudies: number;
  pendingTriplets: number;
  approvedTriplets: number;
  totalFromStudies: number;
}

export interface GraphStructureStats {
  totalNodes: number;
  totalRelations: number;
  positiveRelations: number;
  negativeRelations: number;
  nutraceuticalsInGraph: number;
  conditionsInGraph: number;
  coverageNutraceuticals: number;
  coverageConditions: number;
}

export interface KnowledgeGraphStatsData {
  base: BaseKnowledgeStats;
  extracted: ExtractedKnowledgeStats;
  graph: GraphStructureStats;
}

interface UseKnowledgeGraphStatsReturn {
  stats: KnowledgeGraphStatsData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKnowledgeGraphStats(studyId?: string): UseKnowledgeGraphStatsReturn {
  const [stats, setStats] = useState<KnowledgeGraphStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all stats in parallel
      const [
        // Base Knowledge
        ontologyManualResult,
        ontologyChEBIResult,
        nutraceuticalsResult,
        conditionsResult,
        outcomesResult,
        pathwaysResult,
        // Extracted Knowledge
        entitiesAIResult,
        relationsAIResult,
        activeStudiesResult,
        pendingTripletsResult,
        approvedTripletsResult,
        // Graph Structure - from Neo4j via edge function
        graphResult
      ] = await Promise.all([
        // Base Knowledge queries
        supabase
          .from('veterinary_ontology')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'manual'),
        supabase
          .from('veterinary_ontology')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'ChEBI'),
        supabase
          .from('nutraceuticals')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('health_conditions')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('outcome_families')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('veterinary_ontology')
          .select('*', { count: 'exact', head: true })
          .eq('layer', 'layer_2_mechanism'),
        // Extracted Knowledge queries
        supabase
          .from('veterinary_ontology')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'gemini_extraction'),
        supabase
          .from('hierarchical_edges')
          .select('*', { count: 'exact', head: true })
          .not('study_ids', 'is', null),
        studyId
          ? supabase
              .from('processed_studies')
              .select('*', { count: 'exact', head: true })
              .eq('id', studyId)
              .is('deleted_at', null)
          : supabase
              .from('processed_studies')
              .select('*', { count: 'exact', head: true })
              .eq('kanban_status', 'approved')
              .is('deleted_at', null),
        (() => {
          let q = supabase
            .from('triplet_extractions')
            .select('*', { count: 'exact', head: true })
            .eq('curation_status', 'pending');
          if (studyId) q = q.eq('study_id', studyId);
          return q;
        })(),
        (() => {
          let q = supabase
            .from('triplet_extractions')
            .select('*', { count: 'exact', head: true })
            .eq('curation_status', 'approved');
          if (studyId) q = q.eq('study_id', studyId);
          return q;
        })(),
        // Graph structure from Neo4j
        supabase.functions.invoke('graph-rag-search', {
          body: {
            queryType: 'stats'
          }
        })
      ]);

      // Parse base knowledge stats
      const baseStats: BaseKnowledgeStats = {
        ontologyManual: ontologyManualResult.count || 0,
        ontologyChEBI: ontologyChEBIResult.count || 0,
        nutraceuticals: nutraceuticalsResult.count || 0,
        conditions: conditionsResult.count || 0,
        outcomes: outcomesResult.count || 0,
        pathways: pathwaysResult.count || 0,
        total: (ontologyManualResult.count || 0) + 
               (ontologyChEBIResult.count || 0) + 
               (nutraceuticalsResult.count || 0) + 
               (conditionsResult.count || 0) +
               (outcomesResult.count || 0) +
               (pathwaysResult.count || 0)
      };

      // Parse extracted knowledge stats
      const extractedStats: ExtractedKnowledgeStats = {
        entitiesAI: entitiesAIResult.count || 0,
        relationsAI: relationsAIResult.count || 0,
        activeStudies: activeStudiesResult.count || 0,
        pendingTriplets: pendingTripletsResult.count || 0,
        approvedTriplets: approvedTripletsResult.count || 0,
        totalFromStudies: (entitiesAIResult.count || 0) + (relationsAIResult.count || 0)
      };

      // Parse graph structure stats from Neo4j response
      let graphStats: GraphStructureStats = {
        totalNodes: 0,
        totalRelations: 0,
        positiveRelations: 0,
        negativeRelations: 0,
        nutraceuticalsInGraph: 0,
        conditionsInGraph: 0,
        coverageNutraceuticals: 0,
        coverageConditions: 0
      };

      if (graphResult.data?.success && graphResult.data?.data) {
        const neo4jStats = graphResult.data.data;
        graphStats = {
          totalNodes: neo4jStats.totalNodes || 0,
          totalRelations: neo4jStats.totalRelations || 0,
          positiveRelations: neo4jStats.positiveRelations || 0,
          negativeRelations: neo4jStats.negativeRelations || 0,
          nutraceuticalsInGraph: neo4jStats.nutraceuticals || 0,
          conditionsInGraph: neo4jStats.conditions || 0,
          coverageNutraceuticals: baseStats.nutraceuticals > 0 
            ? Math.round((neo4jStats.nutraceuticals || 0) / baseStats.nutraceuticals * 100)
            : 0,
          coverageConditions: baseStats.conditions > 0
            ? Math.round((neo4jStats.conditions || 0) / baseStats.conditions * 100)
            : 0
        };
      }

      setStats({
        base: baseStats,
        extracted: extractedStats,
        graph: graphStats
      });

    } catch (err) {
      console.error('Error fetching KG stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats
  };
}
