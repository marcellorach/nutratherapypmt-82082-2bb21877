
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EfficacyMatrixFilters from './EfficacyMatrixFilters';
import EfficacyMatrixChart from './EfficacyMatrixChart';
import EfficacyMatrixTable from './EfficacyMatrixTable';

interface Nutraceutical {
  id: string;
  name: string;
  efficacy: number;
  condition: string;
  studies: number;
}

interface Props {
  nutraceuticals: Nutraceutical[];
  isLoading?: boolean;
}

const EfficacyMatrix: React.FC<Props> = ({ nutraceuticals, isLoading = false }) => {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [efficacyFilter, setEfficacyFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('efficacy');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filtrar e ordenar os dados
  const filteredData = nutraceuticals.filter(item => {
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    
    let matchesEfficacy = true;
    if (efficacyFilter === 'high') {
      matchesEfficacy = item.efficacy >= 4;
    } else if (efficacyFilter === 'medium') {
      matchesEfficacy = item.efficacy >= 3 && item.efficacy < 4;
    } else if (efficacyFilter === 'low') {
      matchesEfficacy = item.efficacy < 3;
    }
    
    return matchesCondition && matchesEfficacy;
  });

  // Ordenar os dados
  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'efficacy') {
      comparison = a.efficacy - b.efficacy;
    } else if (sortField === 'studies') {
      comparison = a.studies - b.studies;
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Matriz de Eficácia</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <EfficacyMatrixFilters 
          conditionFilter={conditionFilter}
          setConditionFilter={setConditionFilter}
          efficacyFilter={efficacyFilter}
          setEfficacyFilter={setEfficacyFilter}
        />
        
        <Tabs value={view} onValueChange={(v) => setView(v as 'chart' | 'table')} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="pt-4">
            <EfficacyMatrixChart 
              data={sortedData} 
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="table" className="pt-4">
            <EfficacyMatrixTable 
              data={sortedData}
              isLoading={isLoading}
              sortField={sortField}
              sortDirection={sortDirection}
              setSortField={setSortField}
              setSortDirection={setSortDirection}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EfficacyMatrix;
