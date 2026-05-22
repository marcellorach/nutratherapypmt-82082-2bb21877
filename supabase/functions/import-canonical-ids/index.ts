import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'ontology-indexes';

function norm(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  return t.length ? t : null;
}

function lookup(
  indices: Array<{ source: string; map: Record<string, string> }>,
  candidates: (string | null)[],
): { canonical_id: string; canonical_source: string } | null {
  for (const cand of candidates) {
    if (!cand) continue;
    for (const idx of indices) {
      const hit = idx.map[cand];
      if (hit) return { canonical_id: hit, canonical_source: idx.source };
    }
  }
  return null;
}

async function loadJson(supabase: any, path: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(`download ${path}: ${error.message}`);
  const text = await data.text();
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const dryRun = !!body.dry_run;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log('Loading JSONs from storage…');
    const [omia, mesh, chebi] = await Promise.all([
      loadJson(supabase, 'omia-canine.json'),
      loadJson(supabase, 'mesh.json'),
      loadJson(supabase, 'chebi.json'),
    ]);
    console.log(`OMIA=${Object.keys(omia).length} MeSH=${Object.keys(mesh).length} ChEBI=${Object.keys(chebi).length}`);

    const condIdx = [
      { source: 'omia', map: omia },
      { source: 'mesh', map: mesh },
    ];
    const nutIdx = [
      { source: 'chebi', map: chebi },
      { source: 'mesh', map: mesh },
    ];

    // ---- health_conditions ----
    const { data: conditions, error: cErr } = await supabase
      .from('health_conditions')
      .select('id, name, name_en')
      .is('canonical_id', null);
    if (cErr) throw cErr;

    const condUnmatched: string[] = [];
    let condMatched = 0;
    for (const row of conditions ?? []) {
      const hit = lookup(condIdx, [norm(row.name_en), norm(row.name)]);
      if (!hit) { condUnmatched.push(row.name_en ?? row.name); continue; }
      condMatched++;
      if (!dryRun) {
        await supabase.from('health_conditions')
          .update({ canonical_id: hit.canonical_id, canonical_source: hit.canonical_source })
          .eq('id', row.id);
      }
    }

    // ---- nutraceuticals ----
    const { data: nutras, error: nErr } = await supabase
      .from('nutraceuticals')
      .select('id, name, name_en')
      .is('canonical_id', null);
    if (nErr) throw nErr;

    const nutUnmatched: string[] = [];
    let nutMatched = 0;
    for (const row of nutras ?? []) {
      const hit = lookup(nutIdx, [norm(row.name_en), norm(row.name)]);
      if (!hit) { nutUnmatched.push(row.name_en ?? row.name); continue; }
      nutMatched++;
      if (!dryRun) {
        await supabase.from('nutraceuticals')
          .update({ canonical_id: hit.canonical_id, canonical_source: hit.canonical_source })
          .eq('id', row.id);
      }
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      indices: { omia: Object.keys(omia).length, mesh: Object.keys(mesh).length, chebi: Object.keys(chebi).length },
      health_conditions: { matched: condMatched, unmatched: condUnmatched.length, unmatched_sample: condUnmatched.slice(0, 30) },
      nutraceuticals: { matched: nutMatched, unmatched: nutUnmatched.length, unmatched_sample: nutUnmatched.slice(0, 30) },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});