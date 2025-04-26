
import React, { useState, useMemo } from 'react';
import RelationsHeader from './RelationsHeader';
import VisualizationCard from './VisualizationCard';
import { prepareNetworkData, prepareMatrixData } from './utils';

// Exemplo de dados carregados do arquivo original
import { exampleSankeyData } from './data';

const RelationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [relationView, setRelationView] = useState<string>('sankey');
  
  // Preparar dados para visualizações com useMemo para melhorar performance
  const networkData = useMemo(() => prepareNetworkData(exampleSankeyData), []);
  const matrixData = useMemo(() => prepareMatrixData(exampleSankeyData), []);
  
  return (
    <div className="space-y-6">
      <RelationsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <VisualizationCard 
        efficacyFilter={efficacyFilter}
        onEfficacyFilterChange={setEfficacyFilter}
        relationView={relationView}
        onRelationViewChange={setRelationView}
        networkData={networkData}
        matrixData={matrixData}
        sankeyData={exampleSankeyData}
      />
    </div>
  );
};

export default RelationsTab;
