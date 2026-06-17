import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPTS, type SystemPromptDef } from '../_shared/system-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deriva uma "family" legível a partir da chave para novas linhas inseridas pelo upsert.
function deriveFamily(key: string): string {
  if (/(translate|translation)/.test(key)) return 'Translation';
  if (/audit/.test(key)) return 'Audit';
  if (/(cohort|synthetic)/.test(key)) return 'Cohorts';
  if (/meta_study/.test(key)) return 'Meta-Studies';
  if (/perplexity|healthcheck|health_ping/.test(key)) return 'Infrastructure';
  if (/(triplet|kg_|knowledge_graph|enrich|consolidate|graph)/.test(key)) return 'Knowledge Graph';
  if (/(study|vectorize|parse|extract_study|auto_tag|gemini_file)/.test(key)) return 'Study Ingestion';
  if (/(chat|persona|proposal|document_chat)/.test(key)) return 'Conversational';
  if (/(pet_exam|pet_clinical|trajectory|condition_insights|clinical)/.test(key)) return 'Clinical';
  if (/(pet_food|nutraceutical|nutrition|spreadsheet)/.test(key)) return 'Nutrition';
  if (/(dosage|web_dosage|external)/.test(key)) return 'External Lookup';
  if (/taxonomy/.test(key)) return 'Taxonomy';
  if (/(verification|verify)/.test(key)) return 'Verification';
  if (/recommendation/.test(key)) return 'Recommendation';
  return 'Other';
}

function prettify(key: string): string {
  return key
    .split('_')
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{
      key: string;
      status: 'inserted' | 'updated' | 'unchanged' | 'error';
      error?: string;
    }> = [];

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
      const d = def as SystemPromptDef;
      if (!cur) {
        // INSERT — chave nova do manifest ainda não está no DB.
        const family = deriveFamily(key);
        const display_name = prettify(key);
        const consumer = (d.consumers ?? [])[0] ?? null;
        const { error: insErr } = await supabase.from('ai_system_prompts').insert({
          prompt_key: key,
          family,
          display_name,
          function_name: consumer,
          default_content: d.content,
          purpose: d.purpose ?? null,
          model_default: d.model_default ?? null,
          temperature: d.temperature ?? null,
          output_format: d.output_format ?? null,
          consumers: d.consumers ?? null,
          tags: d.tags ?? null,
          example_input: d.example_input ?? null,
          is_active: true,
        });
        if (insErr) results.push({ key, status: 'error', error: insErr.message });
        else results.push({ key, status: 'inserted' });
        continue;
      }
      const patch: Record<string, unknown> = {};
      if ((cur.default_content ?? '') !== d.content) patch.default_content = d.content;
      if (d.purpose !== undefined && cur.purpose !== d.purpose) patch.purpose = d.purpose;
      if (d.model_default !== undefined && cur.model_default !== d.model_default) patch.model_default = d.model_default;
      if (d.temperature !== undefined && Number(cur.temperature) !== d.temperature) patch.temperature = d.temperature;
      if (d.output_format !== undefined && cur.output_format !== d.output_format) patch.output_format = d.output_format;
      if (d.consumers !== undefined && JSON.stringify(cur.consumers ?? []) !== JSON.stringify(d.consumers)) patch.consumers = d.consumers;
      if (d.tags !== undefined && JSON.stringify(cur.tags ?? []) !== JSON.stringify(d.tags)) patch.tags = d.tags;
      if (d.example_input !== undefined && cur.example_input !== d.example_input) patch.example_input = d.example_input;
      if (Object.keys(patch).length === 0) {
        results.push({ key, status: 'unchanged' });
        continue;
      }
      patch.updated_at = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('ai_system_prompts')
        .update(patch)
        .eq('prompt_key', key);
      if (updErr) results.push({ key, status: 'error', error: updErr.message });
      else results.push({ key, status: 'updated' });
    }

    const summary = {
      inserted: results.filter((r) => r.status === 'inserted').length,
      updated: results.filter((r) => r.status === 'updated').length,
      unchanged: results.filter((r) => r.status === 'unchanged').length,
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