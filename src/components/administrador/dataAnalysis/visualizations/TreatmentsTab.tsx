
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
import { Search, Filter, ArrowUpDown, FileDown, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NutraceuticalPackagesTable from './treatments/NutraceuticalPackagesTable';
import PackageDetailsPanel from './treatments/PackageDetailsPanel';
import PackageEfficiencyMetrics from './treatments/PackageEfficiencyMetrics';
import { useTreatmentsData } from '@/hooks/visualizations/useTreatmentsData';
import { Checkbox } from "@/components/ui/checkbox";

const TreatmentsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [packageTypeFilter, setPackageTypeFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('recommended');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  const { 
    packages, 
    isLoading, 
    packageDetails,
    filteredPackages,
    packageStats
  } = useTreatmentsData({
    searchTerm,
    condition: conditionFilter,
    species: speciesFilter,
    packageType: packageTypeFilter
  });
  
  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId) 
        : [...prev, packageId]
    );
  };
  
  const handleSelectAllPackages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pacotes de Tratamento</h2>
          <p className="text-gray-600">
            Pacotes de nutracêuticos para tratamento e prevenção de condições
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar pacotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Condições</SelectItem>
              <SelectItem value="artrite">Artrite</SelectItem>
              <SelectItem value="dermatite">Dermatite Atópica</SelectItem>
              <SelectItem value="cardiaco">Problemas Cardíacos</SelectItem>
            </SelectContent>
          </Select>
          
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
          
          <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo de Pacote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="treatment">Tratamento</SelectItem>
              <SelectItem value="prevention">Prevenção</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Mais Filtros
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Pack Articular Premium
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Prevenção
        </Badge>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
          Tratamento
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Alta Eficácia
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Pacotes de Nutracêuticos</CardTitle>
              <div className="flex items-center space-x-4">
                {selectedPackages.length > 0 && (
                  <Button 
                    variant="default" 
                    className="gap-2"
                    onClick={() => console.log('Enviar para revisão:', selectedPackages)}
                  >
                    <Send className="h-4 w-4" />
                    Enviar para Revisão ({selectedPackages.length})
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Ordenar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="recommended">Pacotes Recomendados</TabsTrigger>
                <TabsTrigger value="all">Todos os Pacotes</TabsTrigger>
                <TabsTrigger value="custom">Personalizados</TabsTrigger>
                <TabsTrigger value="reviews">Em Revisão</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recommended" className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="selectAll" onCheckedChange={handleSelectAllPackages} />
                    <label htmlFor="selectAll" className="text-sm">
                      Selecionar Todos
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {filteredPackages.length} pacotes disponíveis
                  </p>
                </div>
                
                <NutraceuticalPackagesTable 
                  packages={filteredPackages} 
                  isLoading={isLoading}
                  onPackageSelect={setSelectedPackage}
                  selectedPackage={selectedPackage}
                  selectedPackages={selectedPackages}
                  onPackageSelectionToggle={togglePackageSelection}
                />
              </TabsContent>
              
              <TabsContent value="all">
                <p className="text-muted-foreground text-center py-12">
                  Visualização de todos os pacotes em desenvolvimento
                </p>
              </TabsContent>
              
              <TabsContent value="custom">
                <p className="text-muted-foreground text-center py-12">
                  Pacotes personalizados em desenvolvimento
                </p>
              </TabsContent>
              
              <TabsContent value="reviews">
                <p className="text-muted-foreground text-center py-12">
                  Pacotes em revisão em desenvolvimento
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pacote</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPackage ? (
              <PackageDetailsPanel 
                packageDetails={packageDetails} 
                packageId={selectedPackage}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Selecione um pacote para ver detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Eficiência</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageEfficiencyMetrics 
            packageStats={packageStats}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentsTab;
