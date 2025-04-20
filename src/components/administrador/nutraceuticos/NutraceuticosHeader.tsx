
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export const NutraceuticosHeader: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleAddNutraceutico = () => {
    // Aqui seria implementada a lógica para adicionar um novo nutracêutico
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A adição de novos nutracêuticos será implementada em breve.",
    });
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Nutracêuticos</h2>
          <p className="text-gray-600">Gerenciamento de substâncias individuais e suas evidências científicas</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Nutracêutico</DialogTitle>
            <DialogDescription>
              Esta funcionalidade está em desenvolvimento. Em breve você poderá adicionar novos nutracêuticos ao catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddNutraceutico}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
