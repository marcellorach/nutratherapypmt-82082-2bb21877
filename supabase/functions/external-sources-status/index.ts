import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getApiKey } from '../_shared/get-api-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SourceId = 'umls' | 'snomed' | 'mesh' | 'omia' | 'chebi' | 'pubmed' | 'perplexity';

interface SourceStatus {
  id: SourceId;
  name: string;
  category: 'ontology' | 'literature' | 'ai';
  requires_key: boolean;
  secret_name: string | null;
  configured: boolean;
  reachable: boolean | null;
  latency_ms: number | null;
  entries: number | null;
  last_sync: string | null;
  last_error: string | null;
  docs_url: string;
}

async function ping(url: string, init?: RequestInit, timeoutMs = 4000): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return { ok: res.ok, latency: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, latency: Date.now() - start, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Resolve keys from encrypted api_keys table first, env as fallback.
    const [UMLS, NCBI, PPLX] = await Promise.all([
      getApiKey('NLM_UMLS_API_KEY').then(v => v ?? ''),
      getApiKey('NCBI_API_KEY').then(v => v ?? ''),
      getApiKey('PERPLEXITY_API_KEY').then(v => v ?? ''),
    ]);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Counts of mapped entities (used by mapping sub-tab)
    const [{ count: snomedMapped }, { count: umlsMapped }, { count: totalConds }, { count: totalNutrs }] = await Promise.all([
      supabase.from('health_conditions').select('*', { count: 'exact', head: true }).not('snomed_code', 'is', null),
      supabase.from('health_conditions').select('*', { count: 'exact', head: true }).not('umls_cui', 'is', null),
      supabase.from('health_conditions').select('*', { count: 'exact', head: true }),
      supabase.from('nutraceuticals').select('*', { count: 'exact', head: true }),
    ]);

    // Live pings (cheap, public endpoints)
    const [umlsPing, meshPing, omiaPing, chebiPing, pubmedPing] = await Promise.all([
      UMLS ? ping(`https://uts-ws.nlm.nih.gov/rest/search/current?string=diabetes&apiKey=${UMLS}&pageSize=1`) : Promise.resolve({ ok: false, latency: 0, error: 'no key' }),
      ping('https://id.nlm.nih.gov/mesh/sparql?query=ASK%20%7B%7D&format=json'),
      ping('https://omia.org/api/', { method: 'HEAD' }),
      ping('https://www.ebi.ac.uk/ols4/api/ontologies/chebi'),
      ping(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed${NCBI ? `&api_key=${NCBI}` : ''}`),
    ]);

    const pplxPing = PPLX
      ? await ping('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PPLX}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
        })
      : { ok: false, latency: 0, error: 'no key' };

    const sources: SourceStatus[] = [
      {
        id: 'umls',
        name: 'UMLS Metathesaurus',
        category: 'ontology',
        requires_key: true,
        secret_name: 'NLM_UMLS_API_KEY',
        configured: !!UMLS,
        reachable: UMLS ? umlsPing.ok : null,
        latency_ms: UMLS ? umlsPing.latency : null,
        entries: umlsMapped ?? 0,
        last_sync: null,
        last_error: UMLS ? (umlsPing.error ?? null) : 'NLM_UMLS_API_KEY not configured',
        docs_url: 'https://uts.nlm.nih.gov/uts/signup-login',
      },
      {
        id: 'snomed',
        name: 'SNOMED-CT (via UMLS)',
        category: 'ontology',
        requires_key: true,
        secret_name: 'NLM_UMLS_API_KEY',
        configured: !!UMLS,
        reachable: UMLS ? umlsPing.ok : null,
        latency_ms: null,
        entries: snomedMapped ?? 0,
        last_sync: null,
        last_error: UMLS ? null : 'Requires UMLS API key',
        docs_url: 'https://www.snomed.org/snomed-ct/get-snomed',
      },
      {
        id: 'mesh',
        name: 'MeSH (NLM)',
        category: 'ontology',
        requires_key: false,
        secret_name: null,
        configured: true,
        reachable: meshPing.ok,
        latency_ms: meshPing.latency,
        entries: null,
        last_sync: null,
        last_error: meshPing.error ?? null,
        docs_url: 'https://www.nlm.nih.gov/mesh/',
      },
      {
        id: 'omia',
        name: 'OMIA (canine genetics)',
        category: 'ontology',
        requires_key: false,
        secret_name: null,
        configured: true,
        reachable: omiaPing.ok,
        latency_ms: omiaPing.latency,
        entries: null,
        last_sync: null,
        last_error: omiaPing.error ?? null,
        docs_url: 'https://omia.org',
      },
      {
        id: 'chebi',
        name: 'ChEBI / PubChem / KEGG',
        category: 'ontology',
        requires_key: false,
        secret_name: null,
        configured: true,
        reachable: chebiPing.ok,
        latency_ms: chebiPing.latency,
        entries: totalNutrs ?? 0,
        last_sync: null,
        last_error: chebiPing.error ?? null,
        docs_url: 'https://www.ebi.ac.uk/chebi/',
      },
      {
        id: 'pubmed',
        name: 'PubMed / NCBI E-utilities',
        category: 'literature',
        requires_key: false,
        secret_name: 'NCBI_API_KEY',
        configured: !!NCBI,
        reachable: pubmedPing.ok,
        latency_ms: pubmedPing.latency,
        entries: null,
        last_sync: null,
        last_error: pubmedPing.error ?? (NCBI ? null : 'NCBI_API_KEY optional (raises rate-limit 3→10 req/s)'),
        docs_url: 'https://www.ncbi.nlm.nih.gov/account/settings/',
      },
      {
        id: 'perplexity',
        name: 'Perplexity AI',
        category: 'ai',
        requires_key: true,
        secret_name: 'PERPLEXITY_API_KEY',
        configured: !!PPLX,
        reachable: PPLX ? pplxPing.ok : null,
        latency_ms: PPLX ? pplxPing.latency : null,
        entries: null,
        last_sync: null,
        last_error: PPLX ? (pplxPing.error ?? null) : 'PERPLEXITY_API_KEY not configured',
        docs_url: 'https://www.perplexity.ai/settings/api',
      },
    ];

    return new Response(
      JSON.stringify({ sources, summary: { total_conditions: totalConds ?? 0, total_nutraceuticals: totalNutrs ?? 0 }, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});