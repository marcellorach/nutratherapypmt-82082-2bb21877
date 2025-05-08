
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
  // Hooks for data loading
  const { data, isLoading, error } = useEnhancedSankeyData(initialData);
  
  // State for filters
  const [activeCategories, setActiveCategories] = useState<NodeCategory[]>([
    'nutraceutico', 'condicao', 'outcome', 'severidade'
  ]);
  const [minEfficacy, setMinEfficacy] = useState(0); // 0-100 scale
  const [relationshipType, setRelationshipType] = useState<string>("all");
  
  // State for dialog
  const [selectedLink, setSelectedLink] = useState<EnhancedSankeyLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<EnhancedSankeyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use the custom hook for visualization
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
  
  // Handle link click
  const handleLinkClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalLink = e.payload.originalLink || e.payload;
      setSelectedLink(originalLink);
      setSelectedNode(null);
      setDialogOpen(true);
    }
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalNode = e.payload.originalNode || e.payload;
      setSelectedNode(originalNode);
      setSelectedLink(null);
      setDialogOpen(true);
    }
  }, []);

  // Simplificar a conversão de dados para evitar problemas de tipo
  const convertToSankeyData = (data: any): SankeyData => {
    if (!data || !data.nodes || !data.links) {
      return { nodes: [], links: [] };
    }

    // Garantir que os nós tenham o formato esperado
    const nodes: SankeyNode[] = data.nodes.map((node: any, index: number) => ({
      name: node.name,
      category: node.category,
      value: node.value,
      color: node.color,
      description: node.description || '',
      id: node.id || index,
      originalNode: node
    }));

    // Converter os links para garantir que source e target sejam números
    const links: SankeyLink[] = data.links.map((link: any, index: number) => {
      return {
        source: typeof link.source === 'number' ? link.source : 0,
        target: typeof link.target === 'number' ? link.target : 0,
        value: link.value || 10,
        color: link.color,
        labelText: link.labelText,
        studyCount: link.studyCount,
        evidenceLevel: link.evidenceLevel,
        description: link.description,
        relationshipType: link.relationshipType,
        originalRelation: link,
        sourceName: link.sourceName || 'Fonte',
        targetName: link.targetName || 'Destino'
      };
    });

    return { nodes, links };
  };

  const sankeyCompatibleData = finalData ? convertToSankeyData(finalData) : { nodes: [], links: [] };
  
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
          linkCount={sankeyCompatibleData.links.length} 
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
        data={sankeyCompatibleData}
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
