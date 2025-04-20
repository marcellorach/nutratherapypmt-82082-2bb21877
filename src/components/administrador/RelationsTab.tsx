
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, ArrowUpDown, Filter, Settings } from "lucide-react";
import SankeyDiagram from './visualizations/SankeyDiagram';

// Dados de exemplo para o diagrama Sankey
const exampleSankeyData = {
  nodes: [
    // Nutracêuticos
    { name: 'Glucosamina', category: 'nutraceutico' },
    { name: 'Condroitina', category: 'nutraceutico' },
    { name: 'Ômega 3', category: 'nutraceutico' },
    { name: 'Curcumina', category: 'nutraceutico' },
    { name: 'MSM', category: 'nutraceutico' },
    { name: 'Coenzima Q10', category: 'nutraceutico' },
    
    // Condições
    { name: 'Artrite', category: 'condicao' },
    { name: 'Inflamação', category: 'condicao' },
    { name: 'Saúde Cardíaca', category: 'condicao' },
    { name: 'Função Cognitiva', category: 'condicao' },
    { name: 'Saúde da Pele', category: 'condicao' },
  ],
  links: [
    // Glucosamina
    { source: 0, target: 6, value: 85, labelText: 'Alta eficácia' },
    { source: 0, target: 7, value: 40, labelText: 'Eficácia moderada' },
    
    // Condroitina
    { source: 1, target: 6, value: 70, labelText: 'Eficácia alta' },
    
    // Ômega 3
    { source: 2, target: 7, value: 75, labelText: 'Eficácia alta' },
    { source: 2, target: 8, value: 60, labelText: 'Eficácia moderada' },
    { source: 2, target: 10, value: 50, labelText: 'Eficácia moderada' },
    
    // Curcumina
    { source: 3, target: 7, value: 90, labelText: 'Eficácia muito alta' },
    { source: 3, target: 6, value: 45, labelText: 'Eficácia moderada' },
    
    // MSM
    { source: 4, target: 6, value: 65, labelText: 'Eficácia moderada-alta' },
    { source: 4, target: 7, value: 55, labelText: 'Eficácia moderada' },
    
    // Coenzima Q10
    { source: 5, target: 8, value: 80, labelText: 'Eficácia alta' },
    { source: 5, target: 9, value: 45, labelText: 'Eficácia moderada' },
  ]
};

// Componente para visualizar relações entre nutraceuticos e condições de saúde
const RelationsTab: React.FC = () => {
  const [relationView, setRelationView] = useState<string>('sankey');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relações Nutraceutico-Condição</h2>
          <p className="text-gray-600">
            Visualize as relações entre nutracêuticos e suas condições de saúde associadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5 text-primary" />
              Mapa de Relações
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={efficacyFilter} onValueChange={setEfficacyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por Eficácia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Eficácia</SelectLabel>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (4-5)</SelectItem>
                    <SelectItem value="medium">Média (3-4)</SelectItem>
                    <SelectItem value="low">Baixa (1-3)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Visualize como os nutracêuticos se relacionam com diferentes condições de saúde
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Tabs defaultValue="sankey" value={relationView} onValueChange={setRelationView}>
            <TabsList className="mb-4">
              <TabsTrigger value="sankey">Diagrama Sankey</TabsTrigger>
              <TabsTrigger value="network">Rede de Relações</TabsTrigger>
              <TabsTrigger value="matrix">Matriz de Eficácia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sankey" className="pt-4">
              <SankeyDiagram data={exampleSankeyData} height={500} />
            </TabsContent>
            
            <TabsContent value="network" className="pt-4">
              <div className="bg-slate-50 rounded-lg p-6 min-h-[500px] flex items-center justify-center">
                <p className="text-slate-500">Visualização de rede em desenvolvimento</p>
              </div>
            </TabsContent>
            
            <TabsContent value="matrix" className="pt-4">
              <div className="bg-slate-50 rounded-lg p-6 min-h-[500px] flex items-center justify-center">
                <p className="text-slate-500">Visualização de matriz em desenvolvimento</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Legenda</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></div>
                <span>Nutracêuticos</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-1 rounded-sm"></div>
                <span>Condições de Saúde</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 mr-1 rounded-sm"></div>
                <span>Efeitos</span>
              </div>
              <div className="flex items-center ml-4">
                <span className="font-medium">Largura da conexão:</span>
                <span className="ml-1">Grau de eficácia/evidência</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelationsTab;
