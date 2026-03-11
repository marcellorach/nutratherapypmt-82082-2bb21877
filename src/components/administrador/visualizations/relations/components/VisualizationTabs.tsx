
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NetworkGraph from '../../NetworkGraph';
import EfficacyMatrix from '../../EfficacyMatrix';
import { AlertCircle, Loader2, Search } from 'lucide-react';

const RelationsAuditorChat = lazy(() => import('@/components/administrador/relations/RelationsAuditorChat'));

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
  const { t } = useTranslation();
  
  // Verificar se há dados disponíveis
  const hasNetworkData = networkData && networkData.nodes && networkData.nodes.length > 0;
  
  // Mensagem se não houver dados
  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">{t('relations.noData.title')}</h3>
      <p className="text-gray-500 max-w-md">
        {t('relations.noData.description')}
      </p>
    </div>
  );
  
  // Componente de carregamento
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-500">{t('relations.loading')}</p>
    </div>
  );
  
  return (
    <Tabs value={relationView} onValueChange={onRelationViewChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="network">{t('relations.tabs.network')}</TabsTrigger>
        <TabsTrigger value="matrix">{t('relations.tabs.matrix')}</TabsTrigger>
        <TabsTrigger value="auditor" className="flex items-center gap-1">
          <Search className="h-3 w-3" />
          {t('relations.tabs.auditor')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="network" className="pt-4">
        {isLoading ? (
          <LoadingState />
        ) : hasNetworkData ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-500">
                {t('relations.network.viewing')} <span className="font-medium text-primary">{networkData.nodes.length}</span> {t('relations.network.nodes')} 
                <span className="font-medium text-primary"> {networkData.links.length}</span> {t('relations.network.connections')}
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-md border text-xs">
                {t('relations.network.scientificBase')}
              </div>
            </div>
            <NetworkGraph data={networkData} height="550px" />
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              {t('relations.network.tip')}
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
                {t('relations.matrix.matrixWith')} <span className="font-medium text-primary">{matrixData.nutraceuticos.length}</span> {t('relations.matrix.nutraceuticals')} 
                <span className="font-medium text-primary"> {matrixData.condicoes.length}</span> {t('relations.matrix.conditions')}
              </div>
            </div>
            <EfficacyMatrix 
              nutraceuticos={matrixData.nutraceuticos}
              condicoes={matrixData.condicoes}
              data={matrixData.cells}
            />
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              {t('relations.matrix.tip')}
            </div>
          </div>
        ) : (
          <NoDataMessage />
        )}
      </TabsContent>

      <TabsContent value="auditor" className="pt-4">
        <Suspense fallback={<LoadingState />}>
          <RelationsAuditorChat />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
};

export default VisualizationTabs;
