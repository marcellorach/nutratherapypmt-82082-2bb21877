
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import HealthConditionsTable from './healthConditions/HealthConditionsTable';
import HealthConditionStats from './healthConditions/HealthConditionStats';
import TreatabilityBarChart from './healthConditions/TreatabilityBarChart';
import { Badge } from "@/components/ui/badge";
import { useHealthConditionsData } from '@/hooks/visualizations/useHealthConditionsData';

const HealthConditionsTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [breedFilter, setBreedFilter] = useState('all');
  const [treatabilityFilter, setTreatabilityFilter] = useState('all');
  
  const { 
    conditions, 
    isLoading, 
    stats, 
    filteredConditions
  } = useHealthConditionsData({
    searchTerm,
    species: speciesFilter,
    breed: breedFilter,
    treatabilityLevel: treatabilityFilter
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('visualization.conditions.title')}</h2>
          <p className="text-gray-600">{t('visualization.conditions.description')}</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('visualization.conditions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.conditions.filters.species')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.conditions.filters.allSpecies')}</SelectItem>
              <SelectItem value="canine">{t('visualization.conditions.filters.canine')}</SelectItem>
              <SelectItem value="feline">{t('visualization.conditions.filters.feline')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={breedFilter} onValueChange={setBreedFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.conditions.filters.breed')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.conditions.filters.allBreeds')}</SelectItem>
              <SelectItem value="golden">{t('visualization.conditions.filters.golden')}</SelectItem>
              <SelectItem value="labrador">{t('visualization.conditions.filters.labrador')}</SelectItem>
              <SelectItem value="bulldog">{t('visualization.conditions.filters.bulldog')}</SelectItem>
              <SelectItem value="poodle">{t('visualization.conditions.filters.poodle')}</SelectItem>
              <SelectItem value="siamese">{t('visualization.conditions.filters.siamese')}</SelectItem>
              <SelectItem value="persian">{t('visualization.conditions.filters.persian')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={treatabilityFilter} onValueChange={setTreatabilityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.conditions.filters.treatability')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.conditions.filters.allLevels')}</SelectItem>
              <SelectItem value="high">{t('visualization.conditions.filters.high')}</SelectItem>
              <SelectItem value="medium">{t('visualization.conditions.filters.medium')}</SelectItem>
              <SelectItem value="low">{t('visualization.conditions.filters.low')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('visualization.conditions.filters.moreFilters')}
          </Button>
          
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            {t('visualization.conditions.filters.export')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {t('visualization.conditions.badges.arthritis')}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {t('visualization.conditions.badges.dermatitis')}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          {t('visualization.conditions.badges.dogs')}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          {t('visualization.conditions.badges.cats')}
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          {t('visualization.conditions.badges.highTreatability')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthConditionStats stats={stats} isLoading={isLoading} />
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('visualization.conditions.chart.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TreatabilityBarChart conditions={filteredConditions} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('visualization.conditions.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthConditionsTable 
            conditions={filteredConditions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthConditionsTab;
