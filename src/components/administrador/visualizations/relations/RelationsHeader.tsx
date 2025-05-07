
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface RelationsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  relationshipFilter?: string;
  onRelationshipFilterChange?: (value: string) => void;
  isLoading?: boolean;
  onExportClick?: () => void;
  onAddRelation?: () => void;
}

const RelationsHeader: React.FC<RelationsHeaderProps> = ({
  searchTerm,
  onSearchChange,
  relationshipFilter = 'all',
  onRelationshipFilterChange,
  isLoading = false,
  onExportClick,
  onAddRelation
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relações Nutracêutico-Outcome</h2>
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
              disabled={isLoading}
            />
          </div>
          
          {onRelationshipFilterChange && (
            <Select 
              value={relationshipFilter} 
              onValueChange={onRelationshipFilterChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar relações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas relações</SelectItem>
                <SelectItem value="prevention">Prevenção</SelectItem>
                <SelectItem value="treatment">Tratamento</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {onExportClick && (
            <Button variant="outline" className="flex items-center" onClick={onExportClick} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
          
          {onAddRelation && (
            <Button variant="outline" className="flex items-center" onClick={onAddRelation} disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Relação
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Nutracêuticos
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Condições
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Alta Eficácia (4-5)
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Média Eficácia (3-4)
        </Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
          Baixa Eficácia (1-3)
        </Badge>
      </div>
    </div>
  );
};

export default RelationsHeader;
