import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GapFillResult {
  pairs_searched: number;
  studies_added: number;
  triplets_pending: number;
  message?: string;
  details?: any[];
}

export interface DirectedPair {
  compound_en: string;
  condition_en: string;
  compound_id?: string;
  condition_id?: string;
}

export function usePendingGapFillTriplets() {
  return useQuery({
    queryKey: ['kg-gap-fill-pending'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('triplet_extractions')
        .select('id', { count: 'exact', head: true })
        .eq('curation_status', 'pending')
        .contains('approval_chain', { source: 'pubmed_gap_fill' });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetches pending triplets created by the KG Evidence Gap-Fill pipeline that
 * are relevant to a given pet — i.e. either the subject (compound) is in the
 * recommended stack or the object (condition) is among the pet's conditions.
 *
 * Used by PatientKnowledgeSubgraph to render provisional edges (dashed amber)
 * so the vet can visually see which gaps were just filled by Perplexity/PubMed
 * but are still awaiting curation.
 */
export function usePatientPendingGapFillTriplets(
  petId: string | null | undefined,
  recommendedCompoundsEn: string[],
  conditionsEn: string[],
  enabled: boolean = true,
) {
  const stackKey = (recommendedCompoundsEn || []).slice().sort().join('|');
  const condKey = (conditionsEn || []).slice().sort().join('|');
  return useQuery({
    queryKey: ['patient-pending-gap-fill-triplets', petId, stackKey, condKey],
    enabled: !!petId && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!recommendedCompoundsEn.length && !conditionsEn.length) return [];
      // Filter approval_chain.source ∈ {pubmed_gap_fill, perplexity_gap_fill}.
      // Supabase JS doesn't support IN on jsonb fields, so we run two queries.
      const sources = ['pubmed_gap_fill', 'perplexity_gap_fill'];
      const all: any[] = [];
      for (const src of sources) {
        const { data, error } = await supabase
          .from('triplet_extractions')
          .select('id, subject_name, predicate, object_name, extraction_confidence, evidence_level, approval_chain, study_id')
          .eq('curation_status', 'pending')
          .contains('approval_chain', { source: src })
          .limit(200);
        if (error) throw error;
        if (data) all.push(...data);
      }
      // Client-side narrow to triplets whose subject OR object matches the pet's stack/conditions.
      const stackLower = new Set(recommendedCompoundsEn.map(s => s.toLowerCase().trim()));
      const condLower = new Set(conditionsEn.map(s => s.toLowerCase().trim()));
      return all.filter((t: any) => {
        const s = String(t.subject_name || '').toLowerCase().trim();
        const o = String(t.object_name || '').toLowerCase().trim();
        return stackLower.has(s) || condLower.has(o) || stackLower.has(o) || condLower.has(s);
      });
    },
  });
}

export function useTriggerGapFill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pet_id?: string;
      condition_id?: string;
      compound_ids?: string[];
      pairs?: DirectedPair[];
      max_pairs?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('kg-evidence-gap-fill', { body: input });
      if (error) throw error;
      return data as GapFillResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kg-gap-fill-pending'] });
    },
  });
}