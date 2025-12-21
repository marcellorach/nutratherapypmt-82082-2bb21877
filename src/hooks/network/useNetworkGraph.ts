
import { useEffect, useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { NetworkData, NetworkGraphOptions, UseNetworkGraphResult } from './types';
import { defaultNetworkOptions } from './defaultOptions';
import { ensureUniqueNodeIds, mergeOptions, normalizeLink } from './utils';

/**
 * Hook para criar e gerenciar um grafo de rede usando vis.js
 */
export const useNetworkGraph = (
  containerRef: React.RefObject<HTMLDivElement>,
  data: NetworkData,
  customOptions: NetworkGraphOptions = {}
): UseNetworkGraphResult => {
  const networkRef = useRef<Network | null>(null);
  const nodesDataSet = useRef<DataSet<any> | null>(null);
  const edgesDataSet = useRef<DataSet<any> | null>(null);
  
  // Usar refs para callbacks de eventos para evitar dependências circulares
  const setupStabilizationRef = useRef<() => void>();
  
  // Callback de estabilização com ref estável
  setupStabilizationRef.current = () => {
    if (!networkRef.current) return;
    
    networkRef.current.once('stabilizationIterationsDone', function() {
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });
          
          // Estatísticas após estabilização (apenas log, sem dependências)
          if (nodesDataSet.current && edgesDataSet.current) {
            const nodesArray = nodesDataSet.current.get();
            const edgesArray = edgesDataSet.current.get();
            console.log('NetworkGraph - Estatísticas após estabilização:', {
              nodes: nodesArray.length,
              edges: edgesArray.length
            });
          }
        }
      }, 200);
    });
  };
  
  // Inicializar o grafo
  useEffect(() => {
    if (!containerRef.current || !data.nodes || !data.links) return;
    
    console.log('NetworkGraph - Dados recebidos:', { 
      nodes: data.nodes.length, 
      links: data.links.length 
    });
    
    // Mesclar opções padrão com opções customizadas
    const mergedOptions = mergeOptions(defaultNetworkOptions, customOptions);
    
    // Garantir que os IDs dos nós sejam únicos
    const uniqueNodes = ensureUniqueNodeIds(data.nodes);
    
    // Criar DataSet para nós
    nodesDataSet.current = new DataSet(
      uniqueNodes.map(node => ({
        ...node,
        group: node.group || node.type
      }))
    );
    
    // Criar DataSet para arestas
    edgesDataSet.current = new DataSet(
      data.links.map((link, index) => {
        // Debug para visualizar os links recebidos
        if (index < 5 || index % 20 === 0) {
          console.log(`Link ${index} (amostra):`, link);
        }
        
        // Converter formato para o formato esperado pelo vis.js
        return normalizeLink(link, index);
      })
    );
    
    // Debug para verificar o que foi criado
    console.log('NetworkGraph - DataSets criados:', { 
      nodes: nodesDataSet.current.length, 
      edges: edgesDataSet.current.length 
    });
    
    // Criar e armazenar a instância da rede
    networkRef.current = new Network(
      containerRef.current,
      { 
        nodes: nodesDataSet.current, 
        edges: edgesDataSet.current 
      },
      mergedOptions
    );
    
    // Configurar eventos usando ref para evitar dependências circulares
    if (setupStabilizationRef.current) {
      setupStabilizationRef.current();
    }
    
    // Limpeza
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, containerRef, customOptions]);
  
  return {
    network: networkRef.current,
    nodes: nodesDataSet.current,
    edges: edgesDataSet.current
  };
};
