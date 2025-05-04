
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
import NutraceuticalOutcomesEditor from "../NutraceuticalOutcomesEditor";

interface OutcomesDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  nutraceutical: any;
  onComplete: () => void;
}

const OutcomesDialog: React.FC<OutcomesDialogProps> = ({
  isOpen,
  setIsOpen,
  nutraceutical,
  onComplete,
}) => {
  if (!nutraceutical) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Outcomes</DialogTitle>
          <DialogDescription>
            Associe outcomes ao nutracêutico "{nutraceutical?.name}".
          </DialogDescription>
        </DialogHeader>
        
        <NutraceuticalOutcomesEditor 
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
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomesDialog;
