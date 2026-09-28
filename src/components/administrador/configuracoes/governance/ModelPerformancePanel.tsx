import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AI_TASKS } from "@/config/ai-tasks";
import { useModelPerformance, successRate, approvalRate, type PerfRow } from "@/hooks/useModelPerformance";
import { useTaskModelUsage, sameModel } from "@/hooks/useTaskModelUsage";
import { chosenModel, effectiveStatus } from "./taskEffectiveStatus";
import PdfModelPicker from "./PdfModelPicker";
import RouterModelPicker from "./RouterModelPicker";

const MIN_RUNS_FOR_BEST = 5;

function pickBest(rows: PerfRow[]): string | null {
  const eligible = rows.filter((r) => r.ok + r.errors >= MIN_RUNS_FOR_BEST);
  if (eligible.length < 2) return null;
  const score = (r: PerfRow) => [successRate(r) ?? 0, approvalRate(r.curation) ?? -1] as const;
  eligible.sort((a, b) => {
    const [sa, aa] = score(a); const [sb, ab] = score(b);
    return sb - sa || ab - aa;
  });
  const [s0, a0] = score(eligible[0]); const [s1, a1] = score(eligible[1]);
  // Empate não elege ninguém: "melhor" só com vantagem real.
  if (s0 === s1 && a0 === a1) return null;
  return eligible[0].model;
}

const ModelPerformancePanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const { data, isLoading, error } = useModelPerformance();
  const { data: usage } = useTaskModelUsage();

  const groups = useMemo(() => {
    const by = new Map<string, PerfRow[]>();
    for (const r of data?.rows ?? []) {
      if (!by.has(r.task)) by.set(r.task, []);
      by.get(r.task)!.push(r);
    }
    return [...by.entries()];
  }, [data]);

  const taskLabel = (id: string) => {
    if (id === "vectorization") return t("aiGovernance.performance.vectorization");
    const task = AI_TASKS.find((x) => x.id === id);
    return task ? (isEn ? task.label_en : task.label_pt) : id;
  };

  // Modelo que a rotina usa de fato: o salvo na tela; sem nada salvo, o da
  // execução mais recente (o roteador cai no modelo reserva do código, não no
  // recomendado do registro); sem execução, o recomendado.
  const currentModel = (id: string): string | null => {
    const task = AI_TASKS.find((x) => x.id === id);
    if (!task) return null;
    const c = chosenModel(task, usage?.overrides ?? {});
    if (c.source === "screen") return c.model;
    return data?.lastModelByTask[id] ?? c.model;
  };

  const picker = (id: string) => {
    if (id === "vectorization") {
      return <p className="text-xs text-muted-foreground">{t("aiGovernance.performance.vectorLocked")}</p>;
    }
    const task = AI_TASKS.find((x) => x.id === id);
    if (!task) return null;
    const current = currentModel(id) ?? task.recommended_model;
    if (id === "pdf_reading") return <PdfModelPicker key={current} task={task} current={current} />;
    if (effectiveStatus(task) === "obeys_screen") return <RouterModelPicker key={current} task={task} current={current} />;
    return <p className="text-xs text-muted-foreground">{t("aiGovernance.performance.notSwitchable")}</p>;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("aiGovernance.performance.title")}</CardTitle>
        <CardDescription>
          {t("aiGovernance.performance.description", { days: data?.windowDays ?? 180 })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {error && (
          <p className="text-sm text-destructive">
            {t("aiGovernance.performance.loadError", { error: (error as Error).message })}
          </p>
        )}
        {!isLoading && !error && groups.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("aiGovernance.performance.empty")}</p>
        )}

        {groups.map(([task, rows]) => {
          const best = pickBest(rows);
          const current = currentModel(task);
          return (
            <section key={task} className="space-y-2" aria-label={taskLabel(task)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{taskLabel(task)}</h3>
                {picker(task)}
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("aiGovernance.performance.col.model")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.ok")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.errors")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.rate")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.approved")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.rejected")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.pending")}</TableHead>
                      <TableHead className="text-right">{t("aiGovernance.performance.col.approval")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const sr = successRate(r);
                      const ar = approvalRate(r.curation);
                      return (
                        <TableRow key={r.model}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex flex-wrap items-center gap-1">
                              {r.model}
                              {current && sameModel(current, r.model) && (
                                <Badge variant="secondary" className="text-[10px]">{t("aiGovernance.performance.current")}</Badge>
                              )}
                              {best === r.model && (
                                <Badge className="text-[10px]">{t("aiGovernance.performance.best")}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{r.ok}</TableCell>
                          <TableCell className={`text-right ${r.errors ? "text-destructive font-medium" : ""}`}>{r.errors}</TableCell>
                          <TableCell className="text-right">{sr == null ? "—" : `${sr.toLocaleString(i18n.language)}%`}</TableCell>
                          <TableCell className="text-right">{r.curation ? r.curation.approved : "—"}</TableCell>
                          <TableCell className="text-right">{r.curation ? r.curation.rejected : "—"}</TableCell>
                          <TableCell className="text-right">{r.curation ? r.curation.pending : "—"}</TableCell>
                          <TableCell className="text-right">{ar == null ? "—" : `${ar.toLocaleString(i18n.language)}%`}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          );
        })}

        {data && (
          <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
            <p>{t("aiGovernance.performance.noteExecution")}</p>
            <p>{t("aiGovernance.performance.noteCuration")}</p>
            <p>
              {t("aiGovernance.performance.unattributed", {
                approved: data.unattributedTriplets.approved,
                rejected: data.unattributedTriplets.rejected,
                pending: data.unattributedTriplets.pending,
              })}
            </p>
            <p>{t("aiGovernance.performance.noteBest", { min: MIN_RUNS_FOR_BEST })}</p>
            <p>{t("aiGovernance.performance.noteChosen")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelPerformancePanel;
