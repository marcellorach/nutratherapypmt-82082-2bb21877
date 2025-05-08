
import { useMemo } from 'react';
import { 
  EnhancedSankeyData,
  EnhancedSankeyNode, 
  EnhancedSankeyLink,
  SankeyData,
  SankeyLink
} from '../../sankey/types';
import { convertLinksToNumericIndices } from '@/utils/graph-utils';

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

    // Converter links para garantir que source e target são números
    const links = convertLinksToNumericIndices(inputData.links, nodeMap);
    
    return { nodes, links };
  }, [inputData]);
}
