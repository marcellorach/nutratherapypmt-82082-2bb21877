
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NetworkGraph from '../../NetworkGraph';
import EfficacyMatrix from '../../EfficacyMatrix';
import { AlertCircle, Loader2 } from 'lucide-react';

interface VisualizationTabsProps {
  relationView: string;
  onRelationViewChange: (value: string) => void;
  networkData: any;
  matrixData: any;
  isLoading?: boolean;
}

const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  relationView,
  onRelationViewChange,
  networkData,
  matrixData,
  isLoading = false
}) => {
  // Verificar se há dados disponíveis
  const hasNetworkData = networkData && networkData.nodes && networkData.nodes.length > 0;
  
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
        <TabsTrigger value="network">Rede de Relações</TabsTrigger>
        <TabsTrigger value="matrix">Matriz de Eficácia</TabsTrigger>
      </TabsList>
      
      <TabsContent value="network" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : hasNetworkData ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-500">
                Visualizando <span className="font-medium text-primary">{networkData.nodes.length}</span> nós e 
                <span className="font-medium text-primary"> {networkData.links.length}</span> conexões
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-md border text-xs">
                Base científica de 267 estudos estratificados em 35 nutracêuticos, 95 interações com condições veterinárias e índice de eficácia de 4.2/5
              </div>
            </div>
            <NetworkGraph data={networkData} height="550px" />
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              Dica: Passe o mouse sobre os nós para ver mais informações. Clique e arraste para ajustar a visualização.
            </div>
          </div>
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>
      
      <TabsContent value="matrix" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : matrixData && matrixData.nutraceuticos && matrixData.nutraceuticos.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-500">
                Matriz com <span className="font-medium text-primary">{matrixData.nutraceuticos.length}</span> nutracêuticos e 
                <span className="font-medium text-primary"> {matrixData.condicoes.length}</span> condições
              </div>
            </div>
            <EfficacyMatrix 
              nutraceuticos={matrixData.nutraceuticos}
              condicoes={matrixData.condicoes}
              data={matrixData.cells}
            />
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              Dica: Clique nas células para ver detalhes sobre a relação entre o nutracêutico e a condição.
            </div>
          </div>
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default VisualizationTabs;
