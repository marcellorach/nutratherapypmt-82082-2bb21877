
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const NutraceuticosHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h2 className="text-2xl font-bold">Catálogo de Nutracêuticos</h2>
        <p className="text-gray-600">Gerenciamento de substâncias individuais e suas evidências científicas</p>
      </div>
      <Button className="flex items-center gap-2">
        <PlusCircle className="h-4 w-4" />
        Adicionar Nutracêutico
      </Button>
    </div>
  );
};
