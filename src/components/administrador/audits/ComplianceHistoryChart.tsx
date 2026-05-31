import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface AuditLike {
  version: string;
  audit_date: string;
  summary: Record<string, any>;
  superseded_by?: string | null;
}

interface Props {
  audits: AuditLike[];
}

const FRAMEWORKS = [
  { key: "fda", label: "FDA", color: "hsl(var(--primary))", total: 7 },
  { key: "ema", label: "EMA", color: "hsl(217 91% 60%)", total: 4 },
  { key: "avma", label: "AVMA", color: "hsl(38 92% 50%)", total: 4 },
  { key: "gmlp", label: "GMLP", color: "hsl(142 71% 45%)", total: 10 },
];

function pctFromSummary(summary: any, key: string, total: number): number | null {
  const c = summary?.compliance?.[key];
  if (!c) return null;
  const covered = typeof c.covered === "number" ? c.covered : 0;
  const partial = typeof c.partial === "number" ? c.partial : 0;
  const denom = c.points ?? c.principles ?? total;
  if (!denom) return null;
  return Math.round(((covered + partial * 0.5) / denom) * 100);
}

const ComplianceHistoryChart: React.FC<Props> = ({ audits }) => {
  const data = useMemo(() => {
    return [...audits]
      .sort((a, b) => a.audit_date.localeCompare(b.audit_date))
      .map((a) => {
        const d = new Date(a.audit_date);
        const label = `v${a.version}`;
        const dateLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        const row: Record<string, any> = { label, dateLabel, version: a.version, date: a.audit_date };
        for (const f of FRAMEWORKS) {
          row[f.label] = pctFromSummary(a.summary, f.key, f.total);
        }
        return row;
      });
  }, [audits]);

  if (data.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          Evolução de compliance por versão
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v, i) => `${v}\n${data[i]?.dateLabel ?? ""}`}
                interval={0}
                height={36}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelFormatter={(_, payload) => {
                  const p: any = payload?.[0]?.payload;
                  return p ? `${p.label} · ${p.dateLabel}` : "";
                }}
                formatter={(v: any) => (v == null ? "—" : `${v}%`)}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
              {FRAMEWORKS.map((f) => (
                <Line
                  key={f.key}
                  type="monotone"
                  dataKey={f.label}
                  stroke={f.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
          % = (cobertos + parciais × 0.5) / total. Versões sem matriz de compliance aparecem como lacuna.
        </p>
      </CardContent>
    </Card>
  );
};

export default ComplianceHistoryChart;