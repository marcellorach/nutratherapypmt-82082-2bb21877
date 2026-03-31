import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalOntologyResult {
  external_id: string;
  name: string;
  name_en?: string;
  synonyms: string[];
  description?: string;
  chemical_formula?: string;
  molecular_weight?: number;
  source: string;
  external_url?: string;
  source_metadata?: Record<string, unknown>;
}

// Search ChEBI API
async function searchChEBI(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  console.log(`Searching ChEBI for: ${query}`);
  try {
    const searchUrl = `https://www.ebi.ac.uk/webservices/chebi/2.0/test/getLiteEntity?search=${encodeURIComponent(query)}&searchCategory=ALL&maximumResults=${limit}&starsCategory=ALL`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`ChEBI search failed: ${response.status}`);
      return [];
    }
    const xmlText = await response.text();
    const results: ExternalOntologyResult[] = [];
    const chebiIdMatches = xmlText.matchAll(/<chebiId>([^<]+)<\/chebiId>/g);
    const chebiNameMatches = xmlText.matchAll(/<chebiAsciiName>([^<]+)<\/chebiAsciiName>/g);
    const ids = Array.from(chebiIdMatches).map(m => m[1]);
    const names = Array.from(chebiNameMatches).map(m => m[1]);
    for (let i = 0; i < Math.min(ids.length, names.length, limit); i++) {
      results.push({
        external_id: ids[i],
        name: names[i],
        name_en: names[i],
        synonyms: [],
        source: 'ChEBI',
        external_url: `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${ids[i]}`,
        source_metadata: { chebi_id: ids[i], mapping_method: 'api_lookup' }
      });
    }
    console.log(`ChEBI returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('ChEBI search error:', error);
    return [];
  }
}

// Search PubChem API
async function searchPubChem(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  console.log(`Searching PubChem for: ${query}`);
  try {
    const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`PubChem search failed: ${response.status}`);
      const autocompleteUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/json?limit=${limit}`;
      const autocompleteResp = await fetch(autocompleteUrl);
      if (autocompleteResp.ok) {
        const autocompleteData = await autocompleteResp.json();
        const suggestions = autocompleteData.dictionary_terms?.compound || [];
        return suggestions.slice(0, limit).map((name: string) => ({
          external_id: `suggestion:${name}`,
          name,
          name_en: name,
          synonyms: [],
          source: 'PubChem',
          external_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(name)}`,
          source_metadata: { type: 'autocomplete_suggestion', mapping_method: 'api_lookup' }
        }));
      }
      return [];
    }
    const data = await response.json();
    const properties = data.PropertyTable?.Properties || [];
    const results: ExternalOntologyResult[] = properties.slice(0, limit).map((prop: Record<string, unknown>) => ({
      external_id: `CID:${prop.CID}`,
      name: (prop.IUPACName as string) || query,
      name_en: (prop.IUPACName as string) || query,
      synonyms: [],
      chemical_formula: prop.MolecularFormula as string,
      molecular_weight: prop.MolecularWeight as number,
      source: 'PubChem',
      external_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${prop.CID}`,
      source_metadata: { cid: prop.CID, molecular_formula: prop.MolecularFormula, mapping_method: 'api_lookup' }
    }));
    console.log(`PubChem returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('PubChem search error:', error);
    return [];
  }
}

// Search KEGG Compound API
async function searchKEGG(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  console.log(`Searching KEGG for: ${query}`);
  try {
    const searchUrl = `https://rest.kegg.jp/find/compound/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`KEGG search failed: ${response.status}`);
      return [];
    }
    const text = await response.text();
    const lines = text.trim().split('\n').filter(l => l.length > 0);
    const results: ExternalOntologyResult[] = lines.slice(0, limit).map(line => {
      const [id, namesStr] = line.split('\t');
      const names = namesStr?.split('; ') || [];
      const compoundId = id.replace('cpd:', '');
      return {
        external_id: compoundId,
        name: names[0] || query,
        name_en: names[0] || query,
        synonyms: names.slice(1),
        source: 'KEGG',
        external_url: `https://www.genome.jp/entry/${compoundId}`,
        source_metadata: { kegg_id: compoundId, all_names: names, mapping_method: 'api_lookup' }
      };
    });
    console.log(`KEGG returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('KEGG search error:', error);
    return [];
  }
}

// Search MeSH (Medical Subject Headings) for conditions
async function searchMeSH(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  console.log(`Searching MeSH for: ${query}`);
  try {
    const searchUrl = `https://id.nlm.nih.gov/mesh/lookup/descriptor?label=${encodeURIComponent(query)}&match=contains&limit=${limit}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`MeSH search failed: ${response.status}`);
      return [];
    }
    const data = await response.json();
    const results: ExternalOntologyResult[] = data.map((item: Record<string, unknown>) => ({
      external_id: item.resource as string,
      name: item.label as string,
      name_en: item.label as string,
      synonyms: [],
      source: 'MeSH',
      external_url: item.resource as string,
      source_metadata: { mesh_uri: item.resource, mapping_method: 'api_lookup' }
    }));
    console.log(`MeSH returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('MeSH search error:', error);
    return [];
  }
}

// Search UMLS REST API — requires NLM_UMLS_API_KEY
async function searchUMLS(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  const apiKey = Deno.env.get('NLM_UMLS_API_KEY');
  if (!apiKey) {
    console.log('UMLS API key not configured — skipping UMLS search');
    return [];
  }

  console.log(`Searching UMLS for: ${query}`);
  try {
    const searchUrl = `https://uts-ws.nlm.nih.gov/rest/search/current?string=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=${limit}&returnIdType=concept`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`UMLS search failed: ${response.status}`);
      const body = await response.text();
      console.log(`UMLS response: ${body}`);
      return [];
    }
    const data = await response.json();
    const results_raw = data.result?.results || [];

    const results: ExternalOntologyResult[] = results_raw
      .filter((r: Record<string, unknown>) => r.ui !== 'NONE')
      .slice(0, limit)
      .map((r: Record<string, unknown>) => ({
        external_id: r.ui as string,
        name: r.name as string,
        name_en: r.name as string,
        synonyms: [],
        source: 'UMLS',
        external_url: `https://uts.nlm.nih.gov/uts/umls/concept/${r.ui}`,
        source_metadata: {
          cui: r.ui,
          root_source: r.rootSource,
          semantic_types: [],
          mapping_method: 'api_lookup'
        }
      }));

    console.log(`UMLS returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('UMLS search error:', error);
    return [];
  }
}

// Search SNOMED-CT via UMLS — filters by SNOMEDCT_VET root source
async function searchSNOMED(query: string, limit: number): Promise<ExternalOntologyResult[]> {
  const apiKey = Deno.env.get('NLM_UMLS_API_KEY');
  if (!apiKey) {
    console.log('UMLS API key not configured — skipping SNOMED search');
    return [];
  }

  console.log(`Searching SNOMED-CT VET for: ${query}`);
  try {
    // Search UMLS filtering by SNOMED CT Veterinary Extension
    const searchUrl = `https://uts-ws.nlm.nih.gov/rest/search/current?string=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=${limit}&returnIdType=concept&sabs=SNOMEDCT_VET`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      // Fallback: try general SNOMED CT
      console.log(`SNOMED VET search failed (${response.status}), trying general SNOMED CT...`);
      const body = await response.text();
      console.log(`SNOMED VET response: ${body}`);
      
      const fallbackUrl = `https://uts-ws.nlm.nih.gov/rest/search/current?string=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=${limit}&returnIdType=concept&sabs=SNOMEDCT_US`;
      const fallbackResp = await fetch(fallbackUrl);
      if (!fallbackResp.ok) {
        const fb = await fallbackResp.text();
        console.log(`SNOMED US fallback also failed: ${fb}`);
        return [];
      }
      const fallbackData = await fallbackResp.json();
      const fallbackResults = fallbackData.result?.results || [];
      return fallbackResults
        .filter((r: Record<string, unknown>) => r.ui !== 'NONE')
        .slice(0, limit)
        .map((r: Record<string, unknown>) => ({
          external_id: r.ui as string,
          name: r.name as string,
          name_en: r.name as string,
          synonyms: [],
          source: 'SNOMED-CT',
          external_url: `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${r.ui}`,
          source_metadata: {
            snomed_code: r.ui,
            cui: null,
            root_source: 'SNOMEDCT_US',
            mapping_method: 'api_lookup'
          }
        }));
    }
    
    const data = await response.json();
    const results_raw = data.result?.results || [];

    const results: ExternalOntologyResult[] = results_raw
      .filter((r: Record<string, unknown>) => r.ui !== 'NONE')
      .slice(0, limit)
      .map((r: Record<string, unknown>) => ({
        external_id: r.ui as string,
        name: r.name as string,
        name_en: r.name as string,
        synonyms: [],
        source: 'SNOMED-CT-VET',
        external_url: `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${r.ui}`,
        source_metadata: {
          snomed_code: r.ui,
          cui: null,
          root_source: 'SNOMEDCT_VET',
          mapping_method: 'api_lookup'
        }
      }));

    console.log(`SNOMED returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('SNOMED search error:', error);
    return [];
  }
}

// Check UMLS API availability
function checkUMLSAvailability(): { configured: boolean; message: string } {
  const apiKey = Deno.env.get('NLM_UMLS_API_KEY');
  return {
    configured: !!apiKey,
    message: apiKey ? 'UMLS API configured' : 'NLM_UMLS_API_KEY not set — UMLS/SNOMED searches disabled'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { source, query, limit = 10, entity_type, action } = body;

    // Special action: check API status
    if (action === 'check_status') {
      const umls = checkUMLSAvailability();
      return new Response(
        JSON.stringify({
          success: true,
          sources: {
            chebi: { configured: true, name: 'ChEBI' },
            pubchem: { configured: true, name: 'PubChem' },
            kegg: { configured: true, name: 'KEGG' },
            mesh: { configured: true, name: 'MeSH' },
            umls: { configured: umls.configured, name: 'UMLS', message: umls.message },
            snomed: { configured: umls.configured, name: 'SNOMED-CT VET', message: umls.message }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`=== fetch-external-ontologies ===`);
    console.log(`Source: ${source}, Query: ${query}, Limit: ${limit}, Type: ${entity_type}`);

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let results: ExternalOntologyResult[] = [];

    switch (source?.toLowerCase()) {
      case 'chebi':
        results = await searchChEBI(query, limit);
        break;
      case 'pubchem':
        results = await searchPubChem(query, limit);
        break;
      case 'kegg':
        results = await searchKEGG(query, limit);
        break;
      case 'mesh':
        results = await searchMeSH(query, limit);
        break;
      case 'umls':
        results = await searchUMLS(query, limit);
        break;
      case 'snomed':
        results = await searchSNOMED(query, limit);
        break;
      case 'all':
      default:
        // Search all sources in parallel
        const [chebiResults, pubchemResults, keggResults, umlsResults] = await Promise.all([
          searchChEBI(query, Math.ceil(limit / 4)),
          searchPubChem(query, Math.ceil(limit / 4)),
          searchKEGG(query, Math.ceil(limit / 4)),
          searchUMLS(query, Math.ceil(limit / 4))
        ]);
        results = [...chebiResults, ...pubchemResults, ...keggResults, ...umlsResults];
        break;
    }

    console.log(`Total results: ${results.length}`);

    const umlsStatus = checkUMLSAvailability();

    return new Response(
      JSON.stringify({
        success: true,
        query,
        source: source || 'all',
        count: results.length,
        results,
        umls_status: umlsStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-external-ontologies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
