import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

/** Phase 2 — create a new prompt version (does NOT auto-activate). */
export function useCreatePromptVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      task_id: string;
      model_id: string | null;
      system_prompt: string;
      user_prompt: string;
      optimization_notes?: string | null;
      optimized_for_model?: boolean;
      activate?: boolean;
    }) => {
      // Compute next version number for this (task, model)
      const { data: existing } = await (supabase as any)
        .from("ai_prompt_versions")
        .select("version")
        .eq("task_id", input.task_id)
        .eq("model_id", input.model_id ?? null)
        .order("version", { ascending: false })
        .limit(1);
      const nextVersion = ((existing?.[0]?.version as number | undefined) ?? 0) + 1;

      const { data: userData } = await supabase.auth.getUser();
      const created_by = userData?.user?.id ?? null;

      const { data, error } = await (supabase as any)
        .from("ai_prompt_versions")
        .insert({
          task_id: input.task_id,
          model_id: input.model_id,
          version: nextVersion,
          system_prompt: input.system_prompt,
          user_prompt: input.user_prompt,
          optimized_for_model: input.optimized_for_model ?? false,
          optimization_notes: input.optimization_notes ?? null,
          is_active: !!input.activate,
          source: "manual",
          created_by,
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as AIPromptVersionRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_prompt_versions"] });
      qc.invalidateQueries({ queryKey: ["ai_prompt_versions:active"] });
    },
  });
}

/** Phase 2 — activate a specific version (trigger ensures only one active per task+model). */
export function useActivatePromptVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await (supabase as any).rpc("activate_ai_prompt_version", {
        p_version_id: versionId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_prompt_versions"] });
      qc.invalidateQueries({ queryKey: ["ai_prompt_versions:active"] });
    },
  });
}

export interface AIPromptTestRunRow {
  id: string;
  task_id: string;
  prompt_version_id: string | null;
  model_id: string;
  input_text: string | null;
  output_text: string | null;
  latency_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_estimate: number | null;
  error: string | null;
  created_at: string;
}

export function useTaskTestHistory(taskId: string) {
  return useQuery({
    queryKey: ["ai_prompt_test_runs", taskId],
    queryFn: async (): Promise<AIPromptTestRunRow[]> => {
      const { data, error } = await (supabase as any)
        .from("ai_prompt_test_runs")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AIPromptTestRunRow[];
    },
    enabled: !!taskId,
    staleTime: 10_000,
  });
}

export interface AITaskTestRequest {
  task_id: string;
  model_id: string;
  input: string;
  system_prompt?: string;
  user_prompt?: string;
  prompt_version_id?: string | null;
  reasoning_effort?: "minimal" | "low" | "medium" | "high" | "xhigh";
  temperature?: number;
}

export interface AITaskTestResult {
  ok: boolean;
  run_id: string | null;
  output: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  prompt_version_id: string | null;
}

export function useTaskTestRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: AITaskTestRequest): Promise<AITaskTestResult> => {
      const { data, error } = await supabase.functions.invoke("ai-task-test", { body: req });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as AITaskTestResult;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ai_prompt_test_runs", vars.task_id] });
    },
  });
}