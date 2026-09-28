import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  listExtractedItems, useSetItemReview, useStudyItemReviews,
  type ExtractedItem, type Verdict,
} from "@/hooks/useExtractionItemReviews";

const ExtractionItemReviewPanel: React.FC<{ studyId: string }> = ({ studyId }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const extraction = useQuery({
    queryKey: ["study-extraction-items", studyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_extractions").select("extracted_data").eq("study_id", studyId).maybeSingle();
      if (error) throw error;
      return (data?.extracted_data ?? null) as Record<string, any> | null;
    },
  });
  const reviews = useStudyItemReviews(studyId);
  const setReview = useSetItemReview(studyId);

  const items = useMemo(() => listExtractedItems(extraction.data ?? null), [extraction.data]);
  const verdictOf = (it: ExtractedItem): Verdict | undefined =>
    reviews.data?.find((r) => r.item_type === it.type && r.item_key === it.key)?.verdict;

  const mark = (it: ExtractedItem, verdict: Verdict | null) =>
    setReview.mutate({ type: it.type, key: it.key, verdict }, {
      onError: (e) => toast({ variant: "destructive", title: t("itemReview.saveError"), description: (e as Error).message }),
    });

  if (extraction.isLoading) return null;
  if (items.length === 0) return null;

  const section = (type: ExtractedItem["type"]) => {
    const list = items.filter((i) => i.type === type);
    if (!list.length) return null;
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">{t(`itemReview.${type}s`)}</h4>
        <ul className="divide-y rounded-md border">
          {list.map((it) => {
            const v = verdictOf(it);
            return (
              <li key={it.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 break-words">{it.label || "—"}</span>
                <div className="flex items-center gap-1">
                  {v && <Badge variant={v === "correct" ? "secondary" : "destructive"}>{t(`itemReview.${v}`)}</Badge>}
                  {v ? (
                    <Button size="sm" variant="ghost" disabled={setReview.isPending} onClick={() => mark(it, null)} aria-label={t("itemReview.undo")}>
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" disabled={setReview.isPending} onClick={() => mark(it, "correct")}>
                        <Check className="mr-1 h-4 w-4" />{t("itemReview.markCorrect")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={setReview.isPending} onClick={() => mark(it, "incorrect")}>
                        <X className="mr-1 h-4 w-4" />{t("itemReview.markIncorrect")}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <section className="space-y-3 rounded-md border p-4" aria-label={t("itemReview.title")}>
      <div>
        <h3 className="text-sm font-semibold">{t("itemReview.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("itemReview.description")}</p>
      </div>
      {section("condition")}
      {section("dose")}
    </section>
  );
};

export default ExtractionItemReviewPanel;
