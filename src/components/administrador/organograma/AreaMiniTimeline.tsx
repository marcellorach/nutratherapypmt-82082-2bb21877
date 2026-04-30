import React, { useMemo, useState } from "react";
import {
  History,
  GitCommit,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Code2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { changesByAreaFiltered } from "@/data/changelogQuery";
import type { ChangelogEntry, ChangelogKind } from "@/data/projectChangelog";
import type { OrganogramaAreaKey } from "@/data/projectOrganograma";
import { fileUrl, commitUrl, shortHash } from "@/data/repoConfig";

const KIND_ORDER: ChangelogKind[] = ["added", "changed", "fixed", "removed", "security"];

const KIND_DOT: Record<ChangelogKind, string> = {
  added: "bg-emerald-500",
  changed: "bg-amber-500",
  fixed: "bg-sky-500",
  removed: "bg-rose-500",
  security: "bg-violet-500",
};

const KIND_BADGE: Record<ChangelogKind, string> = {
  added: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
  changed: "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
  fixed: "border-sky-500/40 text-sky-700 dark:text-sky-400 bg-sky-500/10",
  removed: "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10",
  security: "border-violet-500/40 text-violet-700 dark:text-violet-400 bg-violet-500/10",
};

const KIND_I18N: Record<ChangelogKind, string> = {
  added: "organograma.kindAdded",
  changed: "organograma.kindChanged",
  fixed: "organograma.kindFixed",
  removed: "organograma.kindRemoved",
  security: "organograma.kindSecurity",
};

interface Props {
  areaKey: OrganogramaAreaKey;
}

export const AreaMiniTimeline: React.FC<Props> = ({ areaKey }) => {
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeKinds, setActiveKinds] = useState<Set<ChangelogKind>>(new Set());
  const { t } = useTranslation();

  const entries = useMemo(() => {
    const kinds = activeKinds.size ? Array.from(activeKinds) : undefined;
    return changesByAreaFiltered(areaKey, {
      sinceDays: 365,
      limit: expanded ? 8 : 3,
      kinds,
    });
  }, [areaKey, expanded, activeKinds]);

  const totalAvailable = useMemo(
    () =>
      changesByAreaFiltered(areaKey, {
        sinceDays: 365,
        limit: 8,
        kinds: activeKinds.size ? Array.from(activeKinds) : undefined,
      }).length,
    [areaKey, activeKinds],
  );

  const toggleKind = (k: ChangelogKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-dashed">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <History className="h-3 w-3" />
          {t('organograma.recentInArea')}
        </p>
        <div className="flex flex-wrap gap-1">
          {KIND_ORDER.map((k) => {
            const on = activeKinds.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleKind(k)}
                className={cn(
                  "text-[9px] uppercase px-1.5 h-5 rounded border transition-colors",
                  on ? KIND_BADGE[k] : "border-border text-muted-foreground hover:bg-muted",
                )}
                aria-pressed={on}
                title={t(KIND_I18N[k])}
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1">
          {t('organograma.noRecentChanges')}
        </p>
      ) : (
        <ol className="relative">
          <span
            aria-hidden
            className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border"
          />
          {entries.map((e, i) => (
            <TimelineItem
              key={`${e.date}-${i}-${e.title}`}
              entry={e}
              id={`${e.date}-${i}`}
              open={openId === `${e.date}-${i}`}
              onToggle={() =>
                setOpenId((prev) => (prev === `${e.date}-${i}` ? null : `${e.date}-${i}`))
              }
            />
          ))}
        </ol>
      )}

      {totalAvailable > 3 && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('organograma.viewLess') : t('organograma.viewMore', { count: Math.max(0, totalAvailable - 3) })}
          </Button>
        </div>
      )}
    </div>
  );
};

interface ItemProps {
  entry: ChangelogEntry;
  id: string;
  open: boolean;
  onToggle: () => void;
}

function TimelineItem({ entry, open, onToggle }: ItemProps) {
  const kind = entry.kind;
  const cUrl = entry.commit ? commitUrl(entry.commit) : null;
  const { t } = useTranslation();

  return (
    <li className="relative pl-5 py-1.5">
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
          KIND_DOT[kind],
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start gap-1.5 group"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">{entry.date}</span>
            <Badge
              variant="outline"
              className={cn("text-[9px] px-1 py-0 h-4 uppercase", KIND_BADGE[kind])}
            >
              {kind}
            </Badge>
            {entry.status !== "entregue" && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">
                {entry.status}
              </Badge>
            )}
          </div>
          <p className="text-xs leading-snug mt-0.5 group-hover:text-foreground transition-colors">
            {entry.title}
          </p>
        </div>
      </button>

      {open && (
        <div className="ml-4 mt-1.5 space-y-2">
          {entry.bullets.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5">
              {entry.bullets.slice(0, 3).map((b, i) => (
                <li
                  key={i}
                  className="text-[11px] text-muted-foreground leading-snug marker:text-muted-foreground/50"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}

          {entry.files && entry.files.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.files.slice(0, 8).map((f) => (
                <FileChip key={f} path={f} />
              ))}
            </div>
          )}

          {entry.commit && (
            <div className="flex items-center gap-1">
              {cUrl ? (
                <a
                  href={cUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 h-5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={t('organograma.viewCommit')}
                >
                  <GitCommit className="h-2.5 w-2.5" />
                  {shortHash(entry.commit)}
                  <ExternalLink className="h-2 w-2" />
                </a>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 h-5 rounded border border-border bg-muted/40 text-muted-foreground"
                  title={t('organograma.configureRepo')}
                >
                  <GitCommit className="h-2.5 w-2.5" />
                  {shortHash(entry.commit)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function FileChip({ path }: { path: string }) {
  const { t } = useTranslation();
  const url = fileUrl(path);
  const display = path.length > 38 ? `…${path.slice(-37)}` : path;
  const baseClass =
    "inline-flex items-center gap-1 text-[10px] font-mono px-1.5 h-5 rounded border border-border bg-muted/30";

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClass, "hover:bg-muted hover:text-foreground text-muted-foreground")}
        title={t('organograma.openInRepo', { path })}
      >
        <Code2 className="h-2.5 w-2.5" />
        {display}
        <ExternalLink className="h-2 w-2" />
      </a>
    );
  }
  return (
    <span className={cn(baseClass, "text-muted-foreground")} title={path}>
      <Code2 className="h-2.5 w-2.5" />
      {display}
    </span>
  );
}

export default AreaMiniTimeline;
