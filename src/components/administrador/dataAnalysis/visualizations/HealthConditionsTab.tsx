
import React, { useState } from 'react';
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
          <h2 className="text-2xl font-bold">Condições de Saúde</h2>
          <p className="text-gray-600">Análise de condições tratáveis com pacotes de nutracêuticos</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar condição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Espécie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Espécies</SelectItem>
              <SelectItem value="canine">Cães</SelectItem>
              <SelectItem value="feline">Gatos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={breedFilter} onValueChange={setBreedFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Raça" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Raças</SelectItem>
              <SelectItem value="golden">Golden Retriever</SelectItem>
              <SelectItem value="labrador">Labrador</SelectItem>
              <SelectItem value="bulldog">Bulldog Francês</SelectItem>
              <SelectItem value="poodle">Poodle</SelectItem>
              <SelectItem value="siamese">Siamês</SelectItem>
              <SelectItem value="persian">Persa</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={treatabilityFilter} onValueChange={setTreatabilityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tratabilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Níveis</SelectItem>
              <SelectItem value="high">Alta (&gt;75%)</SelectItem>
              <SelectItem value="medium">Média (50-75%)</SelectItem>
              <SelectItem value="low">Baixa (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Mais Filtros
          </Button>
          
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Artrite
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Dermatite Atópica
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Cães
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Gatos
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Alta Tratabilidade
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthConditionStats stats={stats} isLoading={isLoading} />
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Índice de Tratabilidade por Condição</CardTitle>
          </CardHeader>
          <CardContent>
            <TreatabilityBarChart conditions={filteredConditions} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Condições Tratáveis</CardTitle>
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
