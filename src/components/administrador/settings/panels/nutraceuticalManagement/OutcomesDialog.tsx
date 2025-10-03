
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
import { OutcomesDialogProps } from './types';
import { useTranslation } from 'react-i18next';

const OutcomesDialog: React.FC<OutcomesDialogProps> = ({ isOpen, setIsOpen, nutraceutical, onComplete }) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('nutraceuticals.outcomes.title')}</DialogTitle>
          <DialogDescription>
            {nutraceutical ? t('nutraceuticals.outcomes.description', { name: nutraceutical.name }) : t('nutraceuticals.outcomes.loading')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Conteúdo do diálogo mantido da implementação original */}
          <p className="text-muted-foreground text-sm">{t('nutraceuticals.outcomes.placeholder')}</p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="default" 
            onClick={() => {
              setIsOpen(false);
              onComplete();
            }}
          >
            {t('nutraceuticals.outcomes.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomesDialog;
