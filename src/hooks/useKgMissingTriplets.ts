import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MissingPair {
  condition_display: string;
  condition_id: string | null;
  origin: 'active' | 'predisposition';
  compound: string;
  reason: 'no_curated_link' | 'weak_efficacy';
  best_efficacy_0_5: number | null;
  relationship: string | null;
}

export interface PerConditionGap {
  condition_display: string;
  condition_id: string | null;
  origin: 'active' | 'predisposition';
  total_compounds: number;
  covered_compounds: number;
  missing_compounds: string[];
  has_any_curated_link: boolean;
  severity?: string | null;
  risk_factor?: number | null;
}

export interface KgMissingTripletsResult {
  pet: { id: string; name: string; breed: string };
  recommended_compounds: string[];
  conditions_total: number;
  conditions_without_any_curated_link: number;
  compounds_total: number;
  missing_pairs: MissingPair[];
  per_condition: PerConditionGap[];
  generated_at: string;
}

/** Admin-only. Returns the (condition × compound) gaps that prevent the
 * Senex AI protocol from generating measurable years_gained for this pet. */
export function useKgMissingTriplets(
  petId: string | null | undefined,
  recommendedCompounds: string[] | null,
  enabled: boolean,
) {
  const stackKey = (recommendedCompounds || []).slice().sort().join('|');
  return useQuery<KgMissingTripletsResult>({
    queryKey: ['kg-missing-triplets', petId, stackKey],
    enabled: !!petId && enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('kg-missing-triplets', {
        body: { pet_id: petId, recommended_compounds: recommendedCompounds || [] },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as KgMissingTripletsResult;
    },
  });
}