import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskUsage {
  calls: number;
  errors: number;
  avgLatencyMs: number | null;
  costEstimate: number;
  lastModel: string | null;
  lastAt: string | null;
  /** model_id → number of calls in the window */
  models: Record<string, number>;
}

export interface TaskModelUsageData {
  /** ai_configurations.ai_model_<task_id> overrides (quotes stripped) */
  overrides: Record<string, string>;
  usage: Record<string, TaskUsage>;
  windowDays: number;
}

const WINDOW_DAYS = 30;

function stripQuotes(v: unknown): string {
  return String(v ?? "").replace(/"/g, "").trim();
}

export function useTaskModelUsage() {
  return useQuery<TaskModelUsageData>({
    queryKey: ["task-model-usage", WINDOW_DAYS],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
      const [inv, cfg] = await Promise.all([
        supabase
          .from("ai_task_invocations")
          .select("task_id, model_id, latency_ms, cost_estimate, ok, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10000),
        supabase.from("ai_configurations").select("config_key, config_value").like("config_key", "ai_model_%"),
      ]);
      if (inv.error) throw inv.error;
      if (cfg.error) throw cfg.error;

      const overrides: Record<string, string> = {};
      for (const row of cfg.data ?? []) {
        overrides[row.config_key.replace(/^ai_model_/, "")] = stripQuotes(row.config_value);
      }

      const usage: Record<string, TaskUsage> = {};
      const latencySum: Record<string, { sum: number; n: number }> = {};
      for (const r of inv.data ?? []) {
        const u = (usage[r.task_id] ??= {
          calls: 0, errors: 0, avgLatencyMs: null, costEstimate: 0, lastModel: null, lastAt: null, models: {},
        });
        u.calls += 1;
        if (!r.ok) u.errors += 1;
        u.costEstimate += Number(r.cost_estimate ?? 0);
        u.models[r.model_id] = (u.models[r.model_id] ?? 0) + 1;
        if (!u.lastAt) { u.lastAt = r.created_at; u.lastModel = r.model_id; } // rows are newest first
        if (r.latency_ms != null) {
          const l = (latencySum[r.task_id] ??= { sum: 0, n: 0 });
          l.sum += r.latency_ms; l.n += 1;
        }
      }
      for (const [task, l] of Object.entries(latencySum)) {
        if (usage[task] && l.n) usage[task].avgLatencyMs = Math.round(l.sum / l.n);
      }
      return { overrides, usage, windowDays: WINDOW_DAYS };
    },
  });
}

/** Normaliza para comparação: ignora prefixo "google/" (Google direto não usa prefixo). */
export function sameModel(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const n = (s: string) => s.replace(/^google\//, "").replace(/^models\//, "");
  return n(a) === n(b);
}
