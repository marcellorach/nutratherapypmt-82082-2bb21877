
import { useMemo } from 'react';
import { 
  EnhancedSankeyData,
  EnhancedSankeyNode, 
  SankeyData,
  SankeyLink
} from '../../sankey/types';

export function useSankeyData(
  inputData: EnhancedSankeyData | null
): SankeyData {
  return useMemo(() => {
    if (!inputData || !inputData.nodes || !inputData.links) {
      return { nodes: [], links: [] };
    }

    // Criar mapa de IDs de nós para índices
    const nodeMap = new Map<string | number, number>();
    inputData.nodes.forEach((node, index) => {
      nodeMap.set(node.id !== undefined ? node.id : index, index);
    });

    // Criar nós compatíveis com SankeyNode
    const nodes = inputData.nodes.map((node, index) => ({
      name: node.name,
      category: node.category,
      value: node.value || 1,
      color: node.color,
      description: node.description || '',
      originalNode: node
    }));

    // Converter links para garantir compatibilidade
    const links: SankeyLink[] = inputData.links.map(link => {
      // Garantir que source e target sejam números
      const sourceIndex = typeof link.source === 'string' || typeof link.source === 'number'
        ? nodeMap.get(link.source) || 0
        : 0;
      
      const targetIndex = typeof link.target === 'string' || typeof link.target === 'number'
        ? nodeMap.get(link.target) || 0
        : 0;
      
      const sourceName = link.sourceName || String(link.source);
      const targetName = link.targetName || String(link.target);
        
      return {
        source: sourceIndex,
        target: targetIndex,
        value: link.value || 1,
        color: link.color,
        sourceName,
        targetName,
        originalLink: link
      };
    });
    
    return { nodes, links };
  }, [inputData]);
}
