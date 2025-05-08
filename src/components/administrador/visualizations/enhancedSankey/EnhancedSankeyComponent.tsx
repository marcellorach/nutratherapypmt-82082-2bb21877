
import React, { useState, useCallback } from 'react';
import { 
  EnhancedSankeyData, 
  EnhancedSankeyLink, 
  EnhancedSankeyNode, 
  NodeCategory,
  SankeyData,
  SankeyLink,
  SankeyNode 
} from '../sankey/types';

import SankeyChart from './SankeyChart';
import SankeyControls from './SankeyControls';
import SankeyStats from './SankeyStats';
import SankeyInfo from './SankeyInfo';
import SankeyDetailsDialog from '../sankey/SankeyDetailsDialog';
import SankeyLegend from '../sankey/SankeyLegend';
import SankeyFilters from '../sankey/SankeyFilters';
import useEnhancedSankeyVisualization from '@/hooks/visualizations/useEnhancedSankeyVisualization';
import { useEnhancedSankeyData } from '@/hooks/visualizations/useEnhancedSankeyData';
import { convertLinksToNumericIndices } from '@/utils/graph-utils';

interface EnhancedSankeyComponentProps {
  initialData?: EnhancedSankeyData;
  height?: number;
  showControls?: boolean;
  showFilters?: boolean;
  showLegend?: boolean;
}

const EnhancedSankeyComponent: React.FC<EnhancedSankeyComponentProps> = ({
  initialData,
  height = 500,
  showControls = true,
  showFilters = true,
  showLegend = true
}) => {
  // Hooks para carregamento de dados
  const { data, isLoading, error } = useEnhancedSankeyData(initialData);
  
  // Estado para filtros
  const [activeCategories, setActiveCategories] = useState<NodeCategory[]>([
    'nutraceutico', 'condicao', 'outcome', 'severidade'
  ]);
  const [minEfficacy, setMinEfficacy] = useState(0); // escala 0-100
  const [relationshipType, setRelationshipType] = useState<string>("all");
  
  // Estado para diálogo
  const [selectedLink, setSelectedLink] = useState<EnhancedSankeyLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<EnhancedSankeyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Usar o hook customizado para visualização
  const { 
    finalData, 
    categoryStats, 
    scale, 
    handleZoomIn, 
    handleZoomOut, 
    handleResetZoom
  } = useEnhancedSankeyVisualization(
    data, 
    isLoading, 
    activeCategories, 
    minEfficacy, 
    relationshipType
  );
  
  // Tratamento de clique em link
  const handleLinkClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalLink = e.payload.originalLink || e.payload;
      setSelectedLink(originalLink);
      setSelectedNode(null);
      setDialogOpen(true);
    }
  }, []);
  
  // Tratamento de clique em nó
  const handleNodeClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalNode = e.payload.originalNode || e.payload;
      setSelectedNode(originalNode);
      setSelectedLink(null);
      setDialogOpen(true);
    }
  }, []);

  // Preparar dados para o Sankey
  const prepareSankeyData = (inputData: EnhancedSankeyData | null): SankeyData => {
    if (!inputData || !inputData.nodes || !inputData.links) {
      return { nodes: [], links: [] };
    }

    // Criar mapa de IDs de nós para índices
    const nodeMap = new Map<string | number, number>();
    inputData.nodes.forEach((node, index) => {
      nodeMap.set(node.id !== undefined ? node.id : index, index);
    });

    // Criar nós compatíveis com SankeyNode
    const nodes: SankeyNode[] = inputData.nodes.map((node, index) => ({
      name: node.name,
      category: node.category,
      value: node.value || 1,
      color: node.color,
      description: node.description || '',
      originalNode: node
    }));

    // Converter links para garantir compatibilidade
    const convertedLinks = convertLinksToNumericIndices(inputData.links, nodeMap);
    
    // Garantir que todos os links tenham source e target como números
    const links: SankeyLink[] = convertedLinks.map(link => {
      // Garantir que source e target são sempre números
      const source: number = typeof link.source === 'number' ? link.source : 
                             typeof link.source === 'string' ? parseInt(link.source) || 0 : 0;
      const target: number = typeof link.target === 'number' ? link.target : 
                             typeof link.target === 'string' ? parseInt(link.target) || 0 : 0;
      
      return {
        ...link,
        source,  // Agora garantido como number
        target,  // Agora garantido como number
        value: link.value
      };
    });

    return { nodes, links };
  };

  // Dados já compatíveis com o componente Sankey
  const sankeyData = finalData ? prepareSankeyData(finalData) : { nodes: [], links: [] };
  
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Carregando dados de visualização...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showFilters && (
        <SankeyFilters 
          activeCategories={activeCategories}
          setActiveCategories={setActiveCategories}
          minEfficacy={minEfficacy}
          setMinEfficacy={setMinEfficacy}
          relationshipType={relationshipType}
          setRelationshipType={setRelationshipType}
        />
      )}
      
      <div className="flex items-center justify-between mb-2">
        <SankeyStats 
          stats={categoryStats} 
          linkCount={sankeyData.links.length} 
        />
        
        {showControls && (
          <SankeyControls
            scale={scale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
          />
        )}
      </div>
      
      <SankeyChart 
        data={sankeyData}
        height={height}
        scale={scale}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
      />

      {showLegend && <SankeyLegend />}

      <SankeyInfo scale={scale} />

      <SankeyDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        selectedLink={selectedLink}
        selectedNode={selectedNode} 
      />
    </div>
  );
};

export default EnhancedSankeyComponent;
