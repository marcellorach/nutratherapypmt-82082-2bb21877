
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nutraceuticals } from '@/data';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEfficacy: number | null;
  setFilterEfficacy: (score: number | null) => void;
  filterCondition: string | null;
  setFilterCondition: (condition: string | null) => void;
  clearFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterEfficacy,
  setFilterEfficacy,
  filterCondition,
  setFilterCondition,
  clearFilters,
}) => {
  const uniqueConditions = [...new Set(nutraceuticals.map(item => item.condition))];

  return (
    <div className="p-4 border-b">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar nutracêutico por nome ou composto..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Eficácia
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[5, 4, 3, 2, 1].map((score) => (
                <DropdownMenuCheckboxItem
                  key={score}
                  checked={filterEfficacy === score}
                  onCheckedChange={() => 
                    filterEfficacy === score 
                      ? setFilterEfficacy(null) 
                      : setFilterEfficacy(score)
                  }
                >
                  {score} {score === 1 ? "estrela" : "estrelas"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Condição
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {uniqueConditions.map((condition) => (
                <DropdownMenuCheckboxItem
                  key={condition}
                  checked={filterCondition === condition}
                  onCheckedChange={() => 
                    filterCondition === condition 
                      ? setFilterCondition(null) 
                      : setFilterCondition(condition)
                  }
                >
                  {condition}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(filterEfficacy !== null || filterCondition !== null || searchTerm) && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
