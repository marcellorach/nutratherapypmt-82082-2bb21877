
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NutraceuticalImportDialog from './import/NutraceuticalImportDialog';

export const NutraceuticosHeader: React.FC = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Nutracêuticos Aprovados</h1>
        <p className="text-gray-600 mt-1">
          Gerencie a base de dados de nutracêuticos para recomendações personalizadas
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={() => setIsImportDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Importar Dados</span>
        </Button>
        
        <Button className="bg-purple-600 hover:bg-purple-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Nutracêutico
        </Button>
      </div>
      
      <NutraceuticalImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={() => {
          // Disparar evento para atualizar a lista de nutracêuticos
          window.dispatchEvent(new CustomEvent('nutraceuticals-imported'));
        }}
      />
    </div>
  );
};
