import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// NCBI MeSH via E-utilities (free, no key; ~3 req/s)
async function lookupMesh(name: string): Promise<string | null> {
  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=mesh&retmode=json&retmax=1&term=${encodeURIComponent(name + '[MeSH Terms]')}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const uid = j?.esearchresult?.idlist?.[0];
    if (!uid) return null;
    const r2 = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=mesh&retmode=json&id=${uid}`);
    if (!r2.ok) return uid;
    const j2 = await r2.json();
    return j2?.result?.[uid]?.ds_meshui || uid;
  } catch { return null; }
}

// EBI OLS4 (free, no key) — works for chebi, omia, etc.
async function lookupOls(name: string, ontology: 'chebi' | 'omia'): Promise<string | null> {
  try {
    const url = `https://www.ebi.ac.uk/ols4/api/search?q=${encodeURIComponent(name)}&ontology=${ontology}&exact=false&rows=1&fieldList=obo_id,short_form,label`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const doc = j?.response?.docs?.[0];
    return doc?.obo_id || doc?.short_form || null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: conds, error: cerr } = await supabase
      .from('health_conditions')
      .select('id, name, name_en, canonical_id')
      .is('canonical_id', null);
    if (cerr) throw cerr;

    const condUpdates: any[] = [];
    const condUnmatched: any[] = [];
    for (const c of conds ?? []) {
      const q = c.name_en || c.name;
      let id: string | null = null; let src = '';
      const omia = await lookupOls(q, 'omia');
      if (omia) { id = omia; src = 'OMIA'; }
      else {
        await sleep(350);
        const mesh = await lookupMesh(q);
        if (mesh) { id = mesh; src = 'MeSH'; }
      }
      if (id) condUpdates.push({ id: c.id, canonical_id: id, canonical_source: src, matched_name: q });
      else condUnmatched.push({ id: c.id, name: c.name, name_en: c.name_en });
      await sleep(150);
    }

    const { data: nutras, error: nerr } = await supabase
      .from('nutraceuticals')
      .select('id, name, name_en, canonical_id')
      .is('canonical_id', null);
    if (nerr) throw nerr;

    const nutraUpdates: any[] = [];
    const nutraUnmatched: any[] = [];
    for (const n of nutras ?? []) {
      const q = n.name_en || n.name;
      let id: string | null = null; let src = '';
      const chebi = await lookupOls(q, 'chebi');
      if (chebi) { id = chebi; src = 'ChEBI'; }
      else {
        await sleep(350);
        const mesh = await lookupMesh(q);
        if (mesh) { id = mesh; src = 'MeSH'; }
      }
      if (id) nutraUpdates.push({ id: n.id, canonical_id: id, canonical_source: src, matched_name: q });
      else nutraUnmatched.push({ id: n.id, name: n.name, name_en: n.name_en });
      await sleep(150);
    }

    if (!dryRun) {
      for (const u of condUpdates) {
        await supabase.from('health_conditions')
          .update({ canonical_id: u.canonical_id, canonical_source: u.canonical_source })
          .eq('id', u.id);
      }
      for (const u of nutraUpdates) {
        await supabase.from('nutraceuticals')
          .update({ canonical_id: u.canonical_id, canonical_source: u.canonical_source })
          .eq('id', u.id);
      }
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      conditions: {
        total: conds?.length ?? 0,
        matched: condUpdates.length,
        unmatched: condUnmatched.length,
        samples_matched: condUpdates.slice(0, 10),
        samples_unmatched: condUnmatched.slice(0, 20),
      },
      nutraceuticals: {
        total: nutras?.length ?? 0,
        matched: nutraUpdates.length,
        unmatched: nutraUnmatched.length,
        samples_matched: nutraUpdates.slice(0, 10),
        samples_unmatched: nutraUnmatched.slice(0, 20),
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
