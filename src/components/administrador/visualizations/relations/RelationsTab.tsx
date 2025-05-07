
import React, { useState, useMemo, useEffect } from 'react';
import RelationsHeader from './RelationsHeader';
import VisualizationCard from './VisualizationCard';
import { prepareNetworkData, prepareMatrixData } from './utils';
import { useSankeyData } from '@/hooks/visualizations/useSankeyData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RelationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [relationView, setRelationView] = useState<string>('sankey');
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  
  const { sankeyData, isLoading, error, refresh } = useSankeyData();
  
  // Filtragem dos dados
  const filteredSankeyData = useMemo(() => {
    if (isLoading || !sankeyData) return { nodes: [], links: [] };
    
    let filteredLinks = [...sankeyData.links];
    
    // Filtro por termo de busca
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      // Encontrar nós que correspondem à pesquisa
      const matchingNodeIndices = sankeyData.nodes
        .map((node, index) => node.name.toLowerCase().includes(lowerSearchTerm) ? index : -1)
        .filter(index => index !== -1);
      
      // Filtrar links que contêm esses nós
      filteredLinks = filteredLinks.filter(link => 
        matchingNodeIndices.includes(link.source) || 
        matchingNodeIndices.includes(link.target)
      );
    }
    
    // Filtro por eficácia
    if (efficacyFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => {
        const efficacyScore = link.value / 20; // Convertendo de volta para escala 0-5
        
        switch(efficacyFilter) {
          case 'high':
            return efficacyScore >= 4;
          case 'medium':
            return efficacyScore >= 3 && efficacyScore < 4;
          case 'low':
            return efficacyScore < 3;
          default:
            return true;
        }
      });
    }
    
    // Filtro por tipo de relacionamento
    if (relationshipFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => 
        link.relationshipType === relationshipFilter
      );
    }
    
    return {
      nodes: sankeyData.nodes,
      links: filteredLinks
    };
  }, [sankeyData, searchTerm, efficacyFilter, relationshipFilter, isLoading]);
  
  // Preparar dados para visualizações
  const networkData = useMemo(() => prepareNetworkData(filteredSankeyData), [filteredSankeyData]);
  const matrixData = useMemo(() => prepareMatrixData(filteredSankeyData), [filteredSankeyData]);
  
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados para visualização. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <RelationsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        relationshipFilter={relationshipFilter}
        onRelationshipFilterChange={setRelationshipFilter}
        isLoading={isLoading}
      />
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : (
        <VisualizationCard 
          efficacyFilter={efficacyFilter}
          onEfficacyFilterChange={setEfficacyFilter}
          relationView={relationView}
          onRelationViewChange={setRelationView}
          networkData={networkData}
          matrixData={matrixData}
          sankeyData={filteredSankeyData}
        />
      )}
    </div>
  );
};

export default RelationsTab;
