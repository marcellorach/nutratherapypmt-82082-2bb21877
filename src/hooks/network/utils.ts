
import { NetworkGraphOptions, NetworkNode } from './types';

/**
 * Função para garantir que os nós tenham IDs únicos
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
 * Função para contar nós isolados (sem conexões)
 */
export const countIsolatedNodes = (nodes: any[], edges: any[]) => {
  if (!nodes || !edges) return 0;
  
  let isolatedCount = 0;
  
  nodes.forEach(node => {
    const connections = edges.filter(
      edge => edge.from === node.id || edge.to === node.id
    );
    
    if (connections.length === 0) {
      isolatedCount++;
    }
  });
  
  return isolatedCount;
};

/**
 * Função auxiliar para mesclar opções
 */
export const mergeOptions = (defaultOpts: any, customOpts: any): any => {
  const result = { ...defaultOpts };
  
  // Mesclar recursivamente as opções
  for (const key in customOpts) {
    if (
      customOpts[key] !== null && 
      typeof customOpts[key] === 'object' &&
      !Array.isArray(customOpts[key]) &&
      key in defaultOpts &&
      defaultOpts[key] !== null &&
      typeof defaultOpts[key] === 'object'
    ) {
      result[key] = mergeOptions(defaultOpts[key], customOpts[key]);
    } else {
      result[key] = customOpts[key];
    }
  }
  
  return result;
};

/**
 * Função para converter links no formato source/target para from/to
 */
export const normalizeLink = (link: any, index: number) => {
  const edgeData: any = {
    id: link.id || `edge_${index}`
  };

  // Verificar se o link está no formato from/to ou source/target
  if ('from' in link && 'to' in link) {
    edgeData.from = link.from;
    edgeData.to = link.to;
  } else if ('source' in link && 'target' in link) {
    // Para links no formato source/target (comum em visualizações D3)
    edgeData.from = link.source;
    edgeData.to = link.target;
  } else {
    console.warn(`Link ${index} não possui formato válido:`, link);
    // Fornecer valores padrão para evitar erros
    edgeData.from = `unknown_${index}`;
    edgeData.to = `unknown_${index + 1}`;
  }

  // Copiar outras propriedades
  if (link.value) edgeData.value = link.value;
  if (link.title) edgeData.title = link.title;
  if (link.color) edgeData.color = link.color;
  if ('width' in link) edgeData.width = link.width || 2;
  if ('arrows' in link) edgeData.arrows = link.arrows;
  if ('dashes' in link) edgeData.dashes = link.dashes;
  if ('label' in link) edgeData.label = link.label;

  return edgeData;
};
