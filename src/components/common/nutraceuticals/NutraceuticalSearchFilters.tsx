
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, Plus, RefreshCw } from 'lucide-react';

interface NutraceuticalSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEfficacy?: string;
  setFilterEfficacy?: (efficacy: string) => void;
  filterCondition?: string;
  setFilterCondition?: (condition: string) => void;
  clearFilters?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAddNew?: () => void;
  mode?: 'admin' | 'scientific';
}

const NutraceuticalSearchFilters: React.FC<NutraceuticalSearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterEfficacy,
  setFilterEfficacy,
  filterCondition,
  setFilterCondition,
  clearFilters,
  onRefresh,
  isRefreshing = false,
  onAddNew,
  mode = 'scientific'
}) => {
  return (
    <div className="bg-white p-4 border-b border-gray-200 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar nutracêutico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filtros científicos (apenas no modo científico) */}
        {mode === 'scientific' && (
          <>
            {setFilterEfficacy && (
              <Select value={filterEfficacy || ''} onValueChange={setFilterEfficacy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por eficácia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as eficácias</SelectItem>
                  <SelectItem value="high">Alta (4-5)</SelectItem>
                  <SelectItem value="medium">Média (3)</SelectItem>
                  <SelectItem value="low">Baixa (1-2)</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {setFilterCondition && (
              <Select value={filterCondition || ''} onValueChange={setFilterCondition}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as condições</SelectItem>
                  <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                  <SelectItem value="inflammation">Inflamação</SelectItem>
                  <SelectItem value="cognitive">Cognitivo</SelectItem>
                  <SelectItem value="metabolic">Metabólico</SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        )}
        
        {/* Ações */}
        <div className="flex gap-2">
          {clearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
          )}
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
          
          {onAddNew && (
            <Button
              size="sm"
              onClick={onAddNew}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {mode === 'admin' ? 'Novo' : 'Adicionar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutraceuticalSearchFilters;
