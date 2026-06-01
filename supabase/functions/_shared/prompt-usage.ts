/**
 * Telemetria leve para uso de prompts do registro.
 *
 * Uso (em qualquer edge function que chame LLM via registro):
 *   import { logPromptUsage } from "../_shared/prompt-usage.ts";
 *   const t0 = Date.now();
 *   // ... chamada LLM ...
 *   await logPromptUsage({
 *     prompt_key: "extract_pet_clinical_data",
 *     function_name: "extract-pet-clinical-data",
 *     model: "google/gemini-2.5-flash",
 *     latency_ms: Date.now() - t0,
 *     tokens_in: usage?.prompt_tokens,
 *     tokens_out: usage?.completion_tokens,
 *     success: true,
 *   });
 *
 * Não-bloqueante: falhas são silenciosamente ignoradas. Usa a REST API
 * com SERVICE_ROLE para evitar dependência do @supabase/supabase-js.
 */
export interface PromptUsageEntry {
  prompt_key: string;
  function_name: string;
  model?: string | null;
  latency_ms?: number | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  success?: boolean;
  error?: string | null;
}

export async function logPromptUsage(entry: PromptUsageEntry): Promise<void> {
  try {
    const url = (globalThis as any).Deno?.env?.get?.("SUPABASE_URL");
    const serviceKey = (globalThis as any).Deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return;
    await fetch(`${url}/rest/v1/ai_prompt_usage_log`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        prompt_key: entry.prompt_key,
        function_name: entry.function_name,
        model: entry.model ?? null,
        latency_ms: entry.latency_ms ?? null,
        tokens_in: entry.tokens_in ?? null,
        tokens_out: entry.tokens_out ?? null,
        success: entry.success ?? true,
        error: entry.error ?? null,
      }),
    });
  } catch (_e) {
    // silencioso por design
  }
}