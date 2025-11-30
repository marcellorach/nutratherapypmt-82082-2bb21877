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
  // Advanced filters
  minCitations?: number;
  publicationType?: string[];
  openAccessOnly?: boolean;
  mustInclude?: string[];
  mustExclude?: string[];
  language?: string;
  sortBy?: 'relevance' | 'date' | 'citations';
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
  citationCount?: number;
  isOpenAccess?: boolean;
  publicationType?: string;
  pdfUrl?: string; // NEW: Direct PDF URL for Open Access articles
}

interface SearchResponse {
  results: StudyResult[];
  meta: {
    query: string;
    source: string;
    totalResults: number;
    totalAvailable: number;
    spellingSuggestion?: string;
  };
}

// PubMed spell check
async function getSpellingSuggestion(query: string): Promise<string | null> {
  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/espell.fcgi?db=pubmed&term=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const text = await response.text();
    const correctedMatch = text.match(/<CorrectedQuery>([^<]+)<\/CorrectedQuery>/);
    
    if (correctedMatch && correctedMatch[1] !== query) {
      return correctedMatch[1];
    }
    return null;
  } catch (error) {
    console.error('Spell check error:', error);
    return null;
  }
}

// Build advanced PubMed query
function buildPubMedQuery(params: SearchParams): string {
  let query = params.query;
  
  // Add must include terms
  if (params.mustInclude?.length) {
    const includeTerms = params.mustInclude.map(t => `"${t}"[All Fields]`).join(' AND ');
    query = `(${query}) AND (${includeTerms})`;
  }
  
  // Add must exclude terms
  if (params.mustExclude?.length) {
    const excludeTerms = params.mustExclude.map(t => `NOT "${t}"[All Fields]`).join(' ');
    query = `(${query}) ${excludeTerms}`;
  }
  
  // Add species filter (MeSH terms)
  if (params.species?.length) {
    const speciesTerms = params.species.map(s => `"${s}"[MeSH]`).join(' OR ');
    query = `(${query}) AND (${speciesTerms})`;
  }
  
  // Add publication type filter
  if (params.publicationType?.length) {
    const typeMap: Record<string, string> = {
      'review': 'Review[pt]',
      'clinical-trial': 'Clinical Trial[pt]',
      'meta-analysis': 'Meta-Analysis[pt]',
      'randomized-controlled-trial': 'Randomized Controlled Trial[pt]',
      'systematic-review': 'Systematic Review[pt]',
      'case-report': 'Case Reports[pt]'
    };
    const typeTerms = params.publicationType
      .filter(t => typeMap[t])
      .map(t => typeMap[t])
      .join(' OR ');
    if (typeTerms) {
      query = `(${query}) AND (${typeTerms})`;
    }
  }
  
  // Add date filter
  if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom || '1900/01/01';
    const to = params.dateTo || '3000/12/31';
    query = `${query} AND ${from}:${to}[dp]`;
  }
  
  // Add language filter
  if (params.language) {
    query = `${query} AND ${params.language}[la]`;
  }
  
  return query;
}

// Check PMC for PDF availability
async function checkPmcPdfAvailability(pmid: string): Promise<string | null> {
  try {
    // Query PMC OA service to check if PDF is available
    const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=pmid:${pmid}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const text = await response.text();
    
    // Check if there's a PDF link in the response
    const pdfMatch = text.match(/<link format="pdf" href="([^"]+)"/);
    if (pdfMatch && pdfMatch[1]) {
      // Convert ftp:// to https:// if needed
      let pdfUrl = pdfMatch[1];
      if (pdfUrl.startsWith('ftp://')) {
        pdfUrl = pdfUrl.replace('ftp://', 'https://');
      }
      return pdfUrl;
    }
    
    return null;
  } catch (error) {
    console.error('PMC PDF check error for PMID', pmid, ':', error);
    return null;
  }
}

// PubMed E-utilities API
async function searchPubMed(params: SearchParams): Promise<{ results: StudyResult[], totalAvailable: number }> {
  console.log('Searching PubMed with query:', params.query);
  
  const maxResults = params.maxResults || 20;
  const searchQuery = buildPubMedQuery(params);
  
  console.log('Built PubMed query:', searchQuery);
  
  try {
    // Step 1: Search for IDs and get count
    const sortParam = params.sortBy === 'date' ? '&sort=pub_date' : '';
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${maxResults}&retmode=json${sortParam}`;
    console.log('PubMed search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('PubMed search failed:', searchResponse.status);
      return { results: [], totalAvailable: 0 };
    }
    
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    const totalAvailable = parseInt(searchData.esearchresult?.count || '0', 10);
    
    console.log(`Found ${ids.length} PubMed IDs (total available: ${totalAvailable})`);
    
    if (ids.length === 0) {
      return { results: [], totalAvailable: 0 };
    }
    
    // Step 2: Fetch details for each ID
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    
    if (!fetchResponse.ok) {
      console.error('PubMed fetch failed:', fetchResponse.status);
      return { results: [], totalAvailable };
    }
    
    const xmlText = await fetchResponse.text();
    
    // Parse XML response
    const articles: StudyResult[] = [];
    const articleMatches = xmlText.split('<PubmedArticle>').slice(1);
    
    // Collect PMIDs to check for PDF availability (batch check)
    const pmidsToCheck: string[] = [];
    
    for (const articleXml of articleMatches) {
      try {
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const pmid = pmidMatch?.[1] || '';
        
        const titleMatch = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
        const title = titleMatch?.[1] || 'Untitled';
        
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
        const abstract = abstractMatch?.[1] || '';
        
        const journalMatch = articleXml.match(/<Title>([^<]+)<\/Title>/);
        const journal = journalMatch?.[1] || '';
        
        const yearMatch = articleXml.match(/<PubDate>.*?<Year>(\d{4})<\/Year>.*?<\/PubDate>/s);
        const year = yearMatch?.[1] ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        const authors: string[] = [];
        const authorMatches = articleXml.matchAll(/<Author[^>]*>.*?<LastName>([^<]+)<\/LastName>.*?<ForeName>([^<]*)<\/ForeName>.*?<\/Author>/gs);
        for (const match of authorMatches) {
          authors.push(`${match[2]} ${match[1]}`.trim());
        }
        
        const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
        const doi = doiMatch?.[1];
        
        // Check if it's in PMC (open access indicator)
        const pmcMatch = articleXml.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/);
        const pmcId = pmcMatch?.[1];
        const isOpenAccess = !!pmcId;
        
        // Extract publication type
        const pubTypeMatch = articleXml.match(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/);
        const publicationType = pubTypeMatch?.[1] || undefined;
        
        if (pmid && isOpenAccess) {
          pmidsToCheck.push(pmid);
        }
        
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
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          publicationType,
          isOpenAccess,
          pdfUrl: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/pdf/` : undefined
        });
      } catch (e) {
        console.error('Error parsing PubMed article:', e);
      }
    }
    
    console.log(`Parsed ${articles.length} PubMed articles`);
    return { results: articles, totalAvailable };
    
  } catch (error) {
    console.error('PubMed search error:', error);
    return { results: [], totalAvailable: 0 };
  }
}

// Build OpenAlex filter string
function buildOpenAlexFilter(params: SearchParams): string {
  const filters: string[] = [];
  
  if (params.dateFrom) {
    filters.push(`from_publication_date:${params.dateFrom}`);
  }
  if (params.dateTo) {
    filters.push(`to_publication_date:${params.dateTo}`);
  }
  if (params.minCitations && params.minCitations > 0) {
    filters.push(`cited_by_count:>${params.minCitations - 1}`);
  }
  if (params.openAccessOnly) {
    filters.push('is_oa:true');
  }
  if (params.publicationType?.length) {
    const typeMap: Record<string, string> = {
      'review': 'review',
      'article': 'article',
      'book-chapter': 'book-chapter',
      'dataset': 'dataset',
      'preprint': 'preprint'
    };
    const types = params.publicationType
      .filter(t => typeMap[t])
      .map(t => typeMap[t]);
    if (types.length) {
      filters.push(`type:${types.join('|')}`);
    }
  }
  if (params.language) {
    filters.push(`language:${params.language}`);
  }
  
  return filters.join(',');
}

// OpenAlex API
async function searchOpenAlex(params: SearchParams): Promise<{ results: StudyResult[], totalAvailable: number }> {
  console.log('Searching OpenAlex with query:', params.query);
  
  const maxResults = params.maxResults || 20;
  
  try {
    // Build search query with must include/exclude
    let searchQuery = params.query;
    if (params.mustInclude?.length) {
      searchQuery = `${searchQuery} ${params.mustInclude.join(' ')}`;
    }
    if (params.mustExclude?.length) {
      // OpenAlex doesn't support NOT, so we'll filter in post-processing
    }
    
    const url = new URL('https://api.openalex.org/works');
    url.searchParams.set('search', searchQuery);
    url.searchParams.set('per_page', maxResults.toString());
    url.searchParams.set('mailto', 'api@vetgraph.ai');
    
    const filter = buildOpenAlexFilter(params);
    if (filter) {
      url.searchParams.set('filter', filter);
    }
    
    // Sort options
    if (params.sortBy === 'date') {
      url.searchParams.set('sort', 'publication_date:desc');
    } else if (params.sortBy === 'citations') {
      url.searchParams.set('sort', 'cited_by_count:desc');
    }
    
    console.log('OpenAlex URL:', url.toString());
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('OpenAlex search failed:', response.status);
      return { results: [], totalAvailable: 0 };
    }
    
    const data = await response.json();
    const results = data.results || [];
    const totalAvailable = data.meta?.count || 0;
    
    console.log(`Found ${results.length} OpenAlex results (total available: ${totalAvailable})`);
    
    let processedResults: StudyResult[] = results.map((work: any) => {
      const openalexId = work.id?.replace('https://openalex.org/', '') || '';
      const authors = work.authorships?.map((a: any) => a.author?.display_name || 'Unknown').filter(Boolean) || ['Unknown Author'];
      const doi = work.doi?.replace('https://doi.org/', '');
      const pmidObj = work.ids?.pmid;
      const pmid = pmidObj?.replace('https://pubmed.ncbi.nlm.nih.gov/', '');
      
      // Extract PDF URL from open_access object
      const isOpenAccess = work.open_access?.is_oa || false;
      const pdfUrl = work.open_access?.oa_url || work.best_oa_location?.pdf_url || null;
      
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
        url: work.primary_location?.landing_page_url || work.doi || `https://openalex.org/${openalexId}`,
        citationCount: work.cited_by_count || 0,
        isOpenAccess,
        publicationType: work.type || undefined,
        pdfUrl: pdfUrl || undefined
      };
    });
    
    // Post-filter for must exclude terms (OpenAlex doesn't support NOT in search)
    if (params.mustExclude?.length) {
      processedResults = processedResults.filter(study => {
        const text = `${study.title} ${study.abstract}`.toLowerCase();
        return !params.mustExclude!.some(term => text.includes(term.toLowerCase()));
      });
    }
    
    return { results: processedResults, totalAvailable };
    
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return { results: [], totalAvailable: 0 };
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
    const key = result.doi || result.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      const existing = seen.get(key)!;
      if (!existing.pmid && result.pmid) existing.pmid = result.pmid;
      if (!existing.openalexId && result.openalexId) existing.openalexId = result.openalexId;
      if (!existing.abstract && result.abstract) existing.abstract = result.abstract;
      if (!existing.citationCount && result.citationCount) existing.citationCount = result.citationCount;
      if (existing.isOpenAccess === undefined && result.isOpenAccess !== undefined) {
        existing.isOpenAccess = result.isOpenAccess;
      }
      // Prefer pdfUrl from OpenAlex (more reliable)
      if (!existing.pdfUrl && result.pdfUrl) {
        existing.pdfUrl = result.pdfUrl;
      }
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
    
    console.log('Search params:', JSON.stringify(params, null, 2));
    
    let results: StudyResult[] = [];
    let totalAvailable = 0;
    
    // Get spelling suggestion from PubMed (only if searching PubMed or both)
    let spellingSuggestion: string | null = null;
    if (params.source === 'pubmed' || params.source === 'both') {
      spellingSuggestion = await getSpellingSuggestion(params.query);
    }
    
    // Search based on source preference
    if (params.source === 'pubmed' || params.source === 'both') {
      const pubmedData = await searchPubMed(params);
      results = results.concat(pubmedData.results);
      totalAvailable += pubmedData.totalAvailable;
    }
    
    if (params.source === 'openalex' || params.source === 'both') {
      const openalexData = await searchOpenAlex(params);
      results = results.concat(openalexData.results);
      totalAvailable += openalexData.totalAvailable;
    }
    
    // Deduplicate if searching both sources
    if (params.source === 'both') {
      results = deduplicateResults(results);
    }
    
    // Sort results if needed
    if (params.sortBy === 'citations') {
      results.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    } else if (params.sortBy === 'date') {
      results.sort((a, b) => b.year - a.year);
    }
    
    console.log(`Returning ${results.length} results (total available: ~${totalAvailable})`);
    
    const response: SearchResponse = {
      results,
      meta: {
        query: params.query,
        source: params.source,
        totalResults: results.length,
        totalAvailable,
        ...(spellingSuggestion && { spellingSuggestion })
      }
    };
    
    return new Response(
      JSON.stringify(response),
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
