import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GapFillResult {
  pairs_searched: number;
  studies_added: number;
  triplets_pending: number;
  message?: string;
  details?: any[];
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

export function useTriggerGapFill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pet_id?: string; condition_id?: string; compound_ids?: string[]; max_pairs?: number }) => {
      const { data, error } = await supabase.functions.invoke('kg-evidence-gap-fill', { body: input });
      if (error) throw error;
      return data as GapFillResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kg-gap-fill-pending'] });
    },
  });
}