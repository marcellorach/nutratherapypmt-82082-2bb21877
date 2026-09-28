import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildItemPerformance, type ItemPerfRow, type ItemType, type ReviewRow, type Verdict } from "./extractionItemReviews.pure";

export * from "./extractionItemReviews.pure";

// A tabela é nova e ainda pode não estar nos tipos gerados.
const table = () => (supabase as any).from("extraction_item_reviews");

export function useStudyItemReviews(studyId: string | undefined) {
  return useQuery({
    queryKey: ["extraction-item-reviews", studyId],
    enabled: !!studyId,
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await table()
        .select("study_id, item_type, item_key, verdict")
        .eq("study_id", studyId)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });
}

export function useSetItemReview(studyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, key, verdict }: { type: ItemType; key: string; verdict: Verdict | null }) => {
      const now = new Date().toISOString();
      const { error: delErr } = await table()
        .update({ deleted_at: now })
        .eq("study_id", studyId).eq("item_type", type).eq("item_key", key).is("deleted_at", null);
      if (delErr) throw delErr;
      if (verdict) {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await table().insert({ study_id: studyId, item_type: type, item_key: key, verdict, reviewed_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extraction-item-reviews", studyId] });
      qc.invalidateQueries({ queryKey: ["extraction-item-performance"] });
    },
  });
}

export function useExtractionItemPerformance() {
  return useQuery<ItemPerfRow[]>({
    queryKey: ["extraction-item-performance"],
    staleTime: 60_000,
    queryFn: async () => {
      const [studies, extractions, reviews] = await Promise.all([
        supabase.from("processed_studies").select("id, ingestion_stages").limit(5000),
        supabase.from("study_extractions").select("study_id, extracted_data").limit(5000),
        table().select("study_id, item_type, item_key, verdict").is("deleted_at", null).limit(20000),
      ]);
      if (studies.error) throw studies.error;
      if (extractions.error) throw extractions.error;
      if (reviews.error) throw reviews.error;
      const stages = new Map((studies.data ?? []).map((s: any) => [s.id, s.ingestion_stages]));
      const rows = (extractions.data ?? []).map((e: any) => ({
        study_id: e.study_id,
        ingestion_stages: (stages.get(e.study_id) ?? null) as Record<string, any> | null,
        extracted_data: e.extracted_data as Record<string, any> | null,
      }));
      return buildItemPerformance(rows, (reviews.data ?? []) as ReviewRow[]);
    },
  });
}
