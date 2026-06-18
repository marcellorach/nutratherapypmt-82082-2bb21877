import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export interface TaskAlias {
  task_id: string;
  real_model: string;
  alias_label_pt: string;
  alias_label_en: string;
  description: string | null;
}

let cache: { at: number; map: Map<string, TaskAlias> } | null = null;
const TTL_MS = 5 * 60_000;

async function fetchAliases(): Promise<Map<string, TaskAlias>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  const { data } = await supabase
    .from("ai_task_aliases")
    .select("task_id, real_model, alias_label_pt, alias_label_en, description");
  const map = new Map<string, TaskAlias>();
  for (const r of (data ?? []) as TaskAlias[]) map.set(r.task_id, r);
  cache = { at: Date.now(), map };
  return map;
}

export function invalidateTaskAliasCache() { cache = null; }

/**
 * Hook que devolve `mask(taskId, realModelFallback?)` — retorna o alias
 * configurado para a tarefa no idioma corrente. Use em QUALQUER superfície
 * exposta a parceiros: tabelas, badges, relatórios PDF, etc.
 */
export function useTaskAlias() {
  const { i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language?.startsWith("en") ? "en" : "pt";
  const [aliases, setAliases] = useState<Map<string, TaskAlias>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAliases().then((m) => { if (active) { setAliases(m); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const mask = useCallback(
    (taskId: string, _realFallback?: string): string => {
      const row = aliases.get(taskId);
      if (!row) return lang === "en" ? "Unlabeled Model" : "Modelo não-rotulado";
      return lang === "en" ? row.alias_label_en : row.alias_label_pt;
    },
    [aliases, lang],
  );

  return useMemo(() => ({ mask, aliases, loading, lang }), [mask, aliases, loading, lang]);
}