import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-2">
      <Select value={viewMode} onValueChange={onViewModeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('efficacyMatrix.viewMode.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="standard">{t('efficacyMatrix.viewMode.standard')}</SelectItem>
            <SelectItem value="compact">{t('efficacyMatrix.viewMode.compact')}</SelectItem>
            <SelectItem value="detailed">{t('efficacyMatrix.viewMode.detailed')}</SelectItem>
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
        {t('efficacyMatrix.actions.favorites')}
      </Button>
      
      <Button 
        variant={comparisonMode ? "secondary" : "outline"} 
        size="sm"
        onClick={onComparisonModeChange}
        className="flex items-center"
      >
        <BarChart2 className="mr-1 h-4 w-4" />
        {t('efficacyMatrix.actions.compare')}
      </Button>
      
      <Button variant="outline" size="sm" onClick={onExportData} className="flex items-center">
        <Download className="mr-1 h-4 w-4" />
        {t('efficacyMatrix.actions.export')}
      </Button>
    </div>
  );
};
