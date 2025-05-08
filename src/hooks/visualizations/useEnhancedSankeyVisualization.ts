
import { useState, useMemo } from 'react';
import { 
  EnhancedSankeyData, 
  EnhancedSankeyNode,
  EnhancedSankeyLink, 
  NodeCategory 
} from '@/components/administrador/visualizations/sankey/types';
import { filterValidLinks } from '@/utils/graph-utils';

export const useEnhancedSankeyVisualization = (
  data: EnhancedSankeyData | null,
  isLoading: boolean,
  activeCategories: NodeCategory[] = ['nutraceutico', 'condicao', 'outcome', 'severidade'],
  minEfficacy: number = 0,
  relationshipType: string = 'all'
) => {
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
          relationshipType: 'treatment', efficacyScore: 4.0, sourceName: 'Glucosamina', targetName: 'Artrite' },
        { source: 1, target: 4, value: 90, color: 'rgba(16, 185, 129, 0.7)', 
          relationshipType: 'prevention', efficacyScore: 4.5, sourceName: 'Curcumina', targetName: 'Inflamação' },
        { source: 2, target: 5, value: 60, color: 'rgba(59, 130, 246, 0.7)', 
          relationshipType: 'support', efficacyScore: 3.0, sourceName: 'Ômega 3', targetName: 'Saúde Cardíaca' },
        
        // Condições -> Outcomes
        { source: 3, target: 6, value: 75, color: 'rgba(245, 158, 11, 0.7)', 
          sourceName: 'Artrite', targetName: 'Redução de Dor' },
        { source: 3, target: 7, value: 65, color: 'rgba(59, 130, 246, 0.7)', 
          sourceName: 'Artrite', targetName: 'Mobilidade Melhorada' },
        { source: 4, target: 6, value: 80, color: 'rgba(16, 185, 129, 0.7)', 
          sourceName: 'Inflamação', targetName: 'Redução de Dor' },
        { source: 5, target: 8, value: 70, color: 'rgba(59, 130, 246, 0.7)', 
          sourceName: 'Saúde Cardíaca', targetName: 'Função Cardíaca Melhorada' },
        
        // Outcomes -> Severidade
        { source: 6, target: 9, value: 40, color: 'rgba(139, 92, 246, 0.7)', 
          sourceName: 'Redução de Dor', targetName: 'Leve' },
        { source: 6, target: 10, value: 35, color: 'rgba(139, 92, 246, 0.7)', 
          sourceName: 'Redução de Dor', targetName: 'Moderada' },
        { source: 7, target: 10, value: 45, color: 'rgba(139, 92, 246, 0.7)', 
          sourceName: 'Mobilidade Melhorada', targetName: 'Moderada' },
        { source: 8, target: 11, value: 50, color: 'rgba(139, 92, 246, 0.7)', 
          sourceName: 'Função Cardíaca Melhorada', targetName: 'Grave' }
      ]
    };
  };

  // Use demo data if no data or links are available
  const demoData = getDemoData();
  const finalData = (!processedData.nodes.length || !processedData.links.length) 
    ? demoData 
    : processedData;

  return {
    processedData,
    finalData,
    categoryStats
  };
};

export default useEnhancedSankeyVisualization;
