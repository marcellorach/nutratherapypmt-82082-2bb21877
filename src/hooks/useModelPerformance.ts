import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildModelPerformance, type PerfResult } from "./useModelPerformance.pure";

export * from "./useModelPerformance.pure";

export const PERF_WINDOW_DAYS = 180;

export function useModelPerformance() {
  return useQuery<PerfResult & { windowDays: number }>({
    queryKey: ["model-performance", PERF_WINDOW_DAYS],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - PERF_WINDOW_DAYS * 86_400_000).toISOString();
      const [inv, studies, triplets] = await Promise.all([
        supabase.from("ai_task_invocations").select("task_id, model_id, ok, created_at").gte("created_at", since).limit(10000),
        supabase.from("processed_studies").select("ingestion_stages").not("ingestion_stages", "is", null).limit(5000),
        supabase.from("triplet_extractions").select("created_at, curation_status").gte("created_at", since).limit(10000),
      ]);
      if (inv.error) throw inv.error;
      if (studies.error) throw studies.error;
      if (triplets.error) throw triplets.error;
      const result = buildModelPerformance(
        (inv.data ?? []) as any,
        (studies.data ?? []) as any,
        (triplets.data ?? []) as any,
      );
      return { ...result, windowDays: PERF_WINDOW_DAYS };
    },
  });
}
