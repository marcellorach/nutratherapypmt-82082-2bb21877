
import React from 'react';
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
import { useTranslation } from 'react-i18next';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  isDeleting,
  onConfirmDelete
}) => {
  const { t } = useTranslation();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('nutraceuticalDatabase.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('nutraceuticalDatabase.deleteDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('nutraceuticalDatabase.deleteDialog.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete} 
            disabled={isDeleting} 
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? t('nutraceuticalDatabase.deleteDialog.deleting') : t('nutraceuticalDatabase.deleteDialog.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
