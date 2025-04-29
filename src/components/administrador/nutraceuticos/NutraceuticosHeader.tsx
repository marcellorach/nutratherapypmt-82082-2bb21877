
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, FileSpreadsheet } from "lucide-react";
import NutraceuticalImportDialog from './import/NutraceuticalImportDialog';

export const NutraceuticosHeader: React.FC = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Nutracêuticos</h1>
        <p className="text-gray-500">
          Visualize e gerencie o banco de dados de nutracêuticos
        </p>
      </div>
      
      <div className="flex gap-2 mt-4 sm:mt-0">
        <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Importar Dados
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Nutracêutico
        </Button>
      </div>
      
      <NutraceuticalImportDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen} 
      />
    </div>
  );
};
