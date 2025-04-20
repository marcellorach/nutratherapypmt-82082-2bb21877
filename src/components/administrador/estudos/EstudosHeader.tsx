
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";

interface EstudosHeaderProps {
  onAddEstudo: () => void;
}

const EstudosHeader: React.FC<EstudosHeaderProps> = ({ onAddEstudo }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold">Estudos Científicos</h2>
        <p className="text-gray-600">Gerenciamento e análise de estudos sobre nutracêuticos</p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avançados
        </Button>
        <Button onClick={onAddEstudo} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Estudo
        </Button>
      </div>
    </div>
  );
};

export default EstudosHeader;
