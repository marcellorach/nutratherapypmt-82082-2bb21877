
import { ensureUniqueNodeIds } from '@/hooks/network/utils';

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

// Re-exportando para manter compatibilidade com código existente
export { ensureUniqueNodeIds };
