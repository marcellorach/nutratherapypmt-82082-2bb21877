import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  BookOpen, 
  Calendar, 
  Users,
  ExternalLink,
  FileText,
  Filter,
  Database,
  FlaskConical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchExternalStudies from './SearchExternalStudies';

interface ScientificStudy {
  id: string;
  title: string;
  title_en: string | null;
  abstract: string | null;
  abstract_en: string | null;
  authors: string[] | null;
  journal: string | null;
  journal_en: string | null;
  year: number | null;
  doi: string | null;
  link: string | null;
  created_at: string | null;
  source_api: string | null;
  is_simulated: boolean | null;
  pmid: string | null;
  openalex_id: string | null;
}

const StudiesLibraryTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [studies, setStudies] = useState<ScientificStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [journalFilter, setJournalFilter] = useState<string>('all');

  const isEnglish = i18n.language === 'en';

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scientific_studies')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setStudies(data || []);
    } catch (error: any) {
      toast({
        title: t('studies.library.errorFetching', 'Error fetching studies'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique years and journals for filters
  const years = [...new Set(studies.map(s => s.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const journals = [...new Set(studies.map(s => s.journal).filter(Boolean))].sort();

  // Filter studies
  const filteredStudies = studies.filter(study => {
    const title = isEnglish ? (study.title_en || study.title) : study.title;
    const matchesSearch = !searchQuery || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.authors?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesYear = yearFilter === 'all' || study.year?.toString() === yearFilter;
    const matchesJournal = journalFilter === 'all' || study.journal === journalFilter;

    return matchesSearch && matchesYear && matchesJournal;
  });

  const getTitle = (study: ScientificStudy) => isEnglish ? (study.title_en || study.title) : study.title;
  const getAbstract = (study: ScientificStudy) => isEnglish ? (study.abstract_en || study.abstract) : study.abstract;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {t('studies.library.title', 'Studies Library')}
          </h2>
          <Badge variant="secondary">
            {studies.length} {t('studies.library.studies', 'studies')}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Database className="h-3 w-3" />
            {studies.filter(s => !s.is_simulated).length} {t('studies.library.real')}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
            <FlaskConical className="h-3 w-3" />
            {studies.filter(s => s.is_simulated).length} {t('studies.library.simulated')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <SearchExternalStudies onStudyImported={fetchStudies} />
          <Button variant="outline" size="sm" onClick={fetchStudies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('studies.library.searchPlaceholder', 'Search by title or author...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('studies.library.year', 'Year')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studies.library.allYears', 'All Years')}</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year?.toString() || ''}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={journalFilter} onValueChange={setJournalFilter}>
              <SelectTrigger className="w-[200px]">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('studies.library.journal', 'Journal')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studies.library.allJournals', 'All Journals')}</SelectItem>
                {journals.map(journal => (
                  <SelectItem key={journal} value={journal || ''}>
                    {journal && journal.length > 30 ? journal.substring(0, 30) + '...' : journal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {t('studies.library.showing', 'Showing')} {filteredStudies.length} {t('studies.library.of', 'of')} {studies.length} {t('studies.library.studies', 'studies')}
      </div>

      {/* Studies List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('studies.library.noStudies', 'No studies found')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStudies.map(study => (
            <Card key={study.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {getTitle(study)}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      {study.is_simulated ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {t('studies.library.simulatedBadge')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                          <Database className="h-3 w-3" />
                          {study.source_api === 'pubmed' ? 'PubMed' : study.source_api === 'openalex' ? 'OpenAlex' : t('studies.library.realBadge')}
                        </Badge>
                      )}
                      {study.authors && study.authors.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {study.authors.slice(0, 3).join(', ')}
                          {study.authors.length > 3 && ` +${study.authors.length - 3}`}
                        </span>
                      )}
                      {study.year && (
                        <Badge variant="outline" className="text-xs">
                          {study.year}
                        </Badge>
                      )}
                      {study.journal && (
                        <span className="text-xs italic truncate max-w-[200px]">
                          {study.journal}
                        </span>
                      )}
                    </div>

                    {getAbstract(study) && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {getAbstract(study)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
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
                    {study.link && (
                      <a
                        href={study.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudiesLibraryTab;
