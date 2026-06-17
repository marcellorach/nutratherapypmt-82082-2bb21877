import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPTS } from '../_shared/system-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Lista de edge functions com prompts hardcoded que ainda precisam migrar
 * para o catálogo `ai_system_prompts`. Atualizar quando uma função for
 * migrada para `getSystemPrompt(...)` ou `fetchSystemPrompt(...)`.
 *
 * Frente C — 2026-06-17: auditoria caso-a-caso revelou que 8 das 12 entradas
 * originais eram FALSE-POSITIVES (orquestradores/pass-through/algorítmicas
 * sem prompt próprio). Resultado:
 *   - Migrados: generate-triplets (2 prompts), extract-meta-study,
 *     generate-showcase (PT + EN), generate-meta-study-cover (style guide).
 *   - Removidos (não têm prompt próprio): chat (pass-through),
 *     process-study (orquestrador sem LLM), classify-entity (algorítmica),
 *     calculate-recommendation-confidence (algorítmica),
 *     finalize-stalled-cohort (sem LLM), enrichment-qa-sample (orquestrador),
 *     compare-snapshots (sem LLM), fetch-external-ontologies (SNOMED/UMLS REST).
 */
const HARDCODED_PROMPT_FUNCTIONS: Array<{ function_name: string; suggested_key: string; note: string }> = [
  // (vazio — todas as edge functions com prompt próprio já estão no catálogo)
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let body: { app_version?: string; triggered_by?: string } = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }
    const appVersion = body.app_version || 'unknown';
    const triggeredBy = body.triggered_by || 'manual';

    const manifestKeys = Object.keys(SYSTEM_PROMPTS);

    const { data: dbRows, error: dbErr } = await supabase
      .from('ai_system_prompts')
      .select('prompt_key, default_content');
    if (dbErr) throw dbErr;

    const dbMap = new Map<string, { default_content: string | null }>(
      (dbRows ?? []).map((r: any) => [r.prompt_key, { default_content: r.default_content }]),
    );

    const missingInDb = manifestKeys.filter((k) => !dbMap.has(k));
    const extraInDb = (dbRows ?? [])
      .map((r: any) => r.prompt_key as string)
      .filter((k) => !(k in SYSTEM_PROMPTS));
    const outOfSync = manifestKeys.filter((k) => {
      const row = dbMap.get(k);
      if (!row) return false;
      return (row.default_content ?? '') !== SYSTEM_PROMPTS[k].content;
    });

    const drift =
      missingInDb.length > 0 ||
      extraInDb.length > 0 ||
      outOfSync.length > 0 ||
      HARDCODED_PROMPT_FUNCTIONS.length > 0;

    const status: 'ok' | 'drift' = drift ? 'drift' : 'ok';

    const { data: inserted, error: insErr } = await supabase
      .from('ai_system_prompts_integrity_check')
      .insert({
        app_version: appVersion,
        manifest_count: manifestKeys.length,
        db_count: dbRows?.length ?? 0,
        missing_in_db: missingInDb,
        extra_in_db: extraInDb,
        out_of_sync: outOfSync,
        hardcoded_outside_catalog: HARDCODED_PROMPT_FUNCTIONS,
        status,
        triggered_by: triggeredBy,
        details: { manifest_keys: manifestKeys.length },
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({
        ok: true,
        check: inserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});