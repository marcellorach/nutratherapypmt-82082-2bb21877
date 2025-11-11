import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import ClinicalDashboard from './ClinicalDashboard';
import ConditionAnalysisCards from './ConditionAnalysisCards';
import ResponseTimeline from './ResponseTimeline';
import FilterPanel from './FilterPanel';
import { generateMockPets, HEALTH_CONDITIONS } from '@/utils/mockClinicalData';

export interface ClinicalFilters {
  breed?: string;
  condition?: string;
  responseStatus?: string;
  treatmentDuration?: string;
  ageRange?: string;
  region?: string;
}

const ClinicalMonitoringTab: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ClinicalFilters>({});
  
  // Generate mock pets data (memoized)
  const allPets = useMemo(() => generateMockPets(), []);
  
  // Filter pets based on selected filters
  const filteredPets = useMemo(() => {
    return allPets.filter(pet => {
      if (filters.breed && pet.breed !== filters.breed) return false;
      if (filters.condition && !pet.conditions.includes(filters.condition)) return false;
      if (filters.responseStatus && pet.responseStatus !== filters.responseStatus) return false;
      if (filters.region && pet.region !== filters.region) return false;
      
      if (filters.treatmentDuration) {
        const [min, max] = filters.treatmentDuration.split('-').map(Number);
        if (pet.followUpMonths < min || (max && pet.followUpMonths > max)) return false;
      }
      
      if (filters.ageRange) {
        const [min, max] = filters.ageRange.split('-').map(Number);
        if (pet.age < min || (max && pet.age > max)) return false;
      }
      
      return true;
    });
  }, [allPets, filters]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('clinicalMonitoring.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('clinicalMonitoring.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} totalPets={allPets.length} />

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            {t('clinicalMonitoring.tabs.dashboard')}
          </TabsTrigger>
          <TabsTrigger value="byCondition">
            {t('clinicalMonitoring.tabs.byCondition')}
          </TabsTrigger>
          <TabsTrigger value="timeline">
            {t('clinicalMonitoring.tabs.timeline')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ClinicalDashboard pets={filteredPets} />
        </TabsContent>

        <TabsContent value="byCondition" className="space-y-4">
          <ConditionAnalysisCards pets={filteredPets} conditions={HEALTH_CONDITIONS} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ResponseTimeline pets={filteredPets} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicalMonitoringTab;
