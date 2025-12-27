import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudyToDelete {
  id: string;
  title: string;
  kanban_status: string;
}

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studies: StudyToDelete[];
  onConfirm: () => void;
  isDeleting: boolean;
}

const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  studies,
  onConfirm,
  isDeleting
}) => {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  
  const approvedCount = studies.filter(s => s.kanban_status === 'approved').length;
  const hasApproved = approvedCount > 0;
  const requiredText = 'DELETE';
  const isConfirmValid = confirmText === requiredText;

  // Reset confirm text when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'processed':
        return <Badge variant="secondary">Processed</Badge>;
      case 'in_curation':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">In Curation</Badge>;
      case 'new':
        return <Badge variant="outline">New</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {t('studies.deletion.bulkDeleteTitle', { count: studies.length })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('studies.deletion.bulkDeleteDescription')}
              </p>

              {hasApproved && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>{t('studies.deletion.warningApproved', { count: approvedCount })}</strong>
                    <p className="mt-1 text-red-700">
                      {t('studies.deletion.warningApprovedDetail')}
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de estudos a serem deletados */}
              <div className="border rounded-md">
                <div className="p-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                  {t('studies.deletion.studiesAffected', { count: studies.length })}
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-2">
                    {studies.map((study) => (
                      <div 
                        key={study.id} 
                        className={`p-2 rounded-md text-sm flex items-center justify-between ${
                          study.kanban_status === 'approved' 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-muted/30'
                        }`}
                      >
                        <span className="truncate flex-1 mr-2">
                          {study.title || `Study ${study.id.substring(0, 8)}`}
                        </span>
                        {getStatusBadge(study.kanban_status)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Confirmação digitada */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {t('studies.deletion.typeToConfirm', { text: requiredText })}
                </div>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder={requiredText}
                  className={`font-mono ${
                    confirmText.length > 0 
                      ? isConfirmValid 
                        ? 'border-green-500 focus-visible:ring-green-500' 
                        : 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                  disabled={isDeleting}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? t('common.deleting') : t('studies.deletion.confirmDelete', { count: studies.length })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteConfirmDialog;
