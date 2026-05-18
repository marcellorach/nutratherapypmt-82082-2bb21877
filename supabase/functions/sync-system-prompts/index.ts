import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPTS } from '../_shared/system-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{ key: string; status: 'updated' | 'unchanged' | 'missing' | 'error'; error?: string }> = [];

    // Load current rows to compare
    const { data: existing, error: loadErr } = await supabase
      .from('ai_system_prompts')
      .select('prompt_key, default_content');
    if (loadErr) throw loadErr;
    const currentMap = new Map<string, string | null>(
      (existing ?? []).map((r: any) => [r.prompt_key, r.default_content ?? null]),
    );

    for (const [key, def] of Object.entries(SYSTEM_PROMPTS)) {
      if (!currentMap.has(key)) {
        results.push({ key, status: 'missing' });
        continue;
      }
      if ((currentMap.get(key) ?? '') === def.content) {
        results.push({ key, status: 'unchanged' });
        continue;
      }
      const { error: updErr } = await supabase
        .from('ai_system_prompts')
        .update({ default_content: def.content, updated_at: new Date().toISOString() })
        .eq('prompt_key', key);
      if (updErr) {
        results.push({ key, status: 'error', error: updErr.message });
      } else {
        results.push({ key, status: 'updated' });
      }
    }

    const summary = {
      updated: results.filter((r) => r.status === 'updated').length,
      unchanged: results.filter((r) => r.status === 'unchanged').length,
      missing: results.filter((r) => r.status === 'missing').length,
      errors: results.filter((r) => r.status === 'error').length,
      total_in_manifest: Object.keys(SYSTEM_PROMPTS).length,
      results,
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});