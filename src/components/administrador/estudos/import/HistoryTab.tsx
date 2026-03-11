
import React, { useState, useEffect } from "react";
import { RefreshCw, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, Search, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

interface StudyRecord {
  id: string;
  title: string | null;
  original_filename: string;
  kanban_status: string | null;
  duplicate_check_log: any;
}

interface ImportGroup {
  id: string;
  imported_at: string | null;
  import_type: string;
  scispace_status: string | null;
  studies: StudyRecord[];
}

const HistoryTab: React.FC = () => {
  const [importGroups, setImportGroups] = useState<ImportGroup[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === 'pt' ? pt : enUS;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const { data: imports, error: importsError } = await supabase
        .from("scispace_imports")
        .select("id, imported_at, import_type, scispace_status")
        .order("imported_at", { ascending: false });

      if (importsError) throw importsError;

      if (!imports || imports.length === 0) {
        setImportGroups([]);
        setHistoryLoading(false);
        return;
      }

      const importIds = imports.map(i => i.id);
      const { data: studies, error: studiesError } = await supabase
        .from("processed_studies")
        .select("id, title, original_filename, kanban_status, source_import_id, duplicate_check_log")
        .in("source_import_id", importIds)
        .is("deleted_at", null);

      if (studiesError) throw studiesError;

      const groups: ImportGroup[] = imports.map(imp => ({
        ...imp,
        studies: (studies || [])
          .filter(s => (s as any).source_import_id === imp.id)
          .map(s => ({
            id: s.id,
            title: s.title,
            original_filename: s.original_filename,
            kanban_status: s.kanban_status,
            duplicate_check_log: (s as any).duplicate_check_log,
          })),
      }));

      setImportGroups(groups);
    } catch (error: any) {
      toast({
        title: t('studies.history.errorFetching'),
        description: error.message,
        variant: "destructive"
      });
      setImportGroups([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
      }
      return format(date, 'dd/MM/yyyy HH:mm', { locale: dateLocale });
    } catch {
      return "--";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getDuplicateIcon = (log: any) => {
    if (!log || !Array.isArray(log) || log.length === 0) {
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    }
    const entry = log[0];
    if (entry.check_type === 'exact') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    if (entry.check_type === 'similar') return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  };

  const getDuplicateLabel = (log: any) => {
    if (!log || !Array.isArray(log) || log.length === 0) return null;
    const entry = log[0];
    if (entry.check_type === 'exact') {
      return (
        <span className="text-[10px] text-destructive">
          {t('studies.history.duplicateExact', { name: entry.similar_to })}
        </span>
      );
    }
    if (entry.check_type === 'similar') {
      return (
        <span className="text-[10px] text-yellow-600">
          {t('studies.history.duplicateSimilar', { name: entry.similar_to, similarity: Math.round((entry.similarity || 0) * 100) })}
        </span>
      );
    }
    return null;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const colorMap: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'processing': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      'error': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      'parsed': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'approved': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      'review': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colorMap[status] || 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  // Truncate study name for display
  const truncateName = (name: string, maxLen = 45) => {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '…';
  };

  // Filter groups by search term
  const filteredGroups = importGroups?.filter(group => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    // Match on study names or filenames
    return group.studies.some(s =>
      (s.title && s.title.toLowerCase().includes(term)) ||
      s.original_filename.toLowerCase().includes(term)
    ) || (group.import_type && group.import_type.toLowerCase().includes(term));
  }) || [];

  const totalStudies = importGroups?.reduce((sum, g) => sum + g.studies.length, 0) || 0;

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t('studies.history.auditLogTitle')}</h3>
          {importGroups && (
            <span className="text-xs text-muted-foreground">
              ({t('studies.history.totalImports', { imports: importGroups.length, studies: totalStudies })})
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={historyLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={t('studies.history.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {historyLoading ? (
        <div className="text-center p-6 text-muted-foreground">{t('studies.history.loading')}</div>
      ) : filteredGroups.length > 0 ? (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-2 w-6"></th>
                <th className="px-2 py-2 text-left">{t('studies.history.importDate')}</th>
                <th className="px-2 py-2 text-left">{t('studies.history.importType')}</th>
                <th className="px-2 py-2 text-left">{t('studies.history.studies')}</th>
                <th className="px-2 py-2 text-left">{t('studies.history.duplicateCheck')}</th>
                <th className="px-2 py-2 text-left">{t('studies.history.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => {
                const isExpanded = expandedItems.has(group.id);
                const hasExact = group.studies.some(s => {
                  const log = s.duplicate_check_log;
                  return Array.isArray(log) && log.length > 0 && log[0].check_type === 'exact';
                });
                const hasSimilar = group.studies.some(s => {
                  const log = s.duplicate_check_log;
                  return Array.isArray(log) && log.length > 0 && log[0].check_type === 'similar';
                });

                // Show study names in the row instead of just count
                const studyNames = group.studies.map(s =>
                  truncateName(s.title || s.original_filename.replace('.pdf', ''))
                );

                return (
                  <React.Fragment key={group.id}>
                    <tr
                      className="hover:bg-muted/50 cursor-pointer border-b border-border/50"
                      onClick={() => group.studies.length > 0 && toggleExpand(group.id)}
                    >
                      <td className="px-2 py-2">
                        {group.studies.length > 0 && (
                          isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(group.imported_at)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {group.import_type === 'manual' ? 'PDF' : group.import_type === 'library' ? 'Library' : 'SciSpace'}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-xs max-w-[300px]">
                        {group.studies.length === 0 ? (
                          <span className="text-muted-foreground italic">{t('studies.history.noStudies')}</span>
                        ) : (
                          <div className="space-y-0.5">
                            {studyNames.slice(0, 2).map((name, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{name}</span>
                              </div>
                            ))}
                            {studyNames.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{studyNames.length - 2} {t('studies.history.more')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {group.studies.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : hasExact ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {t('studies.history.hasDuplicates')}
                          </span>
                        ) : hasSimilar ? (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {t('studies.history.hasSimilar')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t('studies.history.allClear')}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {getStatusBadge(group.scispace_status)}
                      </td>
                    </tr>

                    {/* Expanded studies detail */}
                    {isExpanded && group.studies.map(study => (
                      <tr key={study.id} className="bg-muted/20">
                        <td></td>
                        <td colSpan={2} className="px-2 py-1.5 text-xs">
                          <div className="flex items-center gap-2 pl-3 border-l-2 border-muted-foreground/20">
                            {getDuplicateIcon(study.duplicate_check_log)}
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[250px]">
                                {study.title || study.original_filename}
                              </p>
                              {study.title && study.title !== study.original_filename.replace('.pdf', '') && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                                  {study.original_filename}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-xs">
                          {getStatusBadge(study.kanban_status)}
                        </td>
                        <td className="px-2 py-1.5 text-xs">
                          {getDuplicateLabel(study.duplicate_check_log)}
                        </td>
                        <td></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? t('studies.history.noResults') : t('studies.history.noImports')}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
