import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformCounts {
  studies: number | null;
  nutraceuticals: number | null;
  conditions: number | null;
  breeds: number | null;
  predispositions: number | null;
}

/**
 * Real-time platform counts for the landing page. Returns `null` per field on
 * failure so the UI can hide rather than show fake numbers (no-mock policy).
 */
export function usePlatformCounts() {
  return useQuery<PlatformCounts>({
    queryKey: ['platform-counts'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const safeCount = async (table: string): Promise<number | null> => {
        try {
          const { count, error } = await (supabase as any)
            .from(table)
            .select('*', { count: 'exact', head: true });
          if (error) return null;
          return count ?? null;
        } catch {
          return null;
        }
      };
      const [studies, nutraceuticals, conditions, breeds, predispositions] =
        await Promise.all([
          safeCount('scientific_studies'),
          safeCount('nutraceuticals'),
          safeCount('health_conditions'),
          safeCount('breeds'),
          safeCount('breed_predispositions'),
        ]);
      return { studies, nutraceuticals, conditions, breeds, predispositions };
    },
  });
}
