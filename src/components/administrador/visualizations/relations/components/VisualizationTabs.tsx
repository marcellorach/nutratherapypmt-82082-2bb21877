
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SankeyDiagram from '../../SankeyDiagram';
import NetworkGraph from '../../NetworkGraph';
import EfficacyMatrix from '../../efficacy-matrix/EfficacyMatrix';

interface VisualizationTabsProps {
  relationView: string;
  onRelationViewChange: (value: string) => void;
  networkData: any;
  matrixData: any;
  sankeyData: any;
}

const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  relationView,
  onRelationViewChange,
  networkData,
  matrixData,
  sankeyData
}) => {
  return (
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
  );
};

export default VisualizationTabs;
