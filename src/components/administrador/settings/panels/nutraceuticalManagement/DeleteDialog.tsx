
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeleteDialogProps } from './types';
import { useTranslation } from 'react-i18next';

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, setIsOpen, name, onConfirm }) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('nutraceuticals.delete.title')}</DialogTitle>
          <DialogDescription>
            {t('nutraceuticals.delete.description')} <strong>{name}</strong>?
            {' '}{t('nutraceuticals.delete.warning')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            {t('nutraceuticals.delete.cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            {t('nutraceuticals.delete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
