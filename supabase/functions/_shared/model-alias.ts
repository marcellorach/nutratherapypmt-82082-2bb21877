/**
 * Helpers para mascarar nomes reais de modelos por aliases por tarefa.
 * Lê de public.ai_task_aliases. Mantém cache in-memory de 60s.
 */

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

export interface TaskAlias {
  task_id: string;
  real_model: string;
  alias_label_pt: string;
  alias_label_en: string;
  description: string | null;
}

const TTL_MS = 60_000;
let cache: { at: number; byTask: Map<string, TaskAlias> } | null = null;

export async function loadAliasMap(): Promise<Map<string, TaskAlias>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.byTask;
  const { data, error } = await admin
    .from("ai_task_aliases")
    .select("task_id, real_model, alias_label_pt, alias_label_en, description");
  const map = new Map<string, TaskAlias>();
  if (!error && data) {
    for (const row of data as TaskAlias[]) map.set(row.task_id, row);
  }
  cache = { at: Date.now(), byTask: map };
  return map;
}

export async function maskModelForTask(
  taskId: string,
  realModel: string,
  lang: "pt" | "en" = "pt",
): Promise<string> {
  const map = await loadAliasMap();
  const row = map.get(taskId);
  if (!row) return lang === "en" ? "Unlabeled Model" : "Modelo não-rotulado";
  return lang === "en" ? row.alias_label_en : row.alias_label_pt;
}

export function invalidateAliasCache() { cache = null; }