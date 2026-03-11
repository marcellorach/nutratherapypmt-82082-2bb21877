import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface SectionStats {
  count: number;
  label: string;
}

const fetchCount = async (table: TableName): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
};

export const useSystemGuideStats = (sectionStep: string | null) => {
  return useQuery({
    queryKey: ['system-guide-stats', sectionStep],
    queryFn: async (): Promise<SectionStats[]> => {
      if (!sectionStep) return [];

      const tableMap: Record<string, { table: string; labelKey: string }[]> = {
        'estudos': [
          { table: 'scientific_studies', labelKey: 'studies' },
          { table: 'processed_studies', labelKey: 'processed' },
        ],
        'processamento-ia': [
          { table: 'triplet_extractions', labelKey: 'triplets' },
          { table: 'evidence_claims', labelKey: 'claims' },
          { table: 'study_embeddings', labelKey: 'embeddings' },
        ],
        'nutraceuticals-unified': [
          { table: 'nutraceuticals', labelKey: 'nutraceuticals' },
          { table: 'nutraceutical_categories', labelKey: 'categories' },
          { table: 'nutraceutical_conditions', labelKey: 'associations' },
        ],
        'veterinary-targets': [
          { table: 'health_conditions', labelKey: 'conditions' },
          { table: 'mechanism_nodes', labelKey: 'mechanisms' },
          { table: 'pathway_nodes', labelKey: 'pathways' },
          { table: 'biological_effect_nodes', labelKey: 'effects' },
        ],
        'breeds-management': [
          { table: 'breeds', labelKey: 'breeds' },
          { table: 'breed_groups', labelKey: 'groups' },
          { table: 'breed_predispositions', labelKey: 'predispositions' },
        ],
        'lab-references': [
          { table: 'lab_reference_ranges', labelKey: 'ranges' },
        ],
        'base-knowledge': [
          { table: 'base_knowledge_candidates', labelKey: 'candidates' },
        ],
        'knowledge-graph': [
          { table: 'medical_knowledge_graph', labelKey: 'nodes' },
          { table: 'medical_knowledge_edges', labelKey: 'edges' },
        ],
        'relacoes': [
          { table: 'hierarchical_edges', labelKey: 'edges' },
          { table: 'canonical_resolutions', labelKey: 'resolutions' },
        ],
        'ontology-audit': [
          { table: 'evidence_conflicts', labelKey: 'conflicts' },
          { table: 'canonical_resolutions', labelKey: 'resolutions' },
          { table: 'audit_reports', labelKey: 'reports' },
        ],
        'ai-insights': [
          { table: 'auto_discoveries', labelKey: 'discoveries' },
          { table: 'taxonomy_suggestions', labelKey: 'suggestions' },
        ],
        'knowledge-base-settings': [
          { table: 'ai_configurations', labelKey: 'configs' },
          { table: 'data_management_settings', labelKey: 'settings' },
        ],
      };

      const tables = tableMap[sectionStep];
      if (!tables) return [];

      const results = await Promise.all(
        tables.map(async (t) => ({
          count: await fetchCount(t.table),
          label: t.labelKey,
        }))
      );

      return results;
    },
    enabled: !!sectionStep,
    staleTime: 30_000,
  });
};
