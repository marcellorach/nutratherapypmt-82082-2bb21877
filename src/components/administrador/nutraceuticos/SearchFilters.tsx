
import React from 'react';
import { Search, X, RefreshCw, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterEfficacy: string;
  setFilterEfficacy: (value: string) => void;
  filterCondition: string;
  setFilterCondition: (value: string) => void;
  clearFilters: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onAddNewClick?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterEfficacy,
  setFilterEfficacy,
  filterCondition,
  setFilterCondition,
  clearFilters,
  onRefresh,
  isRefreshing = false,
  onAddNewClick
}) => {
  const hasActiveFilters = !!filterEfficacy || !!filterCondition;

  return (
    <div className="border-b p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou propriedades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={hasActiveFilters ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge 
                  variant="secondary" 
                  className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {(!!filterEfficacy ? 1 : 0) + (!!filterCondition ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filtros Avançados</h4>
              
              <div className="space-y-2">
                <label className="text-sm" htmlFor="efficacy">Eficácia</label>
                <Select value={filterEfficacy} onValueChange={setFilterEfficacy}>
                  <SelectTrigger id="efficacy">
                    <SelectValue placeholder="Nível de eficácia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="high">Alta (4-5)</SelectItem>
                    <SelectItem value="medium">Média (3)</SelectItem>
                    <SelectItem value="low">Baixa (1-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm" htmlFor="condition">Condição de Saúde</label>
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Todas as condições" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as condições</SelectItem>
                    <SelectItem value="cardiac">Cardíacas</SelectItem>
                    <SelectItem value="joint">Articulações</SelectItem>
                    <SelectItem value="renal">Renais</SelectItem>
                    <SelectItem value="liver">Hepáticas</SelectItem>
                    <SelectItem value="immune">Imunológicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Limpar Filtros
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="gap-1"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        
        {onAddNewClick && (
          <Button 
            variant="default" 
            size="sm"
            onClick={onAddNewClick}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Novo Nutracêutico
          </Button>
        )}
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3">
          <p className="text-sm text-muted-foreground">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {filterEfficacy && filterEfficacy !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Eficácia: {filterEfficacy === 'high' ? 'Alta' : filterEfficacy === 'medium' ? 'Média' : 'Baixa'}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setFilterEfficacy('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filterCondition && filterCondition !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Condição: {
                  filterCondition === 'cardiac' ? 'Cardíacas' : 
                  filterCondition === 'joint' ? 'Articulações' : 
                  filterCondition === 'renal' ? 'Renais' : 
                  filterCondition === 'liver' ? 'Hepáticas' : 'Imunológicas'
                }
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setFilterCondition('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              Limpar todos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
