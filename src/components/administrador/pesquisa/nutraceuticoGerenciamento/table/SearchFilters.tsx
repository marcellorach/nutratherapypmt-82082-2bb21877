
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="flex items-center gap-2 pt-3">
      <Search className="h-4 w-4 text-gray-500" />
      <Input
        placeholder="Buscar nutracêutico..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Button variant="outline" size="sm" className="flex items-center">
        <Filter className="h-4 w-4 mr-1" />
        Filtros
      </Button>
    </div>
  );
};

export default SearchFilters;
