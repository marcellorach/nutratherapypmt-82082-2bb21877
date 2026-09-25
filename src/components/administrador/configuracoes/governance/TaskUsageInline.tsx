import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { AITaskDefinition } from "@/config/ai-tasks";
import { sameModel, type TaskUsage } from "@/hooks/useTaskModelUsage";
import { chosenModel, effectiveStatus, registryOverclaims } from "./taskEffectiveStatus";
import { AI_INVENTORY } from "@/data/aiInventory.generated";

interface Props {
  task: AITaskDefinition;
  usage: TaskUsage | undefined;
  overrides: Record<string, string>;
  windowDays: number;
}

const STATUS_TONE: Record<string, string> = {
  obeys_screen: "border-primary text-primary",
  partial: "border-destructive/60 text-destructive",
  hardcoded: "border-destructive/60 text-destructive",
  no_consumer: "border-border text-muted-foreground",
};

/** Badges shown in the collapsed row header. */
export const TaskUsageBadges: React.FC<Props> = ({ task, usage, overrides }) => {
  const { t } = useTranslation();
  const eff = effectiveStatus(task);
  const chosen = chosenModel(task, overrides);
  const mismatch = usage?.lastModel && !sameModel(usage.lastModel, chosen.model);
  return (
    <>
      <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[eff]}`}>
        {t(`aiGovernance.usage.status.${eff}`)}
      </Badge>
      {mismatch && (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          {t("aiGovernance.usage.mismatchShort")}
        </Badge>
      )}
    </>
  );
};

/** Detailed block shown when the row is expanded. */
export const TaskUsageDetails: React.FC<Props> = ({ task, usage, overrides, windowDays }) => {
  const { t, i18n } = useTranslation();
  const chosen = chosenModel(task, overrides);
  const eff = effectiveStatus(task);
  const consumers = AI_INVENTORY.filter((r) => r.tasks.includes(task.id));
  const mismatch = usage?.lastModel && !sameModel(usage.lastModel, chosen.model);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language?.startsWith("en") ? "en-US" : "pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="rounded-md border p-3 space-y-3 bg-muted/20">
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("aiGovernance.usage.chosen")}</div>
          <div className="font-mono text-xs mt-1">{chosen.model}</div>
          <div className="text-[11px] text-muted-foreground">{t(`aiGovernance.usage.chosenSource.${chosen.source}`)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("aiGovernance.usage.actual")}</div>
          {usage?.lastModel ? (
            <>
              <div className="font-mono text-xs mt-1">{usage.lastModel}</div>
              <div className="text-[11px] text-muted-foreground">{t("aiGovernance.usage.lastRun", { date: fmtDate(usage.lastAt!) })}</div>
            </>
          ) : (
            <div className="text-[11px] text-muted-foreground mt-1">{t("aiGovernance.usage.noRuns", { days: windowDays })}</div>
          )}
        </div>
      </div>

      {mismatch && (
        <p role="alert" className="text-xs text-destructive flex gap-1 items-start">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {t("aiGovernance.usage.mismatch", { used: usage!.lastModel, chosen: chosen.model })}
        </p>
      )}
      {registryOverclaims(task) && (
        <p className="text-xs text-destructive">{t("aiGovernance.usage.overclaim")}</p>
      )}

      {usage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <Metric label={t("aiGovernance.usage.calls", { days: windowDays })} value={String(usage.calls)} />
          <Metric label={t("aiGovernance.usage.errorRate")} value={`${Math.round((usage.errors / usage.calls) * 100)}%`} />
          <Metric label={t("aiGovernance.usage.avgLatency")} value={usage.avgLatencyMs != null ? `${(usage.avgLatencyMs / 1000).toFixed(1)} s` : "—"} />
          <Metric
            label={t("aiGovernance.usage.cost")}
            value={usage.costEstimate > 0 ? `US$ ${usage.costEstimate.toFixed(2)}` : t("aiGovernance.usage.costUnknown")}
          />
        </div>
      )}
      {usage && Object.keys(usage.models).length > 1 && (
        <div className="text-[11px] text-muted-foreground">
          {t("aiGovernance.usage.modelsInWindow")}{" "}
          {Object.entries(usage.models).map(([m, n]) => `${m} (${n})`).join(" · ")}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t("aiGovernance.usage.whereUsed")}</div>
        {consumers.length ? (
          <ul className="space-y-1">
            {consumers.map((c) => (
              <li key={c.fn} className="text-xs flex flex-wrap items-center gap-2">
                <code className="font-mono">{c.fn}</code>
                <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[c.status === "obeys_screen" ? "obeys_screen" : "hardcoded"]}`}>
                  {t(`aiGovernance.inventory.status.${c.status}`)}
                </Badge>
                {c.status === "hardcoded" && c.hardcoded_models.length > 0 && (
                  <span className="text-muted-foreground font-mono">{c.hardcoded_models.join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t(`aiGovernance.usage.status.${eff}`)}</p>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border bg-background p-2">
    <div className="text-sm font-semibold">{value}</div>
    <div className="text-[10px] text-muted-foreground">{label}</div>
  </div>
);
