
import { useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface UseNetworkEventsProps {
  network: React.MutableRefObject<Network | null>;
  nodes: React.MutableRefObject<DataSet<any> | null>;
  edges: React.MutableRefObject<DataSet<any> | null>;
}

export const useNetworkEvents = ({ network, nodes, edges }: UseNetworkEventsProps) => {
  // Registrar eventos de clique
  const setupClickEvents = useCallback(() => {
    if (!network.current) return;
    
    network.current.on('click', function(params) {
      if (params.nodes.length > 0 && nodes.current) {
        console.log('Nó clicado:', nodes.current.get(params.nodes[0]));
      } else if (params.edges.length > 0 && edges.current) {
        console.log('Aresta clicada:', edges.current.get(params.edges[0]));
      }
    });
  }, [network, nodes, edges]);

  // Evento de estabilização
  const setupStabilizationEvents = useCallback(() => {
    if (!network.current) return;
    
    network.current.once('stabilizationIterationsDone', function() {
      setTimeout(() => {
        if (network.current) {
          network.current.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });
          
          // Depois que a rede estabiliza, exibir estatísticas
          if (nodes.current && edges.current) {
            const nodesArray = nodes.current.get();
            const edgesArray = edges.current.get();
            
            // Contar nós isolados
            let isolatedCount = 0;
            
            nodesArray.forEach(node => {
              const connections = edgesArray.filter(
                edge => edge.from === node.id || edge.to === node.id
              );
              
              if (connections.length === 0) {
                isolatedCount++;
              }
            });
            
            console.log('NetworkGraph - Estatísticas após estabilização:', {
              nodes: nodesArray.length,
              edges: edgesArray.length,
              isolatedNodes: isolatedCount
            });
          }
        }
      }, 200);
    });
  }, [network, nodes, edges]);

  return {
    setupClickEvents,
    setupStabilizationEvents
  };
};
