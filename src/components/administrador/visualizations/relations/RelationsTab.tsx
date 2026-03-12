
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RelationsHeader from './RelationsHeader';
import VisualizationCard from './VisualizationCard';
import { prepareNetworkData, prepareMatrixData } from './utils';
import { useSankeyData } from '@/hooks/visualizations/useSankeyData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RelationsTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [relationView, setRelationView] = useState<string>('network');
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  
  const { sankeyData, isLoading, error, refresh, relationshipTypes, entityTypes } = useSankeyData();
  
  // Filtragem dos dados
  const filteredSankeyData = useMemo(() => {
    if (isLoading || !sankeyData) return { nodes: [], links: [] };
    
    let filteredLinks = [...sankeyData.links];
    
    // Filtro por termo de busca
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchingNodeIndices = sankeyData.nodes
        .map((node, index) => node.name.toLowerCase().includes(lowerSearchTerm) ? index : -1)
        .filter(index => index !== -1);
      
      filteredLinks = filteredLinks.filter(link => 
        matchingNodeIndices.includes(link.source) || 
        matchingNodeIndices.includes(link.target)
      );
    }
    
    // Filtro por tipo de relacionamento
    if (relationshipFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => 
        link.relationshipType === relationshipFilter
      );
    }

    // Filtro por tipo de entidade
    if (entityTypeFilter !== 'all') {
      const lowerFilter = entityTypeFilter.toLowerCase();
      const matchingNodeIndices = sankeyData.nodes
        .map((node, index) => node.category === lowerFilter ? index : -1)
        .filter(index => index !== -1);
      
      filteredLinks = filteredLinks.filter(link =>
        matchingNodeIndices.includes(link.source) ||
        matchingNodeIndices.includes(link.target)
      );
    }
    
    // Filtro por eficácia/confiança
    if (efficacyFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => {
        const score = link.value;
        switch(efficacyFilter) {
          case 'high': return score >= 60;
          case 'medium': return score >= 20 && score < 60;
          case 'low': return score < 20;
          default: return true;
        }
      });
    }
    
    return {
      nodes: sankeyData.nodes,
      links: filteredLinks
    };
  }, [sankeyData, searchTerm, efficacyFilter, relationshipFilter, entityTypeFilter, isLoading]);
  
  const networkData = useMemo(() => prepareNetworkData(filteredSankeyData), [filteredSankeyData]);
  const matrixData = useMemo(() => prepareMatrixData(filteredSankeyData), [filteredSankeyData]);
  
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('relations.error.title')}</AlertTitle>
          <AlertDescription>
            {t('relations.error.description')}
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
        entityTypeFilter={entityTypeFilter}
        onEntityTypeFilterChange={setEntityTypeFilter}
        relationshipTypes={relationshipTypes}
        entityTypes={entityTypes}
        isLoading={isLoading}
        onRefresh={refresh}
        nodeCount={filteredSankeyData.nodes.length}
        linkCount={filteredSankeyData.links.length}
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
        />
      )}
    </div>
  );
};

export default RelationsTab;
