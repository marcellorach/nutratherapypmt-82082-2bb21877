import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget: trigger automatic enrichment of intensity / evidence_level /
 * confidence_rationale for one or many approved triplets.
 *
 * Safe to call after every approval — backend skips triplets that are already complete.
 * Does not block the UI; logs failures to the console only.
 */
export function enrichApprovedTripletsInBackground(tripletIds: string | string[]): void {
  const ids = Array.isArray(tripletIds) ? tripletIds : [tripletIds];
  if (!ids.length) return;

  // Don't await — purely background
  (async () => {
    try {
      if (ids.length === 1) {
        await supabase.functions.invoke("backfill-triplet-enrichment", {
          body: { tripletId: ids[0] },
        });
      } else {
        // For batch approvals, hand the list directly — backend processes in parallel
        // We can't easily pass an id list (function uses query mode), so loop in a small batch
        for (const id of ids) {
          supabase.functions
            .invoke("backfill-triplet-enrichment", { body: { tripletId: id } })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[triplet-enrichment] background enrichment failed:", err);
    }
  })();
}