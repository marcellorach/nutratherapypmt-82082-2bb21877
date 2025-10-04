
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NutraceuticalConditionsEditor from "../NutraceuticalConditionsEditor";
import { useTranslation } from 'react-i18next';

interface ConditionsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  nutraceutical: any;
  onComplete: () => void;
}

const ConditionsDialog: React.FC<ConditionsDialogProps> = ({
  isOpen,
  setIsOpen,
  nutraceutical,
  onComplete,
}) => {
  const { t } = useTranslation();
  
  if (!nutraceutical) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('nutraceuticals.conditions.manageTitle')}</DialogTitle>
          <DialogDescription>
            {t('nutraceuticals.conditions.manageDescription', { name: nutraceutical?.name })}
          </DialogDescription>
        </DialogHeader>
        
        <NutraceuticalConditionsEditor 
          nutraceutical={nutraceutical}
          onComplete={() => {
            setIsOpen(false);
            onComplete();
          }}
        />
        
        <DialogFooter>
          <Button 
            onClick={() => setIsOpen(false)}
          >
            {t('nutraceuticals.conditions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionsDialog;
