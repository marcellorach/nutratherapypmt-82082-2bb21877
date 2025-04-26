
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, Star } from 'lucide-react';

interface EfficacyMatrixFiltersProps {
  efficacyFilter: string;
  evidenceFilter: string;
  studyCountFilter: string;
  viewMode: string;
  showOnlyFavorites: boolean;
  comparisonMode: boolean;
  onEfficacyFilterChange: (value: string) => void;
  onEvidenceFilterChange: (value: string) => void;
  onStudyCountFilterChange: (value: string) => void;
  onViewModeChange: (value: string) => void;
  onShowOnlyFavoritesChange: () => void;
  onComparisonModeChange: () => void;
  onExportData: () => void;
}

export const EfficacyMatrixFilters: React.FC<EfficacyMatrixFiltersProps> = ({
  efficacyFilter,
  evidenceFilter,
  studyCountFilter,
  viewMode,
  showOnlyFavorites,
  comparisonMode,
  onEfficacyFilterChange,
  onEvidenceFilterChange,
  onStudyCountFilterChange,
  onViewModeChange,
  onShowOnlyFavoritesChange,
  onComparisonModeChange,
  onExportData
}) => {
  return (
    <div className="flex items-center gap-2">
      <Select value={viewMode} onValueChange={onViewModeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Modo de Visualização" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="standard">Padrão</SelectItem>
            <SelectItem value="compact">Compacto</SelectItem>
            <SelectItem value="detailed">Detalhado</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <Button 
        variant={showOnlyFavorites ? "secondary" : "outline"} 
        size="sm"
        onClick={onShowOnlyFavoritesChange}
        className="flex items-center"
      >
        <Star className={`mr-1 h-4 w-4 ${showOnlyFavorites ? "text-amber-400" : "text-gray-400"}`} />
        Favoritos
      </Button>
      
      <Button 
        variant={comparisonMode ? "secondary" : "outline"} 
        size="sm"
        onClick={onComparisonModeChange}
        className="flex items-center"
      >
        <BarChart2 className="mr-1 h-4 w-4" />
        Comparar
      </Button>
      
      <Button variant="outline" size="sm" onClick={onExportData} className="flex items-center">
        <Download className="mr-1 h-4 w-4" />
        Exportar
      </Button>
    </div>
  );
};
