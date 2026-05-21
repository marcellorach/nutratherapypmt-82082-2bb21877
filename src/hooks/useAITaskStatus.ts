import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AITaskStatusRow {
  task_id: string;
  last_run_at: string | null;
  last_latency_ms: number | null;
  last_model_id: string | null;
  last_error: string | null;
  ok: boolean;
  updated_at: string;
}

/** Lê o snapshot de saúde de todas as tarefas IA conectadas. Admin-only via RLS. */
export function useAITaskStatus() {
  return useQuery({
    queryKey: ["ai-task-status"],
    queryFn: async (): Promise<AITaskStatusRow[]> => {
      const { data, error } = await supabase
        .from("ai_task_status")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AITaskStatusRow[];
    },
    staleTime: 30_000,
  });
}

/** Dispara o healthcheck para um subconjunto (ou todas, se omitido). */
export function useRunHealthcheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskIds?: string[]) => {
      const { data, error } = await supabase.functions.invoke("ai-task-healthcheck", {
        body: { task_ids: taskIds ?? null },
      });
      if (error) throw error;
      return data as { checked: number; results: Array<{ task_id: string; ok: boolean; latency_ms: number; model_id: string; error?: string }> };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-task-status"] });
    },
  });
}