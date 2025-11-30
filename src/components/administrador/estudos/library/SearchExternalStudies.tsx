import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Database, Loader2, ExternalLink, Plus, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface SearchExternalStudiesProps {
  onStudyImported?: () => void;
}

const SearchExternalStudies: React.FC<SearchExternalStudiesProps> = ({ onStudyImported }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'pubmed' | 'openalex' | 'both'>('both');
  const [maxResults, setMaxResults] = useState('20');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<StudyResult[]>([]);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: t('studies.search.error'),
        description: t('studies.search.queryRequired'),
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-scientific-studies', {
        body: {
          query: query.trim(),
          source,
          maxResults: parseInt(maxResults)
        }
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast({
          title: t('studies.search.noResults'),
          description: t('studies.search.tryDifferentQuery')
        });
      } else {
        toast({
          title: t('studies.search.success'),
          description: t('studies.search.foundResults', { count: data.results.length })
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

  const handleImport = async (study: StudyResult) => {
    setImportingIds(prev => new Set(prev).add(study.id));

    try {
      // Check if study already exists by DOI or PMID
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

      // Import the study
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

  const getSourceBadge = (studySource: string) => {
    if (studySource === 'pubmed') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">PubMed</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">OpenAlex</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          {t('studies.search.searchExternal')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('studies.search.title')}
          </DialogTitle>
          <DialogDescription>
            {t('studies.search.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <Button onClick={handleSearch} disabled={isSearching} className="w-full gap-2">
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

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('studies.search.resultsCount', { count: results.length })}
                </span>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {results.map((study) => (
                    <Card key={study.id} className="relative">
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
                          <div className="flex items-center gap-2">
                            {getSourceBadge(study.source)}
                            {importedIds.has(study.id) ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{study.journal}</span>
                          <span>•</span>
                          <span>{study.year}</span>
                          {study.doi && (
                            <>
                              <span>•</span>
                              <a
                                href={`https://doi.org/${study.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                DOI <ExternalLink className="h-3 w-3" />
                              </a>
                            </>
                          )}
                          {study.url && (
                            <a
                              href={study.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {t('studies.search.viewOriginal')} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {study.abstract && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {study.abstract}
                          </p>
                        )}
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
