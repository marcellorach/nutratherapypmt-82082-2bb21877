
import { EnhancedSankeyLink, SankeyLink } from '@/components/administrador/visualizations/sankey/types';

/**
 * Filtra links para garantir que conectam apenas a nós válidos
 * @param links Lista de links do diagrama Sankey
 * @param nodeIdsMap Mapa de IDs de nós válidos
 * @returns Lista filtrada de links
 */
export const filterValidLinks = (
  links: EnhancedSankeyLink[],
  nodeIdsMap: Map<string | number, boolean>
): EnhancedSankeyLink[] => {
  return links.filter(link => 
    nodeIdsMap.has(link.source) && nodeIdsMap.has(link.target)
  );
};

/**
 * Converte links com IDs de string para links com índices numéricos
 * @param links Lista de links com IDs string ou number
 * @param nodeMap Mapa de IDs de nós para índices
 * @returns Lista de links com índices numéricos
 */
export const convertLinksToNumericIndices = (
  links: EnhancedSankeyLink[],
  nodeMap: Map<string | number, number>
): SankeyLink[] => {
  return links
    .map(link => {
      const sourceIndex = nodeMap.get(link.source);
      const targetIndex = nodeMap.get(link.target);
      
      if (sourceIndex === undefined || targetIndex === undefined) {
        console.warn('Link inválido: nó fonte ou alvo não encontrado', link);
        return null;
      }
      
      // Garantir que todos os campos obrigatórios estão presentes
      const sourceName = link.sourceName || String(link.source);
      const targetName = link.targetName || String(link.target);
      
      // Criar um link compatível com o tipo SankeyLink, garantindo que source e target sejam números
      return {
        source: Number(sourceIndex), // Conversão explícita para número
        target: Number(targetIndex), // Conversão explícita para número
        value: link.value,
        color: link.color,
        labelText: link.labelText,
        studyCount: link.studyCount,
        evidenceLevel: link.evidenceLevel,
        description: link.description,
        relationshipType: link.relationshipType,
        originalRelation: link.originalRelation,
        sourceName: sourceName,
        targetName: targetName,
        originalLink: link // Mantemos o link original para referência
      } as SankeyLink;
    })
    .filter((link): link is SankeyLink => link !== null);
};
