/**
 * Shared helper for enriching model-inventory items with drift information
 * and counting drifted rows. Used by ModelAliasesPanel (CSV/JSON/PDF exports)
 * AND by the regression test that guarantees parity between the three formats.
 */

export interface InventoryItemBase {
  task_id: string;
  real_model: string;
}

export interface EnrichedInventoryItem extends InventoryItemBase {
  stored_real_model: string | null;
  drift: boolean;
  drift_note: string;
}

export function enrichItemsWithDrift<T extends InventoryItemBase>(
  rawItems: T[],
  storedByTask: Map<string, string>,
): (T & EnrichedInventoryItem)[] {
  return rawItems.map((i) => {
    const stored = storedByTask.get(i.task_id) ?? null;
    const drift = !!stored && stored !== i.real_model;
    return {
      ...i,
      stored_real_model: stored,
      drift,
      drift_note: drift ? `In-use model differs from stored (${stored})` : "",
    };
  });
}

export function countDrift(items: { drift: boolean }[]): number {
  return items.filter((i) => i.drift).length;
}