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
      .select('prompt_key, default_content, purpose, model_default, temperature, output_format, consumers, tags, example_input');
    if (loadErr) throw loadErr;
    const currentMap = new Map<string, any>(
      (existing ?? []).map((r: any) => [r.prompt_key, r]),
    );

    for (const [key, def] of Object.entries(SYSTEM_PROMPTS)) {
      const cur = currentMap.get(key);
      if (!cur) {
        results.push({ key, status: 'missing' });
        continue;
      }
      const patch: Record<string, unknown> = {};
      if ((cur.default_content ?? '') !== def.content) patch.default_content = def.content;
      if (def.purpose !== undefined && cur.purpose !== def.purpose) patch.purpose = def.purpose;
      if (def.model_default !== undefined && cur.model_default !== def.model_default) patch.model_default = def.model_default;
      if (def.temperature !== undefined && Number(cur.temperature) !== def.temperature) patch.temperature = def.temperature;
      if (def.output_format !== undefined && cur.output_format !== def.output_format) patch.output_format = def.output_format;
      if (def.consumers !== undefined && JSON.stringify(cur.consumers ?? []) !== JSON.stringify(def.consumers)) patch.consumers = def.consumers;
      if (def.tags !== undefined && JSON.stringify(cur.tags ?? []) !== JSON.stringify(def.tags)) patch.tags = def.tags;
      if (def.example_input !== undefined && cur.example_input !== def.example_input) patch.example_input = def.example_input;
      if (Object.keys(patch).length === 0) {
        results.push({ key, status: 'unchanged' });
        continue;
      }
      patch.updated_at = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('ai_system_prompts')
        .update(patch)
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