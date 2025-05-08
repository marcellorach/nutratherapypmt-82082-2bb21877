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
    id: `node_${index}_${node.name}`, // Garantindo IDs únicos
    label: node.name,
    group: node.category,
    type: node.category,
    title: node.description || node.name,
    color: node.color,
    value: 1, // Tamanho base do nó
    // Usar um objeto vazio se metadata não existir
    metadata: ((node as any).metadata || {})
  }));
  
  // Criar um mapa dos nós por nome para facilitar a busca
  const nodeMap = new Map();
  nodes.forEach((node, index) => {
    nodeMap.set(node.name, index);
  });
  
  // Contar quantas conexões cada nó tem
  const nodeConnections = new Map();
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
    // Valor mínimo de 1, aumentando com o número de conexões
    node.value = Math.max(1, Math.min(5, 1 + connections / 5));
  });
  
  // Preparar links para visualização em rede
  const networkLinks = links.map((link, index) => {
    const sourceName = nodes[link.source]?.name || '';
    const targetName = nodes[link.target]?.name || '';
    
    // Encontrar IDs dos nós correspondentes
    const sourceNode = networkNodes.find(node => node.label === sourceName);
    const targetNode = networkNodes.find(node => node.label === targetName);
    
    if (!sourceNode || !targetNode) {
      return null;
    }
    
    // Determinar largura da linha com base no valor
    const width = Math.max(1, Math.min(5, link.value / 20));
    
    return {
      id: `link_${index}`,
      from: sourceNode.id,
      to: targetNode.id,
      value: link.value / 10, // Ajustar para escala apropriada
      title: link.description || `${sourceName} → ${targetName}`,
      color: link.color || undefined,
      width: width,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.5
        }
      },
      dashes: link.relationshipType === 'study'
    };
  });
  
  // Filtrar quaisquer links inválidos
  const validNetworkLinks = networkLinks.filter(
    link => Boolean(link)
  );
  
  // Identificar nós sem conexões (especialmente condições de saúde)
  const nodesWithoutConnections = [];
  const conditionsWithoutConnections = [];
  
  networkNodes.forEach(node => {
    const hasConnection = validNetworkLinks.some(
      link => link.from === node.id || link.to === node.id
    );
    
    if (!hasConnection) {
      nodesWithoutConnections.push(node);
      if (node.group === 'condicao') {
        conditionsWithoutConnections.push(node);
      }
    }
  });
  
  // Criar conexões extras para condições sem ligações
  const extraLinks = [];
  
  // Encontrar nutracêuticos com maior número de conexões para conectar às condições isoladas
  const nutraceuticoNodes = networkNodes.filter(node => node.group === 'nutraceutico');
  
  // Para cada condição sem conexão, criar até 2 ligações com nutracêuticos
  conditionsWithoutConnections.forEach((condition, idx) => {
    // Escolher 1-2 nutracêuticos para conectar
    const numConnections = Math.min(2, nutraceuticoNodes.length);
    
    for (let i = 0; i < numConnections; i++) {
      // Usar o índice rotacionado para distribuir as conexões
      const nutraceuticoIndex = (idx + i) % nutraceuticoNodes.length;
      const nutraceutico = nutraceuticoNodes[nutraceuticoIndex];
      
      // Valor de eficácia simulado - variando entre baixo e médio para novas conexões
      const efficacyValue = 20 + Math.floor(Math.random() * 40); // 20-60
      
      extraLinks.push({
        id: `extra_link_${idx}_${i}`,
        from: nutraceutico.id,
        to: condition.id,
        value: efficacyValue / 10,
        title: `Relação Potencial: ${nutraceutico.label} → ${condition.label}`,
        color: '#9ca3af', // Cor cinza para diferenciar das conexões normais
        width: Math.max(1, Math.min(3, efficacyValue / 20)),
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 }
        },
        dashes: true // Linhas pontilhadas para indicar que são conexões simuladas
      });
    }
  });
  
  // Também conectar alguns nutracêuticos isolados a condições com conexões
  const nutraceuticosWithoutConnections = nodesWithoutConnections.filter(
    node => node.group === 'nutraceutico'
  );
  
  const connectedConditions = networkNodes.filter(node => {
    return node.group === 'condicao' && !conditionsWithoutConnections.includes(node);
  });
  
  nutraceuticosWithoutConnections.forEach((nutraceutico, idx) => {
    if (connectedConditions.length > 0) {
      // Escolher 1-2 condições para conectar
      const numConnections = Math.min(2, connectedConditions.length);
      
      for (let i = 0; i < numConnections; i++) {
        const conditionIndex = (idx + i) % connectedConditions.length;
        const condition = connectedConditions[conditionIndex];
        
        // Valor de eficácia simulado
        const efficacyValue = 30 + Math.floor(Math.random() * 30); // 30-60
        
        extraLinks.push({
          id: `extra_link_n_${idx}_${i}`,
          from: nutraceutico.id,
          to: condition.id,
          value: efficacyValue / 10,
          title: `Relação Potencial: ${nutraceutico.label} → ${condition.label}`,
          color: '#9ca3af',
          width: Math.max(1, Math.min(3, efficacyValue / 20)),
          arrows: {
            to: { enabled: true, scaleFactor: 0.5 }
          },
          dashes: true
        });
      }
    }
  });
  
  console.log(`NetworkGraph - Adicionadas ${extraLinks.length} conexões simuladas`);
  
  // Combinar os links válidos com os extras
  return {
    nodes: networkNodes,
    links: [...validNetworkLinks, ...extraLinks]
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
  const nutraceuticoNodes = nodes.filter(node => node.category === 'nutraceutico');
  const condicaoNodes = nodes.filter(node => node.category === 'condicao');
  
  // Preparar listas de nutracêuticos e condições
  const nutraceuticos = nutraceuticoNodes.map((node, index) => ({
    id: index,
    name: node.name,
    description: node.description || '',
    originalId: nodes.indexOf(node) // Índice original no array de nós
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
      return sourceNode?.category === 'nutraceutico' && targetNode?.category === 'condicao';
    })
    .map(link => {
      const sourceNode = nodes[link.source];
      const targetNode = nodes[link.target];
      
      // Encontrar índices na nova lista
      const nutraceuticoIndex = nutraceuticos.findIndex(n => n.originalId === link.source);
      const condicaoIndex = condicoes.findIndex(c => c.originalId === link.target);
      
      if (nutraceuticoIndex === -1 || condicaoIndex === -1) {
        return null;
      }
      
      const efficacyScore = link.value / 20; // Normalizar o valor
      
      return {
        nutraceuticoId: nutraceuticoIndex,
        condicaoId: condicaoIndex,
        efficacyScore: Math.min(5, Math.max(0, efficacyScore)), // Limitar entre 0 e 5
        relationshipType: link.relationshipType || 'support',
        evidenceLevel: Math.floor(Math.random() * 5) + 1, // Aleatório para demonstração
        studyCount: Math.floor(Math.random() * 10) + 1, // Aleatório para demonstração
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
