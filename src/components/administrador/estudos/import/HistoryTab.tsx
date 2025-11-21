
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SciImportHistoryRow from './SciImportHistoryRow';
import BulkCleanupDialog from '../BulkCleanupDialog';
import { useTranslation } from 'react-i18next';

interface ImportHistoryRow {
  id: string;
  imported_at: string | null;
  meta_summary_filename: string;
  meta_summary_storage_path: string;
  base_studies_filename: string;
  base_studies_storage_path: string;
  scispace_status: string | null;
}

interface HistoryTabProps {
  onProcessWithAI: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onProcessWithAI }) => {
  const [importHistory, setImportHistory] = useState<ImportHistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupAction, setCleanupAction] = useState<'selected' | 'old' | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setHistoryLoading(true);
    setSelectedItems([]);
    supabase
      .from("scispace_imports")
      .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status")
      .order("imported_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: t('studies.history.errorFetching'),
            description: error.message,
            variant: "destructive"
          });
          setImportHistory([]);
        } else {
          setImportHistory(data || []);
        }
        setHistoryLoading(false);
      });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && importHistory) {
      setSelectedItems(importHistory.map(item => item.id));
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
        // Keep only last 5 imports
        const { data: allImports, error: fetchError } = await supabase
          .from('scispace_imports')
          .select('id')
          .order('imported_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (allImports && allImports.length > 5) {
          const idsToKeep = allImports.slice(0, 5).map(i => i.id);
          const idsToDelete = allImports.slice(5).map(i => i.id);

          // Delete associated studies first
          const { error: studiesError } = await supabase
            .from('processed_studies')
            .delete()
            .in('source_import_id', idsToDelete);

          if (studiesError) throw studiesError;

          // Delete imports
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
            variant: "default",
          });
        }
      } else if (cleanupAction === 'selected' && selectedItems.length > 0) {
        // Delete associated studies first
        const { error: studiesError } = await supabase
          .from('processed_studies')
          .delete()
          .in('source_import_id', selectedItems);

        if (studiesError) throw studiesError;

        // Delete selected imports
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
                  disabled={!importHistory || importHistory.length <= 5}
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

            {importHistory && importHistory.length > 0 ? (
              <>
                {importHistory.length > 5 && (
                  <div className="mb-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                    {t('studies.cleanup.tooManyImports', { count: importHistory.length })}
                  </div>
                )}
                
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === importHistory.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="px-2 py-1">{t('studies.history.importDate')}</th>
                        <th className="px-2 py-1">{t('studies.history.metaSummary')}</th>
                        <th className="px-2 py-1">{t('studies.history.baseStudies')}</th>
                        <th className="px-2 py-1">{t('studies.history.status')}</th>
                        <th className="px-2 py-1">{t('studies.history.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importHistory.map((item) => (
                        <SciImportHistoryRow
                          key={item.id}
                          item={item}
                          onDeleted={fetchHistory}
                          isSelected={selectedItems.includes(item.id)}
                          onToggleSelect={toggleItemSelection}
                        />
                      ))}
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
            ? Math.max(0, (importHistory?.length || 0) - 5)
            : selectedItems.length
        }
        variant={cleanupAction === 'selected' ? 'destructive' : 'warning'}
      />
    </>
  );
};

export default HistoryTab;
