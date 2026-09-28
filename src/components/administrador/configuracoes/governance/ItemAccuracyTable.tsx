import React from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { itemAccuracy, UNRECORDED_MODEL, useExtractionItemPerformance, type ItemCounts } from "@/hooks/useExtractionItemReviews";

const ItemAccuracyTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data, isLoading, error } = useExtractionItemPerformance();

  const cells = (c: ItemCounts) => {
    const acc = itemAccuracy(c);
    return (
      <>
        <TableCell className="text-right">{c.extracted}</TableCell>
        <TableCell className="text-right">{c.correct}</TableCell>
        <TableCell className="text-right">{c.incorrect}</TableCell>
        <TableCell className="text-right">{c.pending}</TableCell>
        <TableCell className="text-right">{acc == null ? "—" : `${acc.toLocaleString(i18n.language)}%`}</TableCell>
      </>
    );
  };
  const heads = (prefix: string) => (["extracted", "correct", "incorrect", "pending", "accuracy"] as const).map((k) => (
    <TableHead key={prefix + k} className="text-right">{t(`aiGovernance.performance.items.col.${k}`)}</TableHead>
  ));

  return (
    <section className="space-y-2" aria-label={t("aiGovernance.performance.items.title")}>
      <h3 className="text-sm font-semibold">{t("aiGovernance.performance.items.title")}</h3>
      <p className="text-xs text-muted-foreground">{t("aiGovernance.performance.items.description")}</p>
      {isLoading && <Skeleton className="h-24 w-full" />}
      {error && <p className="text-sm text-destructive">{t("aiGovernance.performance.loadError", { error: (error as Error).message })}</p>}
      {data && data.length === 0 && <p className="text-sm text-muted-foreground">{t("aiGovernance.performance.items.empty")}</p>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2}>{t("aiGovernance.performance.col.model")}</TableHead>
                <TableHead colSpan={5} className="text-center">{t("aiGovernance.performance.items.conditions")}</TableHead>
                <TableHead colSpan={5} className="text-center">{t("aiGovernance.performance.items.doses")}</TableHead>
              </TableRow>
              <TableRow>{heads("c")}{heads("d")}</TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.model}>
                  <TableCell className="font-mono text-xs">
                    {r.model === UNRECORDED_MODEL ? t("aiGovernance.performance.items.unrecorded") : r.model}
                  </TableCell>
                  {cells(r.condition)}
                  {cells(r.dose)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default ItemAccuracyTable;
