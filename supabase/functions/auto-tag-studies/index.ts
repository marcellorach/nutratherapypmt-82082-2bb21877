// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const TAG_SCHEMA = {
  name: 'extract_study_tags',
  description: 'Extract structured tags from a scientific study based on title, abstract and journal.',
  parameters: {
    type: 'object',
    properties: {
      study_design: {
        type: 'array',
        description: 'Study design types found',
        items: {
          type: 'string',
          enum: ['rct', 'meta_analysis', 'systematic_review', 'cohort', 'case_control', 'cross_sectional', 'case_report', 'in_vitro', 'in_vivo', 'narrative_review', 'observational', 'other'],
        },
      },
      population: {
        type: 'array',
        description: 'Species studied',
        items: {
          type: 'string',
          enum: ['canine', 'feline', 'human', 'rodent', 'equine', 'bovine', 'in_vitro_cells', 'other'],
        },
      },
      methodology: {
        type: 'array',
        description: 'Methodological characteristics',
        items: {
          type: 'string',
          enum: ['double_blind', 'single_blind', 'open_label', 'placebo_controlled', 'randomized', 'crossover', 'parallel_group', 'multicenter'],
        },
      },
      sample_size: {
        type: 'integer',
        description: 'Number of subjects, if explicitly mentioned. Omit if unclear.',
      },
      confidence: {
        type: 'number',
        description: 'Confidence 0-1 in the extracted tags.',
      },
    },
    required: ['study_design', 'population', 'methodology', 'confidence'],
  },
};

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function getJournalTier(supabase: any, journal: string | null): Promise<number | null> {
  if (!journal) return null;
  const norm = normalize(journal);
  if (!norm) return null;
  const { data } = await supabase
    .from('journal_prestige_tiers')
    .select('tier')
    .eq('journal_name_normalized', norm)
    .maybeSingle();
  if (data?.tier) return data.tier;
  // Fuzzy contains fallback (substring match against seed list)
  const { data: all } = await supabase
    .from('journal_prestige_tiers')
    .select('journal_name_normalized, tier');
  if (all) {
    for (const row of all) {
      if (row.journal_name_normalized.length > 6 &&
          (norm.includes(row.journal_name_normalized) || row.journal_name_normalized.includes(norm))) {
        return row.tier;
      }
    }
  }
  // Heuristic: PubMed-indexed but unknown journal → Tier 2 default
  return 2;
}

async function callGemini(prompt: string): Promise<any> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: 'You extract objective study metadata. Only tag what is explicitly stated in title/abstract/journal. Never invent.' },
        { role: 'user', content: prompt },
      ],
      tools: [{ type: 'function', function: TAG_SCHEMA }],
      tool_choice: { type: 'function', function: { name: 'extract_study_tags' } },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error('No tool call returned');
  return JSON.parse(args);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { study_ids, all = false, limit = 100 } = body as { study_ids?: string[]; all?: boolean; limit?: number };

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let query = supabase
      .from('processed_studies')
      .select('id, title, description, journal, full_text_content')
      .is('deleted_at', null)
      .in('kanban_status', ['approved', 'processed', 'new']);

    if (study_ids && study_ids.length > 0) {
      query = query.in('id', study_ids);
    } else if (!all) {
      query = query.eq('tags_source', 'pending').limit(limit);
    } else {
      query = query.limit(limit);
    }

    const { data: studies, error } = await query;
    if (error) throw error;
    if (!studies || studies.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No studies to tag' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const study of studies) {
      try {
        const text = `Title: ${study.title || '(no title)'}\nJournal: ${study.journal || '(unknown)'}\nAbstract: ${(study.description || study.full_text_content || '').slice(0, 4000)}`;
        const extracted = await callGemini(text);
        const tier = await getJournalTier(supabase, study.journal);

        const tags = {
          study_design: extracted.study_design || [],
          population: extracted.population || [],
          methodology: extracted.methodology || [],
          sample_size: extracted.sample_size || null,
          ai_confidence: extracted.confidence || 0,
        };

        const { error: upErr } = await supabase
          .from('processed_studies')
          .update({
            tags,
            prestige_tier: tier,
            tags_source: 'ai_extracted',
          })
          .eq('id', study.id);
        if (upErr) throw upErr;

        results.push({ id: study.id, ok: true, tags, tier });
        // Throttle to avoid rate limits
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        results.push({ id: study.id, ok: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      ok_count: results.filter((r) => r.ok).length,
      fail_count: results.filter((r) => !r.ok).length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('auto-tag-studies error', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});