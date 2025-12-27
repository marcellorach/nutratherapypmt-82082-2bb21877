import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Using ChEBI web services
    const searchUrl = `https://www.ebi.ac.uk/webservices/chebi/2.0/test/getLiteEntity?search=${encodeURIComponent(query)}&searchCategory=ALL&maximumResults=${limit}&starsCategory=ALL`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`ChEBI search failed: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const results: ExternalOntologyResult[] = [];
    
    // Parse XML response - extract chebiId and chebiAsciiName
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
        source_metadata: { chebi_id: ids[i] }
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
    // PubChem compound search
    const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`PubChem search failed: ${response.status}`);
      
      // Try autocomplete as fallback
      const autocompleteUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/json?limit=${limit}`;
      const autocompleteResp = await fetch(autocompleteUrl);
      
      if (autocompleteResp.ok) {
        const autocompleteData = await autocompleteResp.json();
        const suggestions = autocompleteData.dictionary_terms?.compound || [];
        
        return suggestions.slice(0, limit).map((name: string) => ({
          external_id: `suggestion:${name}`,
          name: name,
          name_en: name,
          synonyms: [],
          source: 'PubChem',
          external_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(name)}`,
          source_metadata: { type: 'autocomplete_suggestion' }
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
      source_metadata: { cid: prop.CID, molecular_formula: prop.MolecularFormula }
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
        source_metadata: { kegg_id: compoundId, all_names: names }
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
      source_metadata: { mesh_uri: item.resource }
    }));
    
    console.log(`MeSH returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('MeSH search error:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, query, limit = 10, entity_type } = await req.json();
    
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
      case 'all':
      default:
        // Search all sources in parallel
        const [chebiResults, pubchemResults, keggResults] = await Promise.all([
          searchChEBI(query, Math.ceil(limit / 3)),
          searchPubChem(query, Math.ceil(limit / 3)),
          searchKEGG(query, Math.ceil(limit / 3))
        ]);
        results = [...chebiResults, ...pubchemResults, ...keggResults];
        break;
    }

    console.log(`Total results: ${results.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        query,
        source: source || 'all',
        count: results.length,
        results 
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
