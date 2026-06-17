import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPTS } from '../_shared/system-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Lista (manual) de edge functions que ainda contêm prompts hardcoded e que
 * deveriam migrar para o catálogo `ai_system_prompts`. Atualizar quando uma
 * função for migrada para `getSystemPrompt(...)` ou `fetchSystemPrompt(...)`.
 *
 * Esta lista alimenta o widget "Drift detectado" no painel de prompts —
 * serve para o admin saber quais prompts ainda NÃO são editáveis pela UI.
 */
const HARDCODED_PROMPT_FUNCTIONS: Array<{ function_name: string; suggested_key: string; note: string }> = [
  { function_name: 'chat', suggested_key: 'chat_assistant_streaming', note: 'Streaming chat assistant (system prompt literal no index.ts).' },
  { function_name: 'generate-triplets', suggested_key: 'generate_triplets_extraction', note: 'Núcleo da extração de triplos do KG.' },
  { function_name: 'process-study', suggested_key: 'process_study_pipeline', note: 'Pipeline orquestrador de estudos científicos.' },
  { function_name: 'extract-meta-study', suggested_key: 'extract_meta_study', note: 'Extração estruturada de meta-estudos arquiteturais.' },
  { function_name: 'generate-meta-study-cover', suggested_key: 'generate_meta_study_cover', note: 'Geração de capa visual de meta-estudos.' },
  { function_name: 'generate-showcase', suggested_key: 'generate_showcase', note: 'Geração de showcases narrativos.' },
  { function_name: 'classify-entity', suggested_key: 'classify_entity', note: 'Classificação taxonômica unitária de entidades.' },
  { function_name: 'calculate-recommendation-confidence', suggested_key: 'calculate_recommendation_confidence', note: 'Score de confiança da recomendação híbrida.' },
  { function_name: 'finalize-stalled-cohort', suggested_key: 'finalize_stalled_cohort', note: 'Finalização de cohorts travados.' },
  { function_name: 'enrichment-qa-sample', suggested_key: 'enrichment_qa_sample', note: 'QA-sampling do enrichment do KG.' },
  { function_name: 'compare-snapshots', suggested_key: 'compare_snapshots', note: 'Comparação narrativa de snapshots de auditoria.' },
  { function_name: 'fetch-external-ontologies', suggested_key: 'fetch_external_ontologies', note: 'Lookup em SNOMED-CT/UMLS externos.' },
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