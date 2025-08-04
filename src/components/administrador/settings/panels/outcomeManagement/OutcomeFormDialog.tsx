
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FamilySelector from "./FamilySelector";

interface OutcomeFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCreate: boolean;
  formData: {
    name: string;
    description: string;
    family_id: string;
  };
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFamilyChange: (value: string) => void;
  submitAction: () => void;
}

const OutcomeFormDialog: React.FC<OutcomeFormDialogProps> = ({
  isOpen,
  setIsOpen,
  isCreate,
  formData,
  handleFormChange,
  handleFamilyChange,
  submitAction,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Criar Novo Outcome" : "Editar Outcome"}
          </DialogTitle>
          <DialogDescription>
            {isCreate 
              ? "Preencha os campos abaixo para adicionar um novo outcome."
              : "Edite os campos para atualizar o outcome."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="family" className="text-right">
                Família
              </Label>
              <div className="col-span-3">
                <FamilySelector
                  value={formData.family_id}
                  onValueChange={handleFamilyChange}
                  placeholder="Selecione uma família (opcional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isCreate ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomeFormDialog;
