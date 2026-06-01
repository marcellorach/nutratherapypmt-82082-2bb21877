import React, { useState, useEffect, useMemo } from 'react';
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
  FlaskConical,
  Check,
  Sparkles,
  Award,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchExternalStudies from './SearchExternalStudies';
import StudyPdfUpload from './StudyPdfUpload';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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
  pdf_storage_path: string | null;
  pdf_filename: string | null;
  tags?: any;
  prestige_tier?: number | null;
  tags_source?: string | null;
}

interface StudiesLibraryTabProps {
  onNavigateToUpload?: () => void;
}

const StudiesLibraryTab: React.FC<StudiesLibraryTabProps> = ({ onNavigateToUpload }) => {
  const { t, i18n } = useSafeTranslation();
  const { toast } = useToast();
  const [studies, setStudies] = useState<ScientificStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [journalFilter, setJournalFilter] = useState<string>('all');
  const [designFilter, setDesignFilter] = useState<string>('all');
  const [populationFilter, setPopulationFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [autoTagging, setAutoTagging] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);

  const isEnglish = i18n.language === 'en';

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      // 1. Curated/processed studies (real source of truth for the library)
      const { data: processed, error: pErr } = await supabase
        .from('processed_studies')
        .select('id, title, description, journal, year, authors, original_filename, storage_path, kanban_status, created_at, analysis_data, tags, prestige_tier, tags_source')
        .is('deleted_at', null)
        .in('kanban_status', ['approved', 'processed', 'new'])
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // 2. External / imported studies that have NOT been processed yet
      const { data: external, error: eErr } = await supabase
        .from('scientific_studies')
        .select('*')
        .order('year', { ascending: false });
      if (eErr) throw eErr;

      const fromProcessed: ScientificStudy[] = (processed || []).map((p: any) => ({
        id: p.id,
        title: p.title || p.original_filename || 'Untitled study',
        title_en: null,
        abstract: p.description || null,
        abstract_en: null,
        authors: p.authors || null,
        journal: p.journal || null,
        journal_en: null,
        year: p.year ?? null,
        doi: p.analysis_data?.doi || null,
        link: p.analysis_data?.link || null,
        created_at: p.created_at,
        source_api: p.analysis_data?.source_api || 'upload',
        is_simulated: false,
        pmid: p.analysis_data?.pmid || null,
        openalex_id: p.analysis_data?.openalex_id || null,
        pdf_storage_path: p.storage_path || null,
        pdf_filename: p.original_filename || null,
        kanban_status: p.kanban_status,
        tags: p.tags || {},
        prestige_tier: p.prestige_tier ?? null,
        tags_source: p.tags_source ?? 'pending',
      } as any));

      // De-duplicate: prefer processed_studies entries
      const seen = new Set(fromProcessed.map(s => s.id));
      const fromExternal = (external || []).filter((s: any) => !seen.has(s.id));

      setStudies([...fromProcessed, ...fromExternal] as ScientificStudy[]);
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

  const handleAutoTag = async () => {
    setAutoTagging(true);
    let totalOk = 0;
    let totalFail = 0;
    let totalProcessed = 0;
    try {
      // Process in small batches to stay well under the 150s edge function idle timeout.
      // Each batch handles ~15 studies (~45-60s with Gemini calls + throttle).
      for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase.functions.invoke('auto-tag-studies', {
          body: { all: false, limit: 15 },
        });
        if (error) throw error;
        const processed = data?.processed ?? 0;
        totalProcessed += processed;
        totalOk += data?.ok_count ?? 0;
        totalFail += data?.fail_count ?? 0;
        if (processed === 0) break; // no more pending
      }
      toast({
        title: t('studies.library.autoTagDone', 'Auto-tagging complete'),
        description: `${totalOk} ok / ${totalFail} fail (${totalProcessed} total)`,
      });
      await fetchStudies();
    } catch (err: any) {
      toast({
        title: 'Auto-tag error',
        description: `${err.message} (processed ${totalProcessed} before failure)`,
        variant: 'destructive',
      });
      await fetchStudies();
    } finally {
      setAutoTagging(false);
    }
  };

  // Get unique years and journals for filters
  const years = [...new Set(studies.map(s => s.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const journals = [...new Set(studies.map(s => s.journal).filter(Boolean))].sort();

  // Filter studies — theme-based search across title, abstract, authors, journal and all tag buckets
  const filteredStudies = useMemo(() => {
    const tokens = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    return studies.filter(study => {
      const title = isEnglish ? (study.title_en || study.title) : study.title;
      const abstract = isEnglish ? (study.abstract_en || study.abstract) : study.abstract;
      const tags = study.tags || {};
      const tagBuckets = [
        tags.study_design,
        tags.population,
        tags.methodology,
        tags.topics,
        tags.themes,
        tags.conditions,
        tags.compounds,
        tags.keywords,
      ];
      const tagsFlat = tagBuckets
        .flatMap((b: any) => (Array.isArray(b) ? b : []))
        .map((s: string) => String(s).toLowerCase().replace(/_/g, ' '));

      const haystack = [
        title,
        abstract,
        study.journal,
        (study.authors || []).join(' '),
        tagsFlat.join(' '),
      ]
        .filter(Boolean)
        .join(' \n ')
        .toLowerCase();

      const matchesSearch = tokens.length === 0 || tokens.every(tok => haystack.includes(tok));

      const matchesYear = yearFilter === 'all' || study.year?.toString() === yearFilter;
      const matchesJournal = journalFilter === 'all' || study.journal === journalFilter;
      const matchesDesign = designFilter === 'all' || (study.tags?.study_design || []).includes(designFilter);
      const matchesPop = populationFilter === 'all' || (study.tags?.population || []).includes(populationFilter);
      const matchesTier = tierFilter === 'all' || study.prestige_tier?.toString() === tierFilter;

      return matchesSearch && matchesYear && matchesJournal && matchesDesign && matchesPop && matchesTier;
    });
  }, [studies, searchQuery, isEnglish, yearFilter, journalFilter, designFilter, populationFilter, tierFilter]);

  // Reset to first page whenever filters or page size change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, yearFilter, journalFilter, designFilter, populationFilter, tierFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStudies.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedStudies = filteredStudies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          <Badge variant="outline" className="text-xs gap-1 text-emerald-700 border-emerald-300">
            <Database className="h-3 w-3" />
            {studies.filter((s: any) => s.kanban_status === 'approved').length} {t('studies.library.curated', 'curated')}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {studies.filter((s: any) => s.kanban_status === 'processed' || s.kanban_status === 'new').length} {t('studies.library.processing', 'in queue')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <SearchExternalStudies onStudyImported={fetchStudies} />
          <Button variant="outline" size="sm" onClick={handleAutoTag} disabled={autoTagging}>
            <Sparkles className={`h-4 w-4 mr-2 ${autoTagging ? 'animate-pulse' : ''}`} />
            {autoTagging
              ? t('studies.library.autoTagging', 'Tagging...')
              : t('studies.library.autoTag', 'Auto-tag pending')}
          </Button>
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
                  placeholder={t('studies.library.searchPlaceholder', 'Search by theme, condition, compound, author...')}
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

            <Select value={designFilter} onValueChange={setDesignFilter}>
              <SelectTrigger className="w-[170px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('studies.library.design', 'Design')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studies.library.allDesigns', 'All designs')}</SelectItem>
                <SelectItem value="rct">RCT</SelectItem>
                <SelectItem value="meta_analysis">Meta-analysis</SelectItem>
                <SelectItem value="systematic_review">Systematic review</SelectItem>
                <SelectItem value="cohort">Cohort</SelectItem>
                <SelectItem value="case_control">Case-control</SelectItem>
                <SelectItem value="cross_sectional">Cross-sectional</SelectItem>
                <SelectItem value="case_report">Case report</SelectItem>
                <SelectItem value="in_vitro">In vitro</SelectItem>
                <SelectItem value="in_vivo">In vivo</SelectItem>
                <SelectItem value="narrative_review">Narrative review</SelectItem>
                <SelectItem value="observational">Observational</SelectItem>
              </SelectContent>
            </Select>

            <Select value={populationFilter} onValueChange={setPopulationFilter}>
              <SelectTrigger className="w-[150px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('studies.library.population', 'Population')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studies.library.allPopulations', 'All populations')}</SelectItem>
                <SelectItem value="canine">{t('studies.library.popCanine', 'Dogs')}</SelectItem>
                <SelectItem value="feline">{t('studies.library.popFeline', 'Cats')}</SelectItem>
                <SelectItem value="human">{t('studies.library.popHuman', 'Humans')}</SelectItem>
                <SelectItem value="rodent">{t('studies.library.popRodent', 'Rodents')}</SelectItem>
                <SelectItem value="equine">{t('studies.library.popEquine', 'Horses')}</SelectItem>
                <SelectItem value="in_vitro_cells">{t('studies.library.popInVitro', 'In vitro')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[140px]">
                <Award className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('studies.library.tier', 'Tier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studies.library.allTiers', 'All tiers')}</SelectItem>
                <SelectItem value="5">Tier 5 — Top</SelectItem>
                <SelectItem value="4">Tier 4 — Q1</SelectItem>
                <SelectItem value="3">Tier 3 — Q2</SelectItem>
                <SelectItem value="2">Tier 2 — PubMed</SelectItem>
                <SelectItem value="1">Tier 1 — Preprint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count + page size */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
        <div>
          {t('studies.library.showing', 'Showing')}{' '}
          {filteredStudies.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {'–'}
          {Math.min(currentPage * pageSize, filteredStudies.length)}{' '}
          {t('studies.library.of', 'of')} {filteredStudies.length}{' '}
          {t('studies.library.studies', 'studies')}
          {filteredStudies.length !== studies.length && (
            <span className="ml-1 opacity-70">({studies.length} {t('studies.library.total', 'total')})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{t('studies.library.perPage', 'Per page')}:</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="80">80</SelectItem>
              <SelectItem value="160">160</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          {pagedStudies.map(study => (
            <Card key={study.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {getTitle(study)}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      {(study as any).kanban_status === 'approved' ? (
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 gap-1">
                          <Check className="h-3 w-3" />
                          {t('studies.library.curatedBadge', 'Curated')}
                        </Badge>
                      ) : (study as any).kanban_status === 'processed' || (study as any).kanban_status === 'new' ? (
                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {t('studies.library.inQueueBadge', 'In curation')}
                        </Badge>
                      ) : study.is_simulated ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {t('studies.library.simulatedBadge')}
                        </Badge>
                      ) : study.source_api === 'pubmed' ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs gap-1 font-medium bg-transparent"
                          style={{ 
                            color: 'hsl(217, 91%, 40%)', 
                            borderColor: 'hsl(217, 91%, 60%)' 
                          }}
                        >
                          <Database className="h-3 w-3" />
                          PubMed
                        </Badge>
                      ) : study.source_api === 'openalex' ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs gap-1 font-medium bg-transparent"
                          style={{ 
                            color: 'hsl(25, 95%, 40%)', 
                            borderColor: 'hsl(25, 95%, 55%)' 
                          }}
                        >
                          <Database className="h-3 w-3" />
                          OpenAlex
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                          <Database className="h-3 w-3" />
                          {t('studies.library.realBadge')}
                        </Badge>
                      )}
                      {study.prestige_tier && (
                        <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-700">
                          <Award className="h-3 w-3" />
                          T{study.prestige_tier}
                        </Badge>
                      )}
                      {(study.tags?.study_design || []).slice(0, 3).map((d: string) => (
                        <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {d.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(study.tags?.population || []).slice(0, 2).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700">
                          {p.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {(study.tags?.methodology || []).slice(0, 2).map((m: string) => (
                        <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700">
                          {m.replace(/_/g, ' ')}
                        </Badge>
                      ))}
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

                  <div className="flex flex-col gap-2 items-end">
                    <StudyPdfUpload
                      studyId={study.id}
                      studyTitle={getTitle(study)}
                      pdfStoragePath={study.pdf_storage_path}
                      pdfFilename={study.pdf_filename}
                      onUploadComplete={fetchStudies}
                      onNavigateToUpload={onNavigateToUpload}
                    />
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
