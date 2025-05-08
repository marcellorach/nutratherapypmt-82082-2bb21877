
import { useState, useMemo } from 'react';
import { 
  EnhancedSankeyData, 
  EnhancedSankeyNode,
  EnhancedSankeyLink, 
  NodeCategory 
} from '@/components/administrador/visualizations/sankey/types';
import { filterValidLinks, convertLinksToNumericIndices } from '@/utils/graph-utils';

export const useEnhancedSankeyVisualization = (
  data: EnhancedSankeyData | null,
  isLoading: boolean,
  activeCategories: NodeCategory[] = ['nutraceutico', 'condicao', 'outcome', 'severidade'],
  minEfficacy: number = 0,
  relationshipType: string = 'all'
) => {
  // Local state
  const [scale, setScale] = useState(1);
  
  // Process and filter data based on selected categories and filters
  const processedData = useMemo(() => {
    if (isLoading || !data) {
      return { nodes: [], links: [] };
    }
    
    // Filter nodes by selected categories
    const filteredNodes = data.nodes.filter(node => 
      activeCategories.includes(node.category as NodeCategory)
    );
    
    // Create a map of valid node IDs for quick lookup
    const nodeIdsMap = new Map<string | number, boolean>();
    filteredNodes.forEach(node => {
      nodeIdsMap.set(node.id, true);
    });
    
    // Filter links that connect to selected node categories and meet efficacy threshold
    let filteredLinks = filterValidLinks(data.links, nodeIdsMap)
      .filter(link => link.value >= minEfficacy);
    
    // Filter by relationship type if specified
    if (relationshipType !== "all") {
      filteredLinks = filteredLinks.filter(link => 
        link.relationshipType === relationshipType
      );
    }
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [data, isLoading, activeCategories, minEfficacy, relationshipType]);
  
  // Format data for Recharts
  const formatDataForRecharts = useMemo(() => {
    if (!processedData.nodes.length || !processedData.links.length) {
      return { nodes: [], links: [] };
    }
    
    // Create a map of node IDs to array indices
    const nodeIndexMap = new Map<string | number, number>();
    
    // Create nodes array for Recharts with array indices
    const nodes = processedData.nodes.map((node, index) => {
      nodeIndexMap.set(node.id, index);
      
      return {
        name: node.name,
        category: node.category,
        value: node.value,
        color: node.color,
        description: node.description,
        id: node.id, // Mantendo o ID original para referência
        // Store original node data for reference
        originalNode: node
      };
    });
    
    // Create links array for Recharts with numeric indices
    const links = convertLinksToNumericIndices(processedData.links, nodeIndexMap);
    
    return { 
      nodes, 
      links: links.filter(Boolean) // Garantir que não temos links nulos
    };
  }, [processedData]);

  // Calculate stats for display
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    activeCategories.forEach(category => {
      stats[category] = processedData.nodes.filter(node => node.category === category).length;
    });
    return stats;
  }, [processedData, activeCategories]);
  
  // Generate demo data if needed
  const getDemoData = () => {
    return {
      nodes: [
        // Nutracêuticos
        { name: 'Glucosamina', category: 'nutraceutico', value: 30, color: '#3b82f6', id: 0 },
        { name: 'Curcumina', category: 'nutraceutico', value: 30, color: '#3b82f6', id: 1 },
        { name: 'Ômega 3', category: 'nutraceutico', value: 30, color: '#3b82f6', id: 2 },
        
        // Condições
        { name: 'Artrite', category: 'condicao', value: 25, color: '#10b981', id: 3 },
        { name: 'Inflamação', category: 'condicao', value: 25, color: '#10b981', id: 4 },
        { name: 'Saúde Cardíaca', category: 'condicao', value: 25, color: '#10b981', id: 5 },
        
        // Outcomes
        { name: 'Redução de Dor', category: 'outcome', value: 20, color: '#f59e0b', id: 6 },
        { name: 'Mobilidade Melhorada', category: 'outcome', value: 20, color: '#f59e0b', id: 7 },
        { name: 'Função Cardíaca Melhorada', category: 'outcome', value: 20, color: '#f59e0b', id: 8 },
        
        // Severidade
        { name: 'Leve', category: 'severidade', value: 15, color: '#8b5cf6', id: 9 },
        { name: 'Moderada', category: 'severidade', value: 15, color: '#8b5cf6', id: 10 },
        { name: 'Grave', category: 'severidade', value: 15, color: '#8b5cf6', id: 11 }
      ],
      links: [
        // Nutracêuticos -> Condições
        { source: 0, target: 3, value: 80, color: 'rgba(16, 185, 129, 0.7)', 
          relationshipType: 'treatment', efficacyScore: 4.0 },
        { source: 1, target: 4, value: 90, color: 'rgba(16, 185, 129, 0.7)', 
          relationshipType: 'prevention', efficacyScore: 4.5 },
        { source: 2, target: 5, value: 60, color: 'rgba(59, 130, 246, 0.7)', 
          relationshipType: 'support', efficacyScore: 3.0 },
        
        // Condições -> Outcomes
        { source: 3, target: 6, value: 75, color: 'rgba(245, 158, 11, 0.7)' },
        { source: 3, target: 7, value: 65, color: 'rgba(59, 130, 246, 0.7)' },
        { source: 4, target: 6, value: 80, color: 'rgba(16, 185, 129, 0.7)' },
        { source: 5, target: 8, value: 70, color: 'rgba(59, 130, 246, 0.7)' },
        
        // Outcomes -> Severidade
        { source: 6, target: 9, value: 40, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 6, target: 10, value: 35, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 7, target: 10, value: 45, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 8, target: 11, value: 50, color: 'rgba(139, 92, 246, 0.7)' }
      ]
    };
  };

  // Use demo data if no data or links are available
  const demoData = getDemoData();
  const finalData = (!formatDataForRecharts.nodes.length || !formatDataForRecharts.links.length) 
    ? demoData 
    : formatDataForRecharts;

  // Zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  return {
    processedData,
    finalData,
    categoryStats,
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom
  };
};

export default useEnhancedSankeyVisualization;
