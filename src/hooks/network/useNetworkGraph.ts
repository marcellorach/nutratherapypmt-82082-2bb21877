
import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { NetworkData, NetworkGraphOptions, UseNetworkGraphResult } from './types';
import { defaultNetworkOptions } from './defaultOptions';
import { ensureUniqueNodeIds, mergeOptions, normalizeLink } from './utils';
import { useNetworkEvents } from './useNetworkEvents';

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
  
  // Configurar eventos de rede
  const { setupClickEvents, setupStabilizationEvents } = useNetworkEvents({
    network: networkRef,
    nodes: nodesDataSet,
    edges: edgesDataSet
  });
  
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
    
    // Configurar eventos
    setupClickEvents();
    setupStabilizationEvents();
    
    // Limpeza
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, containerRef, customOptions, setupClickEvents, setupStabilizationEvents]);
  
  return {
    network: networkRef.current,
    nodes: nodesDataSet.current,
    edges: edgesDataSet.current
  };
};
