import { AI_INVENTORY, type AIInventoryStatus } from "@/data/aiInventory.generated";
import type { AITaskDefinition } from "@/config/ai-tasks";

export type EffectiveStatus = "obeys_screen" | "partial" | "hardcoded" | "no_consumer";

/**
 * Status REAL da tarefa, calculado a partir do código (inventário gerado),
 * não do campo `status` declarado no registro.
 */
export function effectiveStatus(task: AITaskDefinition): EffectiveStatus {
  const rows = AI_INVENTORY.filter((r) => r.tasks.includes(task.id));
  if (!rows.length) return "no_consumer";
  const statuses = new Set<AIInventoryStatus>(rows.map((r) => r.status));
  if (statuses.size === 1 && statuses.has("obeys_screen")) return "obeys_screen";
  if (statuses.has("obeys_screen")) return "partial";
  return "hardcoded";
}

/** O registro declara "connected" mas o código não obedece à tela. */
export function registryOverclaims(task: AITaskDefinition): boolean {
  return task.status === "connected" && effectiveStatus(task) !== "obeys_screen";
}

export function chosenModel(task: AITaskDefinition, overrides: Record<string, string>): { model: string; source: "screen" | "registry" } {
  const key = task.config_key ?? task.id;
  const o = overrides[key];
  return o ? { model: o, source: "screen" } : { model: task.recommended_model, source: "registry" };
}
