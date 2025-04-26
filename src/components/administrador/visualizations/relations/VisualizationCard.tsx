
import React from 'react';
import { Download, Network } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SankeyDiagram from '../SankeyDiagram';
import NetworkGraph from '../NetworkGraph';
import EfficacyMatrix from '../efficacy-matrix/EfficacyMatrix';

interface VisualizationCardProps {
  efficacyFilter: string;
  onEfficacyFilterChange: (value: string) => void;
  relationView: string;
  onRelationViewChange: (value: string) => void;
  networkData: any;
  matrixData: any;
  sankeyData: any;
}

const VisualizationCard: React.FC<VisualizationCardProps> = ({
  efficacyFilter,
  onEfficacyFilterChange,
  relationView,
  onRelationViewChange,
  networkData,
  matrixData,
  sankeyData
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Network className="mr-2 h-5 w-5 text-primary" />
            Mapa de Relações
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={efficacyFilter} onValueChange={onEfficacyFilterChange}>
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
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Visualize como os nutracêuticos se relacionam com diferentes condições de saúde
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="sankey" value={relationView} onValueChange={onRelationViewChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="sankey">Diagrama Sankey</TabsTrigger>
            <TabsTrigger value="network">Rede de Relações</TabsTrigger>
            <TabsTrigger value="matrix">Matriz de Eficácia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sankey" className="pt-4">
            <SankeyDiagram data={sankeyData} height={500} />
          </TabsContent>
          
          <TabsContent value="network" className="pt-4">
            <NetworkGraph data={networkData} height="500px" />
          </TabsContent>
          
          <TabsContent value="matrix" className="pt-4">
            <EfficacyMatrix 
              nutraceuticos={matrixData.nutraceuticos}
              condicoes={matrixData.condicoes}
              data={matrixData.cells}
            />
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
  );
};

export default VisualizationCard;
