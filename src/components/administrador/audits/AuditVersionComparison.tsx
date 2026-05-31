import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AuditSummary {
  schema?: string;
  type?: string;
  base_audit?: string;
  pages?: number;
  words?: number;
  sections?: number;
  infographics?: number;
  references?: number;
  strengths?: { count?: number } | number;
  gaps?: { count?: number } | number;
  risks?: { count?: number } | number;
  compliance?: {
    fda?: { covered?: number; points?: number };
    ema?: { covered?: number; points?: number };
    avma?: { covered?: number; points?: number };
    gmlp?: { covered?: number; principles?: number };
  };
  key_changes?: string[];
}

interface AuditLite {
  id: string;
  version: string;
  audit_date: string;
  summary: AuditSummary;
}

function toNum(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "count" in (v as Record<string, unknown>)) {
    const c = (v as { count?: unknown }).count;
    if (typeof c === "number") return c;
  }
  return undefined;
}

function frac(c?: { covered?: number; points?: number; principles?: number }): string {
  if (!c) return "—";
  const d = c.points ?? c.principles;
  if (typeof c.covered !== "number" || typeof d !== "number") return "—";
  return `${c.covered}/${d}`;
}

function deltaIcon(curr?: number, prev?: number, better: "higher" | "lower" = "higher") {
  if (typeof curr !== "number" || typeof prev !== "number" || curr === prev) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  const up = curr > prev;
  const good = better === "higher" ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return <Icon className={`h-3 w-3 ${good ? "text-emerald-600" : "text-amber-600"}`} />;
}

interface Row {
  label: string;
  values: (string | number | undefined)[];
  better?: "higher" | "lower";
  numeric?: boolean;
}

export default function AuditVersionComparison({ audits }: { audits: AuditLite[] }) {
  const top3 = useMemo(() => audits.slice(0, 3), [audits]);

  if (top3.length < 2) return null;

  const rows: Row[] = [
    { label: "Páginas", values: top3.map((a) => a.summary?.pages), better: "higher", numeric: true },
    { label: "Palavras", values: top3.map((a) => a.summary?.words), better: "higher", numeric: true },
    { label: "Seções", values: top3.map((a) => a.summary?.sections), better: "higher", numeric: true },
    { label: "Infográficos", values: top3.map((a) => a.summary?.infographics), better: "higher", numeric: true },
    { label: "Referências", values: top3.map((a) => a.summary?.references), better: "higher", numeric: true },
    { label: "Forças", values: top3.map((a) => toNum(a.summary?.strengths)), better: "higher", numeric: true },
    { label: "Gaps", values: top3.map((a) => toNum(a.summary?.gaps)), better: "lower", numeric: true },
    { label: "Riscos", values: top3.map((a) => toNum(a.summary?.risks)), better: "lower", numeric: true },
    { label: "FDA", values: top3.map((a) => frac(a.summary?.compliance?.fda)) },
    { label: "EMA", values: top3.map((a) => frac(a.summary?.compliance?.ema)) },
    { label: "AVMA", values: top3.map((a) => frac(a.summary?.compliance?.avma)) },
    { label: "GMLP", values: top3.map((a) => frac(a.summary?.compliance?.gmlp)) },
  ];

  // Identificar diferenças ponto-a-ponto (linhas onde nem todas as células batem)
  const divergent = rows.filter((r) => {
    const present = r.values.filter((v) => v !== undefined && v !== "—");
    if (present.length < 2) return false;
    return new Set(present.map(String)).size > 1;
  });

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          Comparação das últimas {top3.length} auditorias
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Atualizado automaticamente quando uma nova auditoria é registrada.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Header com versões */}
        <div className="grid gap-1 items-center" style={{ gridTemplateColumns: `90px repeat(${top3.length}, 1fr)` }}>
          <span className="text-[10px] uppercase text-muted-foreground">Métrica</span>
          {top3.map((a) => (
            <div key={a.id} className="text-center">
              <Badge variant="outline" className="text-[10px] font-mono">{a.id.toUpperCase()}</Badge>
              <p className="text-[10px] text-muted-foreground mt-0.5">{a.audit_date}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 space-y-1">
          {rows.map((r) => {
            const curr = r.numeric ? (r.values[0] as number | undefined) : undefined;
            const prev = r.numeric ? (r.values[1] as number | undefined) : undefined;
            return (
              <div
                key={r.label}
                className="grid gap-1 items-center py-1 border-b border-dashed border-border/40 last:border-0"
                style={{ gridTemplateColumns: `90px repeat(${top3.length}, 1fr)` }}
              >
                <span className="text-muted-foreground flex items-center gap-1">
                  {r.label}
                  {r.numeric && deltaIcon(curr, prev, r.better)}
                </span>
                {r.values.map((v, i) => (
                  <span
                    key={i}
                    className={`text-center font-mono ${
                      i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {v ?? "—"}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {/* Pontos ainda não equivalentes */}
        {divergent.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1">
              Diferenças ainda não equivalentes ({divergent.length})
            </p>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              {divergent.map((d) => (
                <li key={d.label}>
                  • <span className="font-medium">{d.label}:</span>{" "}
                  {d.values
                    .map((v, i) => `${top3[i].id.toUpperCase()}=${v ?? "—"}`)
                    .join(" · ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key changes da versão mais recente, se for delta */}
        {top3[0]?.summary?.key_changes && top3[0].summary.key_changes.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-[11px] font-medium text-foreground mb-1">
              Mudanças destacadas na {top3[0].id.toUpperCase()}
            </p>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              {top3[0].summary.key_changes.slice(0, 6).map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}