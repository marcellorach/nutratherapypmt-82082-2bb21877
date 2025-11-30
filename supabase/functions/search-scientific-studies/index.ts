import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query: string;
  source: 'pubmed' | 'openalex' | 'both';
  maxResults?: number;
  dateFrom?: string;
  dateTo?: string;
  species?: string[];
}

interface StudyResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  pmid?: string;
  openalexId?: string;
  source: 'pubmed' | 'openalex';
  url?: string;
}

// PubMed E-utilities API
async function searchPubMed(params: SearchParams): Promise<StudyResult[]> {
  console.log('Searching PubMed with query:', params.query);
  
  const maxResults = params.maxResults || 20;
  
  // Build search query with MeSH terms for veterinary
  let searchQuery = params.query;
  if (params.species?.length) {
    const speciesTerms = params.species.map(s => `${s}[MeSH]`).join(' OR ');
    searchQuery = `(${searchQuery}) AND (${speciesTerms})`;
  }
  
  // Add date filter if provided
  if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom || '1900/01/01';
    const to = params.dateTo || '3000/12/31';
    searchQuery = `${searchQuery} AND ${from}:${to}[dp]`;
  }
  
  try {
    // Step 1: Search for IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${maxResults}&retmode=json`;
    console.log('PubMed search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('PubMed search failed:', searchResponse.status);
      return [];
    }
    
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) {
      console.log('No PubMed results found');
      return [];
    }
    
    console.log(`Found ${ids.length} PubMed IDs:`, ids);
    
    // Step 2: Fetch details for each ID
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    
    if (!fetchResponse.ok) {
      console.error('PubMed fetch failed:', fetchResponse.status);
      return [];
    }
    
    const xmlText = await fetchResponse.text();
    
    // Parse XML response - simple regex-based parsing for reliability
    const articles: StudyResult[] = [];
    const articleMatches = xmlText.split('<PubmedArticle>').slice(1);
    
    for (const articleXml of articleMatches) {
      try {
        // Extract PMID
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const pmid = pmidMatch?.[1] || '';
        
        // Extract title
        const titleMatch = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
        const title = titleMatch?.[1] || 'Untitled';
        
        // Extract abstract
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
        const abstract = abstractMatch?.[1] || '';
        
        // Extract journal
        const journalMatch = articleXml.match(/<Title>([^<]+)<\/Title>/);
        const journal = journalMatch?.[1] || '';
        
        // Extract year
        const yearMatch = articleXml.match(/<PubDate>.*?<Year>(\d{4})<\/Year>.*?<\/PubDate>/s);
        const year = yearMatch?.[1] ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        // Extract authors
        const authors: string[] = [];
        const authorMatches = articleXml.matchAll(/<Author[^>]*>.*?<LastName>([^<]+)<\/LastName>.*?<ForeName>([^<]*)<\/ForeName>.*?<\/Author>/gs);
        for (const match of authorMatches) {
          authors.push(`${match[2]} ${match[1]}`.trim());
        }
        
        // Extract DOI
        const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
        const doi = doiMatch?.[1];
        
        articles.push({
          id: `pubmed_${pmid}`,
          title: decodeXmlEntities(title),
          authors: authors.length > 0 ? authors : ['Unknown Author'],
          journal: decodeXmlEntities(journal),
          year,
          abstract: decodeXmlEntities(abstract),
          doi,
          pmid,
          source: 'pubmed',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        });
      } catch (e) {
        console.error('Error parsing PubMed article:', e);
      }
    }
    
    console.log(`Parsed ${articles.length} PubMed articles`);
    return articles;
    
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

// OpenAlex API
async function searchOpenAlex(params: SearchParams): Promise<StudyResult[]> {
  console.log('Searching OpenAlex with query:', params.query);
  
  const maxResults = params.maxResults || 20;
  
  try {
    // Build filter for OpenAlex
    let filter = '';
    if (params.dateFrom) {
      filter += `from_publication_date:${params.dateFrom},`;
    }
    if (params.dateTo) {
      filter += `to_publication_date:${params.dateTo},`;
    }
    
    // Remove trailing comma
    filter = filter.replace(/,$/, '');
    
    const url = new URL('https://api.openalex.org/works');
    url.searchParams.set('search', params.query);
    url.searchParams.set('per_page', maxResults.toString());
    url.searchParams.set('mailto', 'api@vetgraph.ai'); // Polite pool
    
    if (filter) {
      url.searchParams.set('filter', filter);
    }
    
    console.log('OpenAlex URL:', url.toString());
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('OpenAlex search failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    console.log(`Found ${results.length} OpenAlex results`);
    
    return results.map((work: any) => {
      // Extract OpenAlex ID
      const openalexId = work.id?.replace('https://openalex.org/', '') || '';
      
      // Extract authors
      const authors = work.authorships?.map((a: any) => a.author?.display_name || 'Unknown').filter(Boolean) || ['Unknown Author'];
      
      // Extract DOI
      const doi = work.doi?.replace('https://doi.org/', '');
      
      // Extract PMID from IDs
      const pmidObj = work.ids?.pmid;
      const pmid = pmidObj?.replace('https://pubmed.ncbi.nlm.nih.gov/', '');
      
      return {
        id: `openalex_${openalexId}`,
        title: work.title || 'Untitled',
        authors,
        journal: work.primary_location?.source?.display_name || work.host_venue?.display_name || '',
        year: work.publication_year || new Date().getFullYear(),
        abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : '',
        doi,
        pmid,
        openalexId,
        source: 'openalex' as const,
        url: work.primary_location?.landing_page_url || work.doi || `https://openalex.org/${openalexId}`
      };
    });
    
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return [];
  }
}

// Helper to reconstruct abstract from OpenAlex inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex) return '';
  
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  
  words.sort((a, b) => a[1] - b[1]);
  return words.map(w => w[0]).join(' ');
}

// Helper to decode XML entities
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
}

// Deduplicate results by DOI or title
function deduplicateResults(results: StudyResult[]): StudyResult[] {
  const seen = new Map<string, StudyResult>();
  
  for (const result of results) {
    // Key by DOI if available, otherwise by normalized title
    const key = result.doi || result.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      // Merge data from both sources if duplicate
      const existing = seen.get(key)!;
      if (!existing.pmid && result.pmid) existing.pmid = result.pmid;
      if (!existing.openalexId && result.openalexId) existing.openalexId = result.openalexId;
      if (!existing.abstract && result.abstract) existing.abstract = result.abstract;
    }
  }
  
  return Array.from(seen.values());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SearchParams = await req.json();
    
    if (!params.query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Search params:', params);
    
    let results: StudyResult[] = [];
    
    // Search based on source preference
    if (params.source === 'pubmed' || params.source === 'both') {
      const pubmedResults = await searchPubMed(params);
      results = results.concat(pubmedResults);
    }
    
    if (params.source === 'openalex' || params.source === 'both') {
      const openalexResults = await searchOpenAlex(params);
      results = results.concat(openalexResults);
    }
    
    // Deduplicate if searching both sources
    if (params.source === 'both') {
      results = deduplicateResults(results);
    }
    
    console.log(`Returning ${results.length} total results`);
    
    return new Response(
      JSON.stringify({ 
        results,
        meta: {
          query: params.query,
          source: params.source,
          totalResults: results.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in search-scientific-studies:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
