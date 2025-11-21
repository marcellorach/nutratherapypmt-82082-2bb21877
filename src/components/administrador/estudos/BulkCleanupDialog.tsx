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

interface BulkCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemCount: number;
  variant?: 'destructive' | 'warning' | 'info';
}

const BulkCleanupDialog: React.FC<BulkCleanupDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemCount,
  variant = 'warning'
}) => {
  const { t } = useTranslation();

  const getButtonClass = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{description}</p>
            <p className="font-semibold text-foreground">
              {t('studies.cleanup.itemsAffected', { count: itemCount })}
            </p>
            <p className="text-destructive font-medium">
              {t('studies.cleanup.irreversible')}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={getButtonClass()}
          >
            {t('studies.cleanup.confirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkCleanupDialog;