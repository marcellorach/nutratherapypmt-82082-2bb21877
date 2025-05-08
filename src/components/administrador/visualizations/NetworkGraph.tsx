
import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import 'vis-network/styles/vis-network.css';

interface NetworkGraphProps {
  data: {
    nodes: any[];
    links: any[];
  };
  height?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, height = '500px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  
  useEffect(() => {
    if (!containerRef.current || !data.nodes || !data.links) return;
    
    console.log('NetworkGraph - Dados recebidos:', { 
      nodes: data.nodes.length, 
      links: data.links.length 
    });
    
    // Configurar grupos para diferentes tipos de nós
    const groups = {
      nutraceutico: {
        color: { background: '#3b82f6', border: '#2563eb' },
        shape: 'dot',
        font: { color: '#1e3a8a', size: 14 },
        borderWidth: 2,
        size: 20
      },
      condicao: {
        color: { background: '#10b981', border: '#059669' },
        shape: 'diamond',
        font: { color: '#064e3b', size: 14 },
        borderWidth: 2,
        size: 16
      },
      study: {
        color: { background: '#a855f7', border: '#9333ea' },
        shape: 'triangle',
        font: { color: '#581c87', size: 12 },
        borderWidth: 2,
        size: 14
      }
    };
    
    // Garantir que os IDs dos nós sejam únicos antes de criar o DataSet
    const uniqueNodes = ensureUniqueIds(data.nodes);
    
    // Converter dados para formato vis.js
    const nodes = new DataSet(
      uniqueNodes.map(node => ({
        ...node,
        group: node.group || node.type
      }))
    );
    
    const edges = new DataSet(
      data.links.map((link, index) => {
        // Debug para visualizar os links recebidos
        console.log(`Link ${index}:`, link);
        
        // Converter formato 'from/to' para o formato esperado pelo vis.js
        const edgeData: any = {
          id: link.id || `edge_${index}`
        };

        // Se o link tiver propriedades 'from' e 'to', usá-las
        if ('from' in link && 'to' in link) {
          edgeData.from = link.from;
          edgeData.to = link.to;
        } else {
          // Caso contrário, usar 'source' e 'target'
          edgeData.from = link.source;
          edgeData.to = link.target;
        }

        // Copiar outras propriedades
        if (link.value) edgeData.value = link.value;
        if (link.title) edgeData.title = link.title;
        if (link.color) edgeData.color = link.color;
        if (link.width) edgeData.width = link.width || 2; // Valor padrão para garantir visibilidade
        if (link.arrows) edgeData.arrows = link.arrows;
        if (link.dashes !== undefined) edgeData.dashes = link.dashes;

        return edgeData;
      })
    );
    
    // Debug para verificar o que foi criado
    console.log('NetworkGraph - DataSets criados:', { 
      nodes: nodes.length, 
      edges: edges.length 
    });
    
    // Opções para o grafo
    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 12,
          max: 30,
          label: {
            min: 12,
            max: 30,
            drawThreshold: 12,
            maxVisible: 20
          }
        },
        font: {
          size: 12,
          face: 'Inter, system-ui, sans-serif'
        }
      },
      edges: {
        width: 2, // Aumentar largura padrão para melhorar visibilidade
        color: { inherit: 'from' },
        smooth: {
          enabled: true,
          type: 'continuous',
          forceDirection: 'none',
          roundness: 0.5
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 } // Garantir que setas sejam exibidas
        }
      },
      physics: {
        stabilization: {
          iterations: 100,
          fit: true
        },
        barnesHut: {
          gravitationalConstant: -6000,
          centralGravity: 0.1,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09
        },
        minVelocity: 0.75
      },
      groups
    };
    
    // Criar e armazenar a instância da rede
    networkRef.current = new Network(
      containerRef.current,
      { nodes, edges },
      options
    );
    
    // Adicionar eventos
    networkRef.current.on('click', function(params) {
      if (params.nodes.length > 0) {
        console.log('Nó clicado:', nodes.get(params.nodes[0]));
      } else if (params.edges.length > 0) {
        console.log('Aresta clicada:', edges.get(params.edges[0]));
      }
    });

    // Realizar fit após estabilização da rede
    networkRef.current.once('stabilizationIterationsDone', function() {
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      }, 200);
    });
    
    // Limpeza
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data]);
  
  // Função para garantir que os nós tenham IDs únicos
  const ensureUniqueIds = (nodes: any[]): any[] => {
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
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        height, 
        border: '1px solid #e2e8f0',
        borderRadius: '0.375rem',
        overflow: 'hidden'
      }}
    />
  );
};

export default NetworkGraph;
