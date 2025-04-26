
import React from 'react';
import { Search, Filter, PlusCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RelationsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const RelationsHeader: React.FC<RelationsHeaderProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relações Nutraceutico-Condição</h2>
          <p className="text-gray-600">
            Visualize as relações entre nutracêuticos e suas condições de saúde associadas
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar relações..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Relação
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Glucosamina
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Ômega 3
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Artrite
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Inflamação
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Alta Eficácia
        </Badge>
      </div>
    </>
  );
};

export default RelationsHeader;
