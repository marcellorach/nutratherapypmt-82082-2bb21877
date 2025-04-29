
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, RefreshCcw } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEfficacy: number | null;
  setFilterEfficacy: (value: number | null) => void;
  filterCondition: string | null;
  setFilterCondition: (value: string | null) => void;
  clearFilters: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  isRefreshing = false
}) => {
  const conditions = [
    "Artrite",
    "Problemas cardíacos",
    "Deficiência imunológica",
    "Problemas digestivos",
    "Funções hepáticas",
    "Saúde ocular",
    "Função cognitiva",
    "Saúde renal"
  ];

  const handleEfficacyChange = (value: string) => {
    setFilterEfficacy(value ? parseInt(value) : null);
  };

  const handleConditionChange = (value: string) => {
    setFilterCondition(value || null);
  };

  return (
    <div className="border-b p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar nutracêuticos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end">
          <Select
            value={filterEfficacy?.toString() || ""}
            onValueChange={handleEfficacyChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Eficácia científica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="5">Excelente (5)</SelectItem>
              <SelectItem value="4">Muito boa (4)</SelectItem>
              <SelectItem value="3">Boa (3)</SelectItem>
              <SelectItem value="2">Moderada (2)</SelectItem>
              <SelectItem value="1">Baixa (1)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterCondition || ""}
            onValueChange={handleConditionChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {conditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || filterEfficacy || filterCondition) && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
          
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Filtros ativos */}
      {(filterEfficacy || filterCondition) && (
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-sm text-gray-500 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Filtros:
          </span>
          {filterEfficacy && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Eficácia {filterEfficacy}
              <button onClick={() => setFilterEfficacy(null)}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          {filterCondition && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filterCondition}
              <button onClick={() => setFilterCondition(null)}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
