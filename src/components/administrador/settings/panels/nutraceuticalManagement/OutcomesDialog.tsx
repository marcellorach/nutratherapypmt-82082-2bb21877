
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

const OutcomesDialog: React.FC<OutcomesDialogProps> = ({ isOpen, setIsOpen, nutraceutical, onComplete }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Outcomes</DialogTitle>
          <DialogDescription>
            {nutraceutical ? `Gerencie as relações do nutracêutico ${nutraceutical.name} com outcomes.` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Conteúdo do diálogo mantido da implementação original */}
          <p className="text-muted-foreground text-sm">Funcionalidade será refatorada posteriormente.</p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="default" 
            onClick={() => {
              setIsOpen(false);
              onComplete();
            }}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomesDialog;
