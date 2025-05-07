
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface OutcomeDeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  name: string;
  onConfirm: () => void;
}

const OutcomeDeleteDialog: React.FC<OutcomeDeleteDialogProps> = ({
  isOpen,
  setIsOpen,
  name,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Confirmar exclusão</span>
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o outcome <strong>{name}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              onConfirm();
              setIsOpen(false);
            }}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomeDeleteDialog;
