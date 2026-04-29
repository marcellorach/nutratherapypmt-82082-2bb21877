import React, { useMemo, useState } from "react";
import { Search, Code2, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  changelog,
  type ChangelogEntry,
  type ChangelogStatus,
} from "@/data/projectChangelog";
import { lastChangelogDate } from "@/data/projectChangelog";
import { getAreaMeta } from "@/data/organogramaAreaMeta";

const STATUS_META: Record<
  ChangelogStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  entregue: {
    label: "Entregue",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  parcial: {
    label: "Parcial",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  revertido: {
    label: "Revertido",
    icon: RotateCcw,
    className: "bg-muted text-muted-foreground border-border",
  },
};

const KIND_LABEL: Record<string, string> = {
  added: "Adicionado",
  changed: "Alterado",
  fixed: "Corrigido",
  removed: "Removido",
  security: "Segurança",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || !d) return iso;
  return `${d} ${months[mi] ?? m} ${y}`;
}

function entryMatches(entry: ChangelogEntry, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    entry.title.toLowerCase().includes(needle) ||
    entry.area.toLowerCase().includes(needle) ||
    entry.bullets.some((b) => b.toLowerCase().includes(needle)) ||
    !!entry.files?.some((f) => f.toLowerCase().includes(needle))
  );
}

export const ChangelogTimeline: React.FC = () => {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const areas = useMemo(() => {
    const set = new Set<string>();
    changelog.forEach((e) => set.add(e.area));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    return changelog.filter(
      (e) =>
        (areaFilter === "all" || e.area === areaFilter) &&
        (statusFilter === "all" || e.status === statusFilter) &&
        entryMatches(e, query),
    );
  }, [query, areaFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChangelogEntry[]>();
    filtered.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md border border-dashed bg-muted/30 px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>
          Auto-sincronizado a partir de <code className="font-mono">CHANGELOG.md</code>
          {lastChangelogDate ? <> · última entrada em <strong>{lastChangelogDate}</strong></> : null}
          . Para adicionar mudanças: edite o CHANGELOG e rode <code className="font-mono">npm run sync:changelog</code>.
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, bullet ou arquivo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((a) => {
              const meta = getAreaMeta(a);
              return (
                <SelectItem key={a} value={a}>
                  {meta.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="revertido">Revertido</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground whitespace-nowrap sm:ml-2">
          {filtered.length} {filtered.length === 1 ? "alteração" : "alterações"}
        </p>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma alteração encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <section key={date} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatDate(date)}
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {entries.map((entry, i) => {
                  const areaMeta = getAreaMeta(entry.area);
                  const statusMeta = STATUS_META[entry.status];
                  const StatusIcon = statusMeta.icon;
                  const AreaIcon = areaMeta.icon;
                  return (
                    <Card key={`${date}-${i}`} className={cn("border-l-4", areaMeta.ring)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn("gap-1 font-medium", areaMeta.badge)}
                            >
                              <AreaIcon className="h-3 w-3" />
                              {areaMeta.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn("gap-1", statusMeta.className)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusMeta.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {KIND_LABEL[entry.kind] ?? entry.kind}
                            </Badge>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold leading-snug">{entry.title}</h4>
                        {entry.bullets.length > 0 && (
                          <ul className="space-y-1 mt-1">
                            {entry.bullets.map((b, bi) => (
                              <li
                                key={bi}
                                className="text-xs text-muted-foreground leading-relaxed flex gap-2"
                              >
                                <span className="text-muted-foreground/60 mt-0.5">•</span>
                                <span className="flex-1">{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {entry.files && entry.files.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {entry.files.map((f) => (
                              <Badge
                                key={f}
                                variant="outline"
                                className="text-[10px] font-mono py-0 px-1.5 h-5 gap-1"
                              >
                                <Code2 className="h-2.5 w-2.5" />
                                {f}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChangelogTimeline;
