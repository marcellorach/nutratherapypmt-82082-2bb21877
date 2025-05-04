
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

interface DeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  name: string;
  onConfirm: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  setIsOpen,
  name,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Nutracêutico</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o nutracêutico "{name}"? Esta ação não pode ser desfeita.
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
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
