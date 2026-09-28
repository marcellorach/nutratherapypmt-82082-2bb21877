import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UNRECORDED_MODEL, type ReviewRow, type ItemCounts } from "@/hooks/extractionItemReviews.pure";
import { buildStudyPerformance, type StudyPerfRow } from "@/hooks/studyPerformance.pure";

function useStudyPerformance() {
  return useQuery<StudyPerfRow[]>({
    queryKey: ["study-performance"],
    staleTime: 60_000,
    queryFn: async () => {
      const [studies, extractions, reviews, triplets] = await Promise.all([
        supabase.from("processed_studies").select("id, title, ingestion_stages, error_message").limit(5000),
        supabase.from("study_extractions").select("study_id, extracted_data").limit(5000),
        (supabase as any).from("extraction_item_reviews").select("study_id, item_type, item_key, verdict").is("deleted_at", null).limit(20000),
        supabase.from("triplet_extractions").select("study_id, curation_status").limit(20000),
      ]);
      for (const r of [studies, extractions, reviews, triplets]) if (r.error) throw r.error;
      return buildStudyPerformance(
        (studies.data ?? []) as any,
        (extractions.data ?? []) as any,
        (reviews.data ?? []) as ReviewRow[],
        (triplets.data ?? []) as any,
      );
    },
  });
}

const StudyPerformanceTable: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useStudyPerformance();
  const k = (s: string) => t(`aiGovernance.performance.studies.${s}`);
  const items = (c: ItemCounts) => (
    <TableCell className="text-right whitespace-nowrap text-xs">
      {c.extracted} · <span className="text-primary">{c.correct}✓</span> · <span className="text-destructive">{c.incorrect}✗</span> · {c.pending}?
    </TableCell>
  );

  return (
    <section className="space-y-2" aria-label={k("title")}>
      <h3 className="text-sm font-semibold">{k("title")}</h3>
      <p className="text-xs text-muted-foreground">{k("description")}</p>
      {isLoading && <Skeleton className="h-24 w-full" />}
      {error && <p className="text-sm text-destructive">{t("aiGovernance.performance.loadError", { error: (error as Error).message })}</p>}
      {data && data.length === 0 && <p className="text-sm text-muted-foreground">{k("empty")}</p>}
      {data && data.length > 0 && (
        <div className="max-h-[480px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{k("study")}</TableHead>
                <TableHead>{t("aiGovernance.performance.col.model")}</TableHead>
                <TableHead className="text-right">{k("conditions")}</TableHead>
                <TableHead className="text-right">{k("doses")}</TableHead>
                <TableHead className="text-right">{k("triplets")}</TableHead>
                <TableHead>{k("failure")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.studyId}>
                  <TableCell className="max-w-[260px] truncate text-xs" title={r.title}>{r.title}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.model === UNRECORDED_MODEL ? t("aiGovernance.performance.items.unrecorded") : r.model}
                  </TableCell>
                  {items(r.condition)}
                  {items(r.dose)}
                  <TableCell className="text-right whitespace-nowrap text-xs">
                    <span className="text-primary">{r.triplets.approved}✓</span> · <span className="text-destructive">{r.triplets.rejected}✗</span> · {r.triplets.pending}?
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.error
                      ? <Badge variant="destructive" className="max-w-[200px] truncate" title={r.error}>{r.error}</Badge>
                      : <span className="text-muted-foreground">{k("noFailure")}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{k("legend")}</p>
    </section>
  );
};

export default StudyPerformanceTable;
