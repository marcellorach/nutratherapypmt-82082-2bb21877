
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Network, ArrowUpDown, Filter, Settings, Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import SankeyDiagram from './visualizations/SankeyDiagram';
import NetworkGraph from './visualizations/NetworkGraph';
import EfficacyMatrix from './visualizations/EfficacyMatrix';
import EnhancedSankeyDiagram from './visualizations/EnhancedSankeyDiagram';
import { Badge } from "@/components/ui/badge";
import { useEfficacyMatrixData } from '@/hooks/useEfficacyMatrixData';
import { useSankeyData } from '@/hooks/useSankeyData';
import { useNetworkData } from '@/hooks/useNetworkData';
import { Loader2 } from "lucide-react";

const RelationsTab: React.FC = () => {
  const [relationView, setRelationView] = useState<string>('enhanced-sankey');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar dados reais
  const { matrixData, isLoading: matrixLoading } = useEfficacyMatrixData();
  const { sankeyData, isLoading: sankeyLoading } = useSankeyData();
  const { networkData, isLoading: networkLoading } = useNetworkData();

  const isLoading = matrixLoading || sankeyLoading || networkLoading;

  // Filtrar dados baseado no termo de busca
  const filteredMatrixData = useMemo(() => {
    if (!matrixData || !searchTerm) return matrixData;
    
    const filteredNutraceuticos = matrixData.nutraceuticos.filter(nutra => 
      nutra.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredCondicoes = matrixData.condicoes.filter(cond => 
      cond.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return {
      ...matrixData,
      nutraceuticos: filteredNutraceuticos,
      condicoes: filteredCondicoes
    };
  }, [matrixData, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Carregando dados das relações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relações Nutraceutico-Condição</h2>
          <p className="text-gray-600">
            Visualize as relações entre nutracêuticos e suas condições de saúde associadas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nutracêuticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matrixData?.nutraceuticos?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Substâncias cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Condições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matrixData?.condicoes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Condições de saúde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Relações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matrixData?.cells?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Relações mapeadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Eficácia Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matrixData?.cells?.length > 0 
                ? (matrixData.cells.reduce((acc, cell) => acc + cell.efficacyScore, 0) / matrixData.cells.length).toFixed(1)
                : 0}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Score médio
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visualizações</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar nutracêutico ou condição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={efficacyFilter} onValueChange={setEfficacyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por eficácia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as eficácias</SelectItem>
                  <SelectItem value="high">Alta eficácia (4-5)</SelectItem>
                  <SelectItem value="medium">Média eficácia (3-4)</SelectItem>
                  <SelectItem value="low">Baixa eficácia (0-3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={relationView} onValueChange={setRelationView}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="enhanced-sankey">Sankey Avançado</TabsTrigger>
              <TabsTrigger value="sankey">Sankey Básico</TabsTrigger>
              <TabsTrigger value="network">Rede</TabsTrigger>
              <TabsTrigger value="matrix">Matriz</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enhanced-sankey" className="mt-4">
              <div className="h-[600px] border rounded-lg">
                <EnhancedSankeyDiagram />
              </div>
            </TabsContent>
            
            <TabsContent value="sankey" className="mt-4">
              <div className="h-[600px] border rounded-lg">
                <SankeyDiagram data={sankeyData} />
              </div>
            </TabsContent>
            
            <TabsContent value="network" className="mt-4">
              <div className="h-[600px] border rounded-lg">
                <NetworkGraph data={networkData} showControls={true} showLegend={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="matrix" className="mt-4">
              {filteredMatrixData && (
                <EfficacyMatrix
                  nutraceuticos={filteredMatrixData.nutraceuticos}
                  condicoes={filteredMatrixData.condicoes}
                  data={filteredMatrixData.cells}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelationsTab;
