
import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { ensureUniqueNodeIds } from '@/utils/graph-utils';

// Tipos de dados para o grafo de rede
export interface NetworkNode {
  id: string | number;
  label: string;
  title?: string;
  group?: string;
  shape?: string;
  color?: any;
  value?: number;
  [key: string]: any;
}

export interface NetworkLink {
  id?: string | number;
  from: string | number;
  to: string | number;
  title?: string;
  label?: string;
  color?: string;
  width?: number;
  value?: number;
  arrows?: any;
  dashes?: boolean;
  [key: string]: any;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface NetworkGraphOptions {
  physics?: any;
  nodes?: any;
  edges?: any;
  groups?: Record<string, any>;
}

export const useNetworkGraph = (
  containerRef: React.RefObject<HTMLDivElement>,
  data: NetworkData,
  customOptions: NetworkGraphOptions = {}
) => {
  const networkRef = useRef<Network | null>(null);
  const nodesDataSet = useRef<DataSet<any> | null>(null);
  const edgesDataSet = useRef<DataSet<any> | null>(null);
  
  // Configuração padrão do grafo
  const defaultOptions: NetworkGraphOptions = {
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
      width: 2,
      color: { inherit: 'from' },
      smooth: {
        enabled: true,
        type: 'continuous',
        forceDirection: 'none',
        roundness: 0.5
      },
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 }
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
    groups: {
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
    }
  };
  
  // Inicializar o grafo
  useEffect(() => {
    if (!containerRef.current || !data.nodes || !data.links) return;
    
    console.log('NetworkGraph - Dados recebidos:', { 
      nodes: data.nodes.length, 
      links: data.links.length 
    });
    
    const mergedOptions = mergeOptions(defaultOptions, customOptions);
    
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
        console.log(`Link ${index}:`, link);
        
        // Converter formato para o formato esperado pelo vis.js
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
        if (link.width) edgeData.width = link.width || 2;
        if (link.arrows) edgeData.arrows = link.arrows;
        if (link.dashes !== undefined) edgeData.dashes = link.dashes;

        return edgeData;
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
    
    // Adicionar eventos
    networkRef.current.on('click', function(params) {
      if (params.nodes.length > 0 && nodesDataSet.current) {
        console.log('Nó clicado:', nodesDataSet.current.get(params.nodes[0]));
      } else if (params.edges.length > 0 && edgesDataSet.current) {
        console.log('Aresta clicada:', edgesDataSet.current.get(params.edges[0]));
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
  }, [data, containerRef]);
  
  // Função auxiliar para mesclar opções
  const mergeOptions = (defaultOpts: any, customOpts: any): any => {
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
  
  return {
    network: networkRef.current,
    nodes: nodesDataSet.current,
    edges: edgesDataSet.current
  };
};
