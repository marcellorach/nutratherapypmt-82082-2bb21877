// kg-evidence-gap-fill
// Searches PubMed E-utilities for evidence on (compound × condition) pairs
// where the Knowledge Graph lacks high-efficacy data, then uses Gemini to
// structure findings into pending triplets for human curation.
//
// Inputs (JSON body):
//   - pet_id?: string         → discover gaps from pet conditions + compound stack
//   - condition_id?: string   → directed mode (single condition)
//   - compound_ids?: string[] → directed mode (compounds to search)
//   - max_pairs?: number      → safety cap (default 12)
//   - dry_run?: boolean       → search but don't persist (default false)
//
// Output:
//   { pairs_searched, studies_added, triplets_pending, details: [...] }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_API_KEY = Deno.env.get('NCBI_API_KEY') || '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || '';
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

console.log('[gap-fill] boot', {
  hasLovable: !!LOVABLE_API_KEY,
  hasPerplexity: !!PERPLEXITY_API_KEY,
  hasNcbi: !!NCBI_API_KEY,
  hasUrl: !!SUPABASE_URL,
  hasServiceRole: !!SERVICE_ROLE,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withApiKey(url: string): string {
  if (!NCBI_API_KEY) return url;
  return url + (url.includes('?') ? '&' : '?') + `api_key=${NCBI_API_KEY}`;
}

async function pubmedSearchOnce(term: string, retmax: number): Promise<string[]> {
  const url = withApiKey(
    `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${retmax}&sort=relevance&retmode=json`,
  );
  const res = await fetch(url);
  if (!res.ok) throw new Error(`esearch HTTP ${res.status}`);
  const json = await res.json();
  return json?.esearchresult?.idlist || [];
}

/**
 * Search PubMed with two passes:
 *  1. Strict — restrict to canine/dog literature.
 *  2. Fallback — drop the species filter so we still catch reviews / mechanistic
 *     studies. Returned alongside the species hint so the caller can stamp
 *     `species_context` accordingly.
 */
async function pubmedSearch(
  compound: string,
  condition: string,
  retmax = 8,
): Promise<{ pmids: string[]; speciesHint: 'canine' | 'unspecified' }> {
  const strictTerm = `("${compound}"[Title/Abstract]) AND ("${condition}"[Title/Abstract]) AND (canine[Title/Abstract] OR dog[Title/Abstract] OR dogs[Title/Abstract])`;
  const strict = await pubmedSearchOnce(strictTerm, retmax);
  if (strict.length > 0) return { pmids: strict, speciesHint: 'canine' };
  const looseTerm = `("${compound}"[Title/Abstract]) AND ("${condition}"[Title/Abstract])`;
  const loose = await pubmedSearchOnce(looseTerm, retmax);
  return { pmids: loose, speciesHint: 'unspecified' };
}

interface PubmedRecord {
  pmid: string;
  title: string;
  abstract: string;
  year: number | null;
  journal: string;
  doi: string | null;
  authors: string[];
}

function parsePubmedXml(xml: string): PubmedRecord[] {
  const records: PubmedRecord[] = [];
  // Split by <PubmedArticle> blocks.
  const blocks = xml.split(/<PubmedArticle[\s>]/).slice(1);
  for (const raw of blocks) {
    const block = '<PubmedArticle ' + raw;
    const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '';
    if (!pmid) continue;
    const title = (block.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] || '')
      .replace(/<[^>]+>/g, '').trim();
    const abstractParts: string[] = [];
    const absRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let m: RegExpExecArray | null;
    while ((m = absRegex.exec(block)) !== null) {
      abstractParts.push(m[1].replace(/<[^>]+>/g, '').trim());
    }
    const abstract = abstractParts.join(' ');
    const yearStr = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1]
      || block.match(/<PubDate>[\s\S]*?<MedlineDate>(\d{4})/)?.[1] || '';
    const journal = (block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || '').trim();
    const doi = block.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1] || null;
    const authors: string[] = [];
    const authorRegex = /<Author[^>]*>[\s\S]*?<LastName>([^<]+)<\/LastName>[\s\S]*?(?:<ForeName>([^<]+)<\/ForeName>)?[\s\S]*?<\/Author>/g;
    while ((m = authorRegex.exec(block)) !== null) {
      authors.push(m[2] ? `${m[2]} ${m[1]}` : m[1]);
    }
    records.push({
      pmid,
      title,
      abstract,
      year: yearStr ? parseInt(yearStr, 10) : null,
      journal,
      doi,
      authors: authors.slice(0, 8),
    });
  }
  return records;
}

async function pubmedFetch(pmids: string[]): Promise<PubmedRecord[]> {
  if (!pmids.length) return [];
  const url = withApiKey(
    `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=abstract&retmode=xml`,
  );
  const res = await fetch(url);
  if (!res.ok) throw new Error(`efetch HTTP ${res.status}`);
  const xml = await res.text();
  return parsePubmedXml(xml);
}

interface GeminiAssessment {
  efficacy_0_5: number;
  evidence_level: 'meta_analysis' | 'clinical_trial' | 'in_vivo' | 'in_vitro' | 'case_report' | 'review' | 'unclear';
  rationale: string;
  cited_pmids: string[];
  llm_confidence: number;
}

async function assessWithGemini(
  compound: string,
  condition: string,
  records: PubmedRecord[],
): Promise<GeminiAssessment | null> {
  if (!records.length) return null;
  const corpus = records
    .map((r) => `PMID:${r.pmid} (${r.year ?? 'n.d.'}) ${r.title}\n${r.abstract}`)
    .join('\n\n---\n\n')
    .slice(0, 18000);

  const body = {
    model: 'google/gemini-3-flash-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a veterinary evidence reviewer for canine geroprotector therapies. ' +
          'Score the strength of evidence that the COMPOUND meaningfully treats or attenuates the CONDITION in dogs. ' +
          'Use ONLY the abstracts provided. Be conservative.',
      },
      {
        role: 'user',
        content:
          `COMPOUND: ${compound}\nCONDITION: ${condition} (canine)\n\nABSTRACTS:\n${corpus}\n\n` +
          'Return your assessment via the assess_evidence tool. ' +
          'efficacy_0_5: 0=no evidence, 1=anecdotal, 2=in vitro/cell, 3=in vivo dog or strong rodent, 4=clinical trial dog, 5=meta-analysis dog. ' +
          'cited_pmids must be a subset of the PMIDs above. llm_confidence in [0,1].',
      },
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'assess_evidence',
        description: 'Structured evidence assessment',
        parameters: {
          type: 'object',
          properties: {
            efficacy_0_5: { type: 'number', minimum: 0, maximum: 5 },
            evidence_level: {
              type: 'string',
              enum: ['meta_analysis', 'clinical_trial', 'in_vivo', 'in_vitro', 'case_report', 'review', 'unclear'],
            },
            rationale: { type: 'string' },
            cited_pmids: { type: 'array', items: { type: 'string' } },
            llm_confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['efficacy_0_5', 'evidence_level', 'rationale', 'cited_pmids', 'llm_confidence'],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: 'function', function: { name: 'assess_evidence' } },
  };

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text());
    return null;
  }
  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments) as GeminiAssessment;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log('[gap-fill] request received', req.method, req.url);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[gap-fill] missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      console.warn('[gap-fill] auth.getClaims failed', claimsErr?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub;
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      console.warn('[gap-fill] non-admin user blocked', userId);
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { pet_id, condition_id, compound_ids, max_pairs = 12, dry_run = false } = body;
    console.log('[gap-fill] body', { pet_id, condition_id, compound_ids_count: compound_ids?.length, max_pairs, dry_run });

    // ---------- Build the (compound × condition) pair list ----------
    type Pair = { compound_id?: string; compound_en: string; condition_id?: string; condition_en: string };
    const pairs: Pair[] = [];
    const discoveryNotes: string[] = [];

    if (pet_id) {
      const { data: pet } = await supabase
        .from('pet_conditions')
        .select('condition_id, health_conditions(id, name, name_en)')
        .eq('pet_id', pet_id);
      const conds = (pet || [])
        .map((row: any) => row.health_conditions)
        .filter(Boolean);
      console.log('[gap-fill] pet conditions found', conds.length);
      const condsWithEn = conds.filter((c: any) => c?.name_en);
      if (conds.length > 0 && condsWithEn.length === 0) {
        discoveryNotes.push('Conditions found but none has name_en — gap-fill needs canonical English to query PubMed.');
      }

      // Prefer the compounds the VetGraphRAG analysis actually recommended for
      // THIS pet. Falls back to the top geriatric shortlist if no snapshot.
      let compounds: Array<{ id?: string; name_en: string }> = [];
      const { data: snap } = await supabase
        .from('pet_clinical_analysis_snapshots')
        .select('recommendation_compounds')
        .eq('pet_id', pet_id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const stackNames: string[] = Array.isArray(snap?.recommendation_compounds)
        ? (snap!.recommendation_compounds as any[])
            .map((c: any) => (typeof c === 'string' ? c : c?.name))
            .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0)
        : [];
      if (stackNames.length > 0) {
        const lower = stackNames.map(s => s.toLowerCase().trim());
        const { data: nutras } = await supabase
          .from('nutraceuticals')
          .select('id, name, name_en');
        compounds = (nutras || [])
          .filter((n: any) =>
            n.name_en &&
            (lower.includes(String(n.name_en).toLowerCase().trim()) ||
             lower.includes(String(n.name || '').toLowerCase().trim())),
          )
          .map((n: any) => ({ id: n.id, name_en: n.name_en }));
        console.log('[gap-fill] using stack-derived compounds', compounds.length, 'from', stackNames.length);
        if (compounds.length === 0) {
          discoveryNotes.push(`Stack has ${stackNames.length} compound(s) but none matched any nutraceutical with name_en in DB.`);
        }
      }
      if (compounds.length === 0) {
        const { data: nutras } = await supabase
          .from('nutraceuticals')
          .select('id, name, name_en')
          .limit(40);
        compounds = (nutras || [])
          .filter((n: any) => n.name_en)
          .map((n: any) => ({ id: n.id, name_en: n.name_en }));
        console.log('[gap-fill] using fallback geriatric shortlist', compounds.length);
      }

      for (const cond of condsWithEn) {
        for (const cmp of compounds) {
          if (pairs.length >= max_pairs) break;
          // skip if KG already has efficacy >= 3 for this pair
          const { count } = await supabase
            .from('triplet_extractions')
            .select('id', { count: 'exact', head: true })
            .eq('subject_name', cmp.name_en)
            .eq('object_name', cond.name_en)
            .eq('curation_status', 'approved')
            .gte('extraction_confidence', 0.6);
          if ((count || 0) > 0) continue;
          pairs.push({
            compound_id: cmp.id, compound_en: cmp.name_en,
            condition_id: cond.id, condition_en: cond.name_en,
          });
        }
        if (pairs.length >= max_pairs) break;
      }
    } else if (condition_id && Array.isArray(compound_ids)) {
      const { data: cond } = await supabase
        .from('health_conditions').select('id, name_en').eq('id', condition_id).single();
      const { data: cmps } = await supabase
        .from('nutraceuticals').select('id, name_en').in('id', compound_ids);
      for (const c of (cmps || [])) {
        if (!cond?.name_en || !c.name_en) continue;
        pairs.push({
          compound_id: c.id, compound_en: c.name_en,
          condition_id: cond.id, condition_en: cond.name_en,
        });
      }
    }

    console.log('[gap-fill] pairs to search', pairs.length);
    if (!pairs.length) {
      return new Response(JSON.stringify({
        pairs_searched: 0, studies_added: 0, triplets_pending: 0,
        message: discoveryNotes.length
          ? `No gaps found. ${discoveryNotes.join(' ')}`
          : 'No gaps found for the given inputs (every relevant pair already has approved KG evidence ≥0.6).',
        discovery_notes: discoveryNotes,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---------- Search + assess each pair ----------
    let studiesAdded = 0;
    let tripletsPending = 0;
    const details: any[] = [];

    for (const pair of pairs) {
      try {
        const { pmids, speciesHint } = await pubmedSearch(pair.compound_en, pair.condition_en);
        await sleep(NCBI_API_KEY ? 110 : 360);
        if (!pmids.length) {
          details.push({ pair, status: 'no_pubmed_results' });
          continue;
        }
        const records = await pubmedFetch(pmids);
        await sleep(NCBI_API_KEY ? 110 : 360);
        if (!records.length) {
          details.push({ pair, status: 'no_records' });
          continue;
        }

        const assessment = await assessWithGemini(pair.compound_en, pair.condition_en, records);
        if (!assessment) {
          details.push({ pair, status: 'assessment_failed', pmids: records.length });
          continue;
        }

        if (dry_run) {
          details.push({ pair, status: 'dry_run', assessment, pmids: records.map(r => r.pmid), species_hint: speciesHint });
          continue;
        }

        // Persist studies (dedup by PMID)
        const citedSet = new Set(assessment.cited_pmids);
        const toInsert = records.filter(r => citedSet.has(r.pmid));
        const studyIds: string[] = [];
        for (const r of toInsert) {
          const { data: existing } = await supabase
            .from('scientific_studies').select('id').eq('pmid', r.pmid).maybeSingle();
          if (existing?.id) {
            studyIds.push(existing.id);
            continue;
          }
          const { data: ins, error: insErr } = await supabase
            .from('scientific_studies').insert({
              title: r.title,
              title_en: r.title,
              abstract: r.abstract,
              abstract_en: r.abstract,
              year: r.year,
              journal: r.journal,
              doi: r.doi,
              authors: r.authors,
              pmid: r.pmid,
              external_id: `pmid:${r.pmid}`,
              source_api: 'pubmed_gap_fill',
              link: `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`,
              is_simulated: false,
            }).select('id').single();
          if (insErr) {
            console.error('study insert error', insErr);
            continue;
          }
          studyIds.push(ins.id);
          studiesAdded++;
        }

        // Insert one triplet (compound -[treats]-> condition) as PENDING
        const primaryStudyId = studyIds[0] || null;
        const efficacyNorm = Math.max(0, Math.min(1, assessment.efficacy_0_5 / 5));
        const { error: tErr } = await supabase.from('triplet_extractions').insert({
          study_id: primaryStudyId,
          subject_type: 'compound',
          subject_id: pair.compound_id || null,
          subject_name: pair.compound_en,
          subject_layer: 'compound',
          object_type: 'condition',
          object_id: pair.condition_id || null,
          object_name: pair.condition_en,
          object_layer: 'condition',
          predicate: 'treats',
          relationship_category: 'therapeutic',
          intensity: efficacyNorm,
          direction: 'positive',
          extraction_confidence: efficacyNorm,
          llm_confidence: assessment.llm_confidence,
          evidence_level: assessment.evidence_level,
          species_context: [speciesHint],
          confidence_rationale: assessment.rationale,
          curation_status: 'pending', // gap-fill is ALWAYS reviewed
          auto_approved: false,
          hallucination_flag: false,
          approval_chain: { source: 'pubmed_gap_fill', cited_pmids: assessment.cited_pmids, species_hint: speciesHint },
        });
        if (tErr) {
          console.error('triplet insert error', tErr);
          details.push({ pair, status: 'triplet_failed', error: tErr.message });
          continue;
        }
        tripletsPending++;
        details.push({
          pair, status: 'ok',
          efficacy_0_5: assessment.efficacy_0_5,
          evidence_level: assessment.evidence_level,
          species_hint: speciesHint,
          studies: studyIds.length,
          cited_pmids: assessment.cited_pmids,
        });
      } catch (e) {
        console.error('pair error', pair, e);
        details.push({ pair, status: 'error', error: String(e) });
      }
    }

    console.log('[gap-fill] done', { pairs: pairs.length, studiesAdded, tripletsPending });
    return new Response(JSON.stringify({
      pairs_searched: pairs.length,
      studies_added: studiesAdded,
      triplets_pending: tripletsPending,
      discovery_notes: discoveryNotes,
      details,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('gap-fill error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});