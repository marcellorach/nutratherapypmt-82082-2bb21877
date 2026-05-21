import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIPromptVersionRow {
  id: string;
  task_id: string;
  model_id: string | null;
  version: number;
  system_prompt: string | null;
  user_prompt: string | null;
  optimized_for_model: boolean;
  optimization_notes: string | null;
  highlighted_segments: Array<{ start: number; end: number; reason: string }>;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fase 1 — leitura only. Carrega todas as versões de prompt de uma tarefa
 * para alimentar o painel "Modelos & Prompts por Tarefa".
 */
export function useAIPromptVersions(taskId?: string) {
  return useQuery({
    queryKey: ["ai_prompt_versions", taskId ?? "__all__"],
    queryFn: async (): Promise<AIPromptVersionRow[]> => {
      let query = (supabase as any)
        .from("ai_prompt_versions")
        .select("*")
        .order("task_id", { ascending: true })
        .order("version", { ascending: false });

      if (taskId) query = query.eq("task_id", taskId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AIPromptVersionRow[];
    },
    staleTime: 30_000,
  });
}

/** Retorna apenas a versão ativa por (task_id, model_id). */
export function useActiveAIPrompt(taskId: string, modelId?: string | null) {
  return useQuery({
    queryKey: ["ai_prompt_versions:active", taskId, modelId ?? "__any__"],
    queryFn: async (): Promise<AIPromptVersionRow | null> => {
      let query = (supabase as any)
        .from("ai_prompt_versions")
        .select("*")
        .eq("task_id", taskId)
        .eq("is_active", true);
      if (modelId) query = query.eq("model_id", modelId);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return (data ?? null) as AIPromptVersionRow | null;
    },
    enabled: !!taskId,
    staleTime: 30_000,
  });
}