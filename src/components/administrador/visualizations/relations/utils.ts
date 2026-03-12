
import { SankeyData } from '../sankey/types';

/**
 * Prepara os dados para visualização em rede
 */
export const prepareNetworkData = (sankeyData: SankeyData) => {
  const { nodes, links } = sankeyData;
  
  if (!nodes || !links || nodes.length === 0) {
    return { nodes: [], links: [] };
  }
  
  // Preparar nós para visualização em rede
  const networkNodes = nodes.map((node, index) => ({
    id: `node_${index}_${node.name}`,
    label: node.name,
    group: node.category,
    type: node.category,
    title: node.description || node.name,
    color: node.color,
    value: 1,
    metadata: ((node as any).metadata || {})
  }));
  
  // Contar conexões por nó
  const nodeConnections = new Map<string, number>();
  links.forEach(link => {
    const sourceName = nodes[link.source]?.name || '';
    const targetName = nodes[link.target]?.name || '';
    
    if (sourceName && targetName) {
      nodeConnections.set(sourceName, (nodeConnections.get(sourceName) || 0) + 1);
      nodeConnections.set(targetName, (nodeConnections.get(targetName) || 0) + 1);
    }
  });
  
  // Ajustar tamanho do nó com base no número de conexões
  networkNodes.forEach(node => {
    const connections = nodeConnections.get(node.label) || 0;
    node.value = Math.max(1, Math.min(5, 1 + connections / 5));
  });
  
  // Preparar links para visualização em rede
  const networkLinks = links.map((link, index) => {
    const sourceName = nodes[link.source]?.name || '';
    const targetName = nodes[link.target]?.name || '';
    
    const sourceNode = networkNodes.find(node => node.label === sourceName);
    const targetNode = networkNodes.find(node => node.label === targetName);
    
    if (!sourceNode || !targetNode) return null;
    
    const width = Math.max(1, Math.min(5, link.value / 20));
    
    return {
      id: `link_${index}`,
      from: sourceNode.id,
      to: targetNode.id,
      value: link.value / 10,
      title: link.description || `${sourceName} → ${targetName}`,
      color: link.color || undefined,
      width,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.5
        }
      },
      dashes: link.relationshipType === 'SYNERGIZES_WITH' || link.relationshipType === 'ANTAGONISM'
    };
  });
  
  const validNetworkLinks = networkLinks.filter(link => Boolean(link));
  
  return {
    nodes: networkNodes,
    links: validNetworkLinks
  };
};

/**
 * Prepara os dados para visualização em matriz
 */
export const prepareMatrixData = (sankeyData: SankeyData) => {
  const { nodes, links } = sankeyData;
  
  if (!nodes || !links || nodes.length === 0) {
    return { nutraceuticos: [], condicoes: [], cells: [] };
  }
  
  // Separar nós por categoria
  const nutraceuticoNodes = nodes.filter(node => 
    node.category === 'nutraceutical' || node.category === 'compound'
  );
  const condicaoNodes = nodes.filter(node => 
    node.category === 'condition' || node.category === 'disease'
  );
  
  const nutraceuticos = nutraceuticoNodes.map((node, index) => ({
    id: index,
    name: node.name,
    description: node.description || '',
    originalId: nodes.indexOf(node)
  }));
  
  const condicoes = condicaoNodes.map((node, index) => ({
    id: index,
    name: node.name,
    description: node.description || '',
    originalId: nodes.indexOf(node)
  }));
  
  // Preparar células de matriz
  const cells = links
    .filter(link => {
      const sourceNode = nodes[link.source];
      const targetNode = nodes[link.target];
      const sourceIsNutra = sourceNode?.category === 'nutraceutical' || sourceNode?.category === 'compound';
      const targetIsCond = targetNode?.category === 'condition' || targetNode?.category === 'disease';
      return sourceIsNutra && targetIsCond;
    })
    .map(link => {
      const nutraceuticoIndex = nutraceuticos.findIndex(n => n.originalId === link.source);
      const condicaoIndex = condicoes.findIndex(c => c.originalId === link.target);
      
      if (nutraceuticoIndex === -1 || condicaoIndex === -1) return null;
      
      const efficacyScore = Math.min(5, Math.max(0, link.value / 20));
      
      return {
        nutraceuticoId: nutraceuticoIndex,
        condicaoId: condicaoIndex,
        efficacyScore,
        relationshipType: link.relationshipType || 'TREATS',
        evidenceLevel: 0,
        studyCount: 0,
        description: link.description || ''
      };
    })
    .filter(Boolean);
  
  return {
    nutraceuticos,
    condicoes,
    cells
  };
};
