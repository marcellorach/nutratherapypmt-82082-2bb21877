
/**
 * Função para garantir que os nós tenham IDs únicos
 * @param nodes Array de nós para verificar e corrigir IDs
 * @returns Array com nós contendo IDs únicos
 */
export const ensureUniqueNodeIds = (nodes: any[]): any[] => {
  const idMap = new Map();
  const result = [];
  
  for (const node of nodes) {
    let nodeId = node.id;
    
    // Se o nó tiver um ID que já existe, criamos um novo ID único
    if (idMap.has(nodeId) || nodeId === undefined) {
      // Se o nó tiver uma propriedade label, usamos como base para o novo ID
      const baseId = node.label || node.name || 'node';
      let uniqueId = baseId;
      let counter = 1;
      
      // Incrementamos um contador até encontrar um ID único
      while (idMap.has(uniqueId)) {
        uniqueId = `${baseId}_${counter}`;
        counter++;
      }
      
      // Criamos um novo objeto para evitar mutações
      const newNode = { ...node, id: uniqueId };
      result.push(newNode);
      idMap.set(uniqueId, true);
    } else {
      // Se o ID for único, adicionamos ao mapa e ao resultado
      result.push(node);
      idMap.set(nodeId, true);
    }
  }
  
  return result;
};

/**
 * Função para extrair IDs de links válidos
 * @param links Array de links para processar
 * @param nodeIds Mapa de IDs de nós válidos
 * @returns Links filtrados que têm nós válidos como origem e destino
 */
export const filterValidLinks = (links: any[], nodeIds: Map<string | number, boolean>): any[] => {
  return links.filter(link => {
    const sourceId = link.from || link.source;
    const targetId = link.to || link.target;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });
};
