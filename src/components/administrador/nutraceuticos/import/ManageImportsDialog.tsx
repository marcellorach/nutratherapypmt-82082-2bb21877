
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useImportManager } from '@/hooks/nutraceuticals/useImportManager';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

// Interface para importação de nutracêuticos
interface ImportRecord {
  id: string;
  name: string;
  created_at: string;
  nutraceutical_count: number;
  description?: string;
  source_type: string;
}

interface ManageImportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportsDeleted?: () => void;
}

const ManageImportsDialog: React.FC<ManageImportsDialogProps> = ({
  open,
  onOpenChange,
  onImportsDeleted
}) => {
  const { t } = useTranslation();
  const { imports, isLoading, fetchImports, deleteImport } = useImportManager();
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { toast } = useToast();

  // Carregar dados de importações quando o diálogo for aberto
  useEffect(() => {
    if (open) {
      fetchImports(50);
    }
  }, [open]);

  const handleDeleteClick = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedImport) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteImport(selectedImport.id);
      
      if (result.success) {
        if (onImportsDeleted) {
          onImportsDeleted();
        }
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedImport(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('nutraceuticals.manageImports.title')}</DialogTitle>
            <DialogDescription>
              {t('nutraceuticals.manageImports.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : imports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('nutraceuticals.manageImports.noData')}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 text-sm">{t('nutraceuticals.manageImports.table.headers.date')}</th>
                      <th className="text-left p-2 text-sm">{t('nutraceuticals.manageImports.table.headers.name')}</th>
                      <th className="text-center p-2 text-sm">{t('nutraceuticals.manageImports.table.headers.source')}</th>
                      <th className="text-center p-2 text-sm">{t('nutraceuticals.manageImports.table.headers.nutraceuticals')}</th>
                      <th className="text-center p-2 text-sm">{t('nutraceuticals.manageImports.table.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((importRecord) => (
                      <tr key={importRecord.id} className="border-t hover:bg-gray-50">
                        <td className="p-2 text-sm">{formatDate(importRecord.created_at)}</td>
                        <td className="p-2 text-sm">{importRecord.name}</td>
                        <td className="p-2 text-sm text-center">{importRecord.source_type}</td>
                        <td className="p-2 text-sm text-center">{importRecord.nutraceutical_count}</td>
                        <td className="p-2 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteClick(importRecord)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t('nutraceuticals.manageImports.deleteAction')}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('nutraceuticals.manageImports.close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('nutraceuticals.manageImports.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('nutraceuticals.manageImports.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('nutraceuticals.manageImports.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('nutraceuticals.manageImports.delete.deleting')}
                </>
              ) : (
                t('nutraceuticals.manageImports.delete.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageImportsDialog;
