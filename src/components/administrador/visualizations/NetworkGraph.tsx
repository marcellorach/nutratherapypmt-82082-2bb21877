
import React, { useRef, useEffect } from 'react';
import { useNetworkGraph } from '@/hooks/network/useNetworkGraph';
import NetworkControls from './graph/NetworkControls';
import BiologicalLegend from './graph/BiologicalLegend';

interface NetworkGraphProps {
  data: {
    nodes: any[];
    links: any[];
  };
  height?: string;
  showControls?: boolean;
  showLegend?: boolean;
  customOptions?: any;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = '500px',
  showControls = true,
  showLegend = false,
  customOptions = {},
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Configurações personalizadas para melhorar a visualização
  const defaultCustomOptions = {
    physics: {
      stabilization: {
        iterations: 200,
        fit: true
      },
      barnesHut: {
        gravitationalConstant: -10000,
        centralGravity: 0.8,
        springLength: 150,
        springConstant: 0.08,
        damping: 0.09
      }
    },
    nodes: {
      shape: 'dot',
      scaling: {
        min: 10,
        max: 30
      },
      font: {
        size: 14,
        face: 'Inter, system-ui, sans-serif',
        color: '#333333'
      },
      borderWidth: 2,
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 5
      }
    },
    edges: {
      width: 2,
      selectionWidth: 3,
      smooth: {
        enabled: true,
        type: 'continuous'
      },
      hoverWidth: 2
    },
    layout: {
      improvedLayout: true,
      randomSeed: 42
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true,
      dragView: true
    }
  };
  
  // Mesclar as configurações personalizadas
  const mergedOptions = { ...defaultCustomOptions, ...customOptions };
  
  // Usar o hook para inicializar o grafo
  const { network, nodes } = useNetworkGraph(containerRef, data, mergedOptions);
  
  // Setup click handler for nodes - sem early return para manter hooks consistentes
  useEffect(() => {
    // Guard clauses dentro do useEffect, não early return do hook
    if (!network) return;
    if (!onNodeClick) return;
    
    const handleClick = (params: any) => {
      if (params.nodes && params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        // Tenta obter nodeData do DataSet, mas passa dados mínimos se não encontrar
        const nodeData = nodes?.get(nodeId) || { id: nodeId, label: nodeId };
        onNodeClick(nodeId, nodeData);
      }
    };
    
    network.on('click', handleClick);
    
    return () => {
      // Verificar se network ainda existe antes de chamar off para evitar memory leak
      if (network) {
        network.off('click', handleClick);
      }
    };
  }, [network, nodes, onNodeClick]);
  
  
  return (
    <div className="flex flex-col">
      <div className="relative">
        {/* Controles do grafo */}
        {showControls && (
          <div className="absolute top-2 right-2 z-10">
            <NetworkControls network={network} />
          </div>
        )}
        
        {/* Container do grafo */}
        <div 
          ref={containerRef} 
          style={{ 
            height, 
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            overflow: 'hidden',
            backgroundColor: '#f8fafc'
          }}
          className="shadow-inner cursor-pointer"
        />
      </div>
      
      {/* Legenda Biológica */}
      {showLegend && (
        <div className="mt-3 border-t pt-3">
          <BiologicalLegend />
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
