import React, { useState } from 'react';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';
import { Search, Database, Loader2, ExternalLink, Plus, BookOpen, CheckCircle2, AlertCircle, Quote, Download, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdvancedSearchFilters, { AdvancedFilters } from './AdvancedSearchFilters';

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
  pdfUrl?: string;
}

interface SearchMeta {
  query: string;
  source: string;
  totalResults: number;
  totalAvailable: number;
  spellingSuggestion?: string;
}

interface SearchExternalStudiesProps {
  onStudyImported?: () => void;
}

const DEFAULT_FILTERS: AdvancedFilters = {
  dateFrom: '',
  dateTo: '',
  minCitations: 0,
  publicationType: [],
  species: [],
  openAccessOnly: false,
  mustInclude: [],
  mustExclude: [],
  sortBy: 'relevance'
};

const SearchExternalStudies: React.FC<SearchExternalStudiesProps> = ({ onStudyImported }) => {
  const { t } = useSafeTranslation();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'pubmed' | 'openalex' | 'both'>('both');
  const [maxResults, setMaxResults] = useState('20');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<StudyResult[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    
    if (!finalQuery.trim()) {
      toast({
        title: t('studies.search.error'),
        description: t('studies.search.queryRequired'),
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setMeta(null);

    try {
      const searchParams: any = {
        query: finalQuery.trim(),
        source,
        maxResults: parseInt(maxResults),
        sortBy: advancedFilters.sortBy
      };

      // Add advanced filters
      if (advancedFilters.dateFrom) {
        searchParams.dateFrom = advancedFilters.dateFrom;
      }
      if (advancedFilters.dateTo) {
        searchParams.dateTo = advancedFilters.dateTo;
      }
      if (advancedFilters.minCitations > 0) {
        searchParams.minCitations = advancedFilters.minCitations;
      }
      if (advancedFilters.publicationType.length > 0) {
        searchParams.publicationType = advancedFilters.publicationType;
      }
      if (advancedFilters.species.length > 0) {
        searchParams.species = advancedFilters.species;
      }
      if (advancedFilters.openAccessOnly) {
        searchParams.openAccessOnly = true;
      }
      if (advancedFilters.mustInclude.length > 0) {
        searchParams.mustInclude = advancedFilters.mustInclude;
      }
      if (advancedFilters.mustExclude.length > 0) {
        searchParams.mustExclude = advancedFilters.mustExclude;
      }

      const { data, error } = await supabase.functions.invoke('search-scientific-studies', {
        body: searchParams
      });

      if (error) throw error;

      setResults(data.results || []);
      setMeta(data.meta);
      
      if (data.results?.length === 0) {
        toast({
          title: t('studies.search.noResults'),
          description: t('studies.search.tryDifferentQuery')
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: t('studies.search.error'),
        description: error instanceof Error ? error.message : t('studies.search.unknownError'),
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSpellingSuggestion = () => {
    if (meta?.spellingSuggestion) {
      setQuery(meta.spellingSuggestion);
      handleSearch(meta.spellingSuggestion);
    }
  };

  const handleImport = async (study: StudyResult) => {
    setImportingIds(prev => new Set(prev).add(study.id));

    try {
      let existingQuery = supabase.from('scientific_studies').select('id');
      
      if (study.doi) {
        existingQuery = existingQuery.eq('doi', study.doi);
      } else if (study.pmid) {
        existingQuery = existingQuery.eq('pmid', study.pmid);
      } else {
        existingQuery = existingQuery.eq('title', study.title);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        toast({
          title: t('studies.search.alreadyExists'),
          description: t('studies.search.studyAlreadyInLibrary'),
          variant: 'destructive'
        });
        setImportingIds(prev => {
          const next = new Set(prev);
          next.delete(study.id);
          return next;
        });
        return;
      }

      const { error } = await supabase.from('scientific_studies').insert({
        title: study.title,
        title_en: study.title,
        authors: study.authors,
        journal: study.journal,
        journal_en: study.journal,
        year: study.year,
        abstract: study.abstract,
        abstract_en: study.abstract,
        doi: study.doi,
        pmid: study.pmid,
        openalex_id: study.openalexId,
        source_api: study.source,
        is_simulated: false,
        link: study.url
      });

      if (error) throw error;

      setImportedIds(prev => new Set(prev).add(study.id));
      
      toast({
        title: t('studies.search.imported'),
        description: t('studies.search.studyImportedSuccess')
      });

      onStudyImported?.();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: t('studies.search.importError'),
        description: error instanceof Error ? error.message : t('studies.search.unknownError'),
        variant: 'destructive'
      });
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev);
        next.delete(study.id);
        return next;
      });
    }
  };

  const handleDownloadPdf = async (study: StudyResult) => {
    if (!study.pdfUrl) return;
    
    setDownloadingIds(prev => new Set(prev).add(study.id));

    try {
      const { data, error } = await supabase.functions.invoke('download-study-pdf', {
        body: {
          pdfUrl: study.pdfUrl,
          studyData: {
            title: study.title,
            authors: study.authors,
            journal: study.journal,
            year: study.year,
            doi: study.doi,
            pmid: study.pmid,
            openalexId: study.openalexId,
            source: study.source,
            abstract: study.abstract
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setDownloadedIds(prev => new Set(prev).add(study.id));
        toast({
          title: t('studies.search.pdfDownloaded'),
          description: t('studies.search.pdfSavedToImports')
        });
      } else {
        throw new Error(data.error || 'Failed to download PDF');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: t('studies.search.pdfDownloadError'),
        description: error instanceof Error ? error.message : t('studies.search.unknownError'),
        variant: 'destructive'
      });
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(study.id);
        return next;
      });
    }
  };

  const getSourceBadge = (studySource: string) => {
    if (studySource === 'pubmed') {
      return (
        <Badge 
          variant="outline" 
          className="border font-medium bg-transparent"
          style={{ 
            color: 'hsl(217, 91%, 40%)', 
            borderColor: 'hsl(217, 91%, 60%)' 
          }}
        >
          <Database className="h-3 w-3 mr-1" />
          PubMed
        </Badge>
      );
    }
    return (
      <Badge 
        variant="outline" 
        className="border font-medium bg-transparent"
        style={{ 
          color: 'hsl(25, 95%, 40%)', 
          borderColor: 'hsl(25, 95%, 55%)' 
        }}
      >
        <BookOpen className="h-3 w-3 mr-1" />
        OpenAlex
      </Badge>
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          {t('studies.search.searchExternal')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('studies.search.title')}
          </DialogTitle>
          <DialogDescription>
            {t('studies.search.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Form */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label htmlFor="query">{t('studies.search.queryLabel')}</Label>
              <Input
                id="query"
                placeholder={t('studies.search.queryPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label>{t('studies.search.sourceLabel')}</Label>
              <Select value={source} onValueChange={(v: any) => setSource(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{t('studies.search.sourceBoth')}</SelectItem>
                  <SelectItem value="pubmed">PubMed</SelectItem>
                  <SelectItem value="openalex">OpenAlex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('studies.search.maxResultsLabel')}</Label>
              <Select value={maxResults} onValueChange={setMaxResults}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          <AdvancedSearchFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            isOpen={showAdvanced}
            onOpenChange={setShowAdvanced}
          />

          <Button onClick={() => handleSearch()} disabled={isSearching} className="w-full gap-2">
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('studies.search.searching')}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {t('studies.search.searchButton')}
              </>
            )}
          </Button>

          {/* Spelling Suggestion */}
          {meta?.spellingSuggestion && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                {t('studies.search.didYouMean')}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={handleSpellingSuggestion}
                >
                  {meta.spellingSuggestion}
                </Button>
                ?
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              {/* Result Counter */}
              <div className="flex items-center justify-between mb-3 p-2 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">
                  {t('studies.search.showingResults', { 
                    count: results.length, 
                    total: formatNumber(meta?.totalAvailable || results.length) 
                  })}
                </span>
                {meta?.totalAvailable && meta.totalAvailable > results.length && (
                  <span className="text-xs text-muted-foreground">
                    {t('studies.search.increaseMaxResults')}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 min-h-0 max-h-[350px] pr-4">
                <div className="space-y-3">
                  {results.map((study) => (
                    <Card key={study.id} className="relative bg-card border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium leading-tight">
                              {study.title}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {study.authors.slice(0, 3).join(', ')}
                              {study.authors.length > 3 && ` +${study.authors.length - 3}`}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getSourceBadge(study.source)}
                            {study.isOpenAccess && (
                              <Badge variant="outline" className="bg-transparent text-amber-600 border-amber-400 dark:text-amber-400 text-xs">
                                OA
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                          <span>{study.journal}</span>
                          <span>•</span>
                          <span>{study.year}</span>
                          {study.citationCount !== undefined && study.citationCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Quote className="h-3 w-3" />
                                {study.citationCount}
                              </span>
                            </>
                          )}
                          {study.publicationType && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {study.publicationType}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {study.abstract && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {study.abstract}
                          </p>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* PDF Download Button */}
                          {study.pdfUrl ? (
                            downloadedIds.has(study.id) ? (
                              <Badge variant="outline" className="bg-transparent text-green-600 border-green-400 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t('studies.search.pdfSaved')}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPdf(study)}
                                disabled={downloadingIds.has(study.id)}
                                className="gap-1 text-green-600 border-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                              >
                                {downloadingIds.has(study.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                                PDF
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="gap-1 text-muted-foreground"
                            >
                              <Lock className="h-3 w-3" />
                              PDF
                            </Button>
                          )}
                          
                          {/* Import to Library Button */}
                          {importedIds.has(study.id) ? (
                            <Badge variant="outline" className="bg-transparent text-green-600 border-green-400 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('studies.search.imported')}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImport(study)}
                              disabled={importingIds.has(study.id)}
                              className="gap-1"
                            >
                              {importingIds.has(study.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              {t('studies.search.import')}
                            </Button>
                          )}
                          
                          {/* DOI Link */}
                          {study.doi && (
                            <a
                              href={`https://doi.org/${study.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              DOI <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          
                          {/* Original URL */}
                          {study.url && (
                            <a
                              href={study.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {t('studies.search.viewOriginal')} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchExternalStudies;
