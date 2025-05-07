
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SankeyDiagram from '../../SankeyDiagram';
import NetworkGraph from '../../NetworkGraph';
import EfficacyMatrix from '../../EfficacyMatrix';
import { AlertCircle, Loader2 } from 'lucide-react';

interface VisualizationTabsProps {
  relationView: string;
  onRelationViewChange: (value: string) => void;
  networkData: any;
  matrixData: any;
  sankeyData: any;
  isLoading?: boolean;
}

const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  relationView,
  onRelationViewChange,
  networkData,
  matrixData,
  sankeyData,
  isLoading = false
}) => {
  // Verificar se há dados disponíveis
  const hasSankeyData = sankeyData && sankeyData.nodes && sankeyData.nodes.length > 0;
  
  // Mensagem se não houver dados
  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">Sem dados para visualização</h3>
      <p className="text-gray-500 max-w-md">
        Não há dados suficientes para exibir esta visualização. 
        Verifique se existem relações entre nutracêuticos e condições de saúde.
      </p>
    </div>
  );
  
  // Componente de carregamento
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-500">Carregando dados...</p>
    </div>
  );
  
  return (
    <Tabs value={relationView} onValueChange={onRelationViewChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="sankey">Diagrama Sankey</TabsTrigger>
        <TabsTrigger value="network">Rede de Relações</TabsTrigger>
        <TabsTrigger value="matrix">Matriz de Eficácia</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sankey" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : hasSankeyData ? (
          <SankeyDiagram data={sankeyData} height={550} />
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>
      
      <TabsContent value="network" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : networkData && networkData.nodes && networkData.nodes.length > 0 ? (
          <NetworkGraph data={networkData} height="550px" />
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>
      
      <TabsContent value="matrix" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : matrixData && matrixData.nutraceuticos && matrixData.nutraceuticos.length > 0 ? (
          <EfficacyMatrix 
            nutraceuticos={matrixData.nutraceuticos}
            condicoes={matrixData.condicoes}
            data={matrixData.cells}
          />
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default VisualizationTabs;
