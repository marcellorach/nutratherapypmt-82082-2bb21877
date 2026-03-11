
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Trash2, RefreshCw, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BulkCleanupDialog from '../BulkCleanupDialog';
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

interface HistoryTabProps {
  onProcessWithAI: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onProcessWithAI }) => {
  const [importGroups, setImportGroups] = useState<ImportGroup[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupAction, setCleanupAction] = useState<'selected' | 'old' | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === 'pt' ? pt : enUS;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setSelectedItems([]);

    try {
      // Fetch imports
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

      // Fetch all studies linked to these imports
      const importIds = imports.map(i => i.id);
      const { data: studies, error: studiesError } = await supabase
        .from("processed_studies")
        .select("id, title, original_filename, kanban_status, source_import_id, duplicate_check_log")
        .in("source_import_id", importIds)
        .is("deleted_at", null);

      if (studiesError) throw studiesError;

      // Group studies by import
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
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked && importGroups) {
      setSelectedItems(importGroups.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCleanOldImports = () => {
    setCleanupAction('old');
    setShowCleanupDialog(true);
  };

  const handleDeleteSelected = () => {
    setCleanupAction('selected');
    setShowCleanupDialog(true);
  };

  const executeCleanup = async () => {
    try {
      if (cleanupAction === 'old') {
        const { data: allImports, error: fetchError } = await supabase
          .from('scispace_imports')
          .select('id')
          .order('imported_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (allImports && allImports.length > 5) {
          const idsToDelete = allImports.slice(5).map(i => i.id);

          const { error: studiesError } = await supabase
            .from('processed_studies')
            .delete()
            .in('source_import_id', idsToDelete);
          if (studiesError) throw studiesError;

          const { error: deleteError } = await supabase
            .from('scispace_imports')
            .delete()
            .in('id', idsToDelete);
          if (deleteError) throw deleteError;

          toast({
            title: t('studies.cleanup.success'),
            description: t('studies.cleanup.oldImportsRemoved', { count: idsToDelete.length }),
          });
        } else {
          toast({
            title: t('studies.cleanup.nothingToClean'),
            description: t('studies.cleanup.lessThan5'),
          });
        }
      } else if (cleanupAction === 'selected' && selectedItems.length > 0) {
        const { error: studiesError } = await supabase
          .from('processed_studies')
          .delete()
          .in('source_import_id', selectedItems);
        if (studiesError) throw studiesError;

        const { error: deleteError } = await supabase
          .from('scispace_imports')
          .delete()
          .in('id', selectedItems);
        if (deleteError) throw deleteError;

        toast({
          title: t('studies.cleanup.success'),
          description: t('studies.cleanup.selectedRemoved', { count: selectedItems.length }),
        });
      }

      fetchHistory();
    } catch (error: any) {
      toast({
        title: t('studies.cleanup.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowCleanupDialog(false);
      setCleanupAction(null);
    }
  };

  const getDuplicateIcon = (log: any) => {
    if (!log || !Array.isArray(log) || log.length === 0) {
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    }
    const entry = log[0];
    if (entry.check_type === 'exact') {
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
    if (entry.check_type === 'similar') {
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    }
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
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colorMap[status] || 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="py-2">
        {historyLoading ? (
          <div className="text-center p-6 text-muted-foreground">{t('studies.history.loading')}</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3 gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchHistory}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  {t('studies.history.updateList')}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanOldImports}
                  disabled={!importGroups || importGroups.length <= 5}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {t('studies.cleanup.cleanOldImports')}
                </Button>

                {selectedItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t('studies.cleanup.deleteSelected', { count: selectedItems.length })}
                  </Button>
                )}
              </div>

              <Button
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={onProcessWithAI}
              >
                <Brain className="mr-1 h-4 w-4" />
                {t('studies.history.processWithAI')}
              </Button>
            </div>

            {importGroups && importGroups.length > 0 ? (
              <>
                {importGroups.length > 5 && (
                  <div className="mb-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                    {t('studies.cleanup.tooManyImports', { count: importGroups.length })}
                  </div>
                )}

                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-2 w-8">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === importGroups.length && importGroups.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="px-2 py-2 w-6"></th>
                        <th className="px-2 py-2 text-left">{t('studies.history.importDate')}</th>
                        <th className="px-2 py-2 text-left">{t('studies.history.importType')}</th>
                        <th className="px-2 py-2 text-left">{t('studies.history.studyCount')}</th>
                        <th className="px-2 py-2 text-left">{t('studies.history.duplicateCheck')}</th>
                        <th className="px-2 py-2 text-left">{t('studies.history.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importGroups.map((group) => {
                        const isExpanded = expandedItems.has(group.id);
                        const hasExact = group.studies.some(s => {
                          const log = s.duplicate_check_log;
                          return Array.isArray(log) && log.length > 0 && log[0].check_type === 'exact';
                        });
                        const hasSimilar = group.studies.some(s => {
                          const log = s.duplicate_check_log;
                          return Array.isArray(log) && log.length > 0 && log[0].check_type === 'similar';
                        });

                        return (
                          <React.Fragment key={group.id}>
                            <tr
                              className={`hover:bg-muted/50 cursor-pointer ${selectedItems.includes(group.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                              onClick={() => group.studies.length > 0 && toggleExpand(group.id)}
                            >
                              <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(group.id)}
                                  onChange={() => toggleItemSelection(group.id)}
                                  className="cursor-pointer"
                                />
                              </td>
                              <td className="px-2 py-2">
                                {group.studies.length > 0 && (
                                  isExpanded
                                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </td>
                              <td className="px-2 py-2 text-xs whitespace-nowrap">
                                {formatDate(group.imported_at)}
                              </td>
                              <td className="px-2 py-2 text-xs">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {group.import_type === 'manual' ? 'PDF Upload' : 'SciSpace'}
                                </Badge>
                              </td>
                              <td className="px-2 py-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  {t('studies.history.studiesCount', { count: group.studies.length })}
                                </span>
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

                            {/* Expanded studies */}
                            {isExpanded && group.studies.map(study => (
                              <tr key={study.id} className="bg-muted/30">
                                <td></td>
                                <td></td>
                                <td colSpan={2} className="px-2 py-1.5 text-xs">
                                  <div className="flex items-center gap-2 pl-2 border-l-2 border-muted-foreground/20">
                                    {getDuplicateIcon(study.duplicate_check_log)}
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">
                                        {study.title || study.original_filename}
                                      </p>
                                      {study.title && study.title !== study.original_filename.replace('.pdf', '') && (
                                        <p className="text-[10px] text-muted-foreground truncate">
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
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('studies.history.noImports')}
              </div>
            )}
          </>
        )}
      </div>

      <BulkCleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        onConfirm={executeCleanup}
        title={
          cleanupAction === 'old'
            ? t('studies.cleanup.cleanOldImportsTitle')
            : t('studies.cleanup.deleteSelectedTitle')
        }
        description={
          cleanupAction === 'old'
            ? t('studies.cleanup.cleanOldImportsDesc')
            : t('studies.cleanup.deleteSelectedDesc')
        }
        itemCount={
          cleanupAction === 'old'
            ? Math.max(0, (importGroups?.length || 0) - 5)
            : selectedItems.length
        }
        variant={cleanupAction === 'selected' ? 'destructive' : 'warning'}
      />
    </>
  );
};

export default HistoryTab;
