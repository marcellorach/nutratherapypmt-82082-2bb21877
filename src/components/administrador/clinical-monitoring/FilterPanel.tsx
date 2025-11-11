import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClinicalFilters } from './ClinicalMonitoringTab';
import { HEALTH_CONDITIONS } from '@/utils/mockClinicalData';

interface FilterPanelProps {
  filters: ClinicalFilters;
  onFiltersChange: (filters: ClinicalFilters) => void;
  totalPets: number;
}

const BREEDS = [
  'Labrador Retriever',
  'Golden Retriever',
  'Bulldog',
  'Pastor Alemão',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'Boxer',
  'Dachshund',
  'Yorkshire Terrier'
];

const REGIONS = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, totalPets }) => {
  const { t, i18n } = useTranslation();

  const updateFilter = (key: keyof ClinicalFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('clinicalMonitoring.filters.title')}</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              {t('clinicalMonitoring.filters.clear')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Breed Filter */}
          <Select value={filters.breed} onValueChange={(val) => updateFilter('breed', val)}>
            <SelectTrigger>
              <SelectValue placeholder={t('clinicalMonitoring.filters.breed')} />
            </SelectTrigger>
            <SelectContent>
              {BREEDS.map(breed => (
                <SelectItem key={breed} value={breed}>{breed}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Condition Filter */}
          <Select value={filters.condition} onValueChange={(val) => updateFilter('condition', val)}>
            <SelectTrigger>
              <SelectValue placeholder={t('clinicalMonitoring.filters.condition')} />
            </SelectTrigger>
            <SelectContent>
              {HEALTH_CONDITIONS.map(condition => (
                <SelectItem key={condition.id} value={condition.id}>
                  {i18n.language === 'en' ? condition.name_en : condition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Response Status Filter */}
          <Select value={filters.responseStatus} onValueChange={(val) => updateFilter('responseStatus', val)}>
            <SelectTrigger>
              <SelectValue placeholder={t('clinicalMonitoring.filters.responseStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="significant">{t('clinicalMonitoring.status.significant')}</SelectItem>
              <SelectItem value="mild">{t('clinicalMonitoring.status.mild')}</SelectItem>
              <SelectItem value="none">{t('clinicalMonitoring.status.none')}</SelectItem>
              <SelectItem value="insufficient">{t('clinicalMonitoring.status.insufficient')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Region Filter */}
          <Select value={filters.region} onValueChange={(val) => updateFilter('region', val)}>
            <SelectTrigger>
              <SelectValue placeholder={t('clinicalMonitoring.filters.region')} />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {t('clinicalMonitoring.filters.showing')}: <span className="font-medium">{totalPets.toLocaleString()}</span> {t('clinicalMonitoring.filters.pets')}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
