
import React, { useRef } from 'react';
import 'vis-network/styles/vis-network.css';
import { useNetworkGraph } from '@/hooks/network/useNetworkGraph';
import NetworkControls from './graph/NetworkControls';
import NetworkLegend from './graph/NetworkLegend';

interface NetworkGraphProps {
  data: {
    nodes: any[];
    links: any[];
  };
  height?: string;
  showControls?: boolean;
  showLegend?: boolean;
  customOptions?: any;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = '500px',
  showControls = true,
  showLegend = false,
  customOptions = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Configurações personalizadas para melhorar a visualização com animação suave
  const defaultCustomOptions = {
    physics: {
      enabled: true,
      stabilization: {
        iterations: 150,
        fit: true
      },
      barnesHut: {
        gravitationalConstant: -8000,
        centralGravity: 0.3,
        springLength: 120,
        springConstant: 0.05,
        damping: 0.09,
        avoidOverlap: 0.1
      },
      minVelocity: 0.75,
      maxVelocity: 30,
      solver: 'barnesHut'
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
        type: 'continuous',
        roundness: 0.5
      },
      hoverWidth: 2
    },
    layout: {
      improvedLayout: true
      // Removido randomSeed para permitir animação natural
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
  const { network } = useNetworkGraph(containerRef, data, mergedOptions);
  
  // Itens da legenda expandida
  const defaultLegendItems = [
    { color: '#3b82f6', label: 'Nutracêuticos' },
    { color: '#10b981', label: 'Condições de Saúde' },
    { color: '#a855f7', label: 'Estudos Científicos' },
    { color: '#9ca3af', label: 'Conexões Potenciais', dashed: true },
    { color: '#8b5cf6', label: 'Sinergias', dashed: [2, 2] },
    { color: '#d1d5db', label: 'Correlações entre Condições', dashed: [5, 5] }
  ];
  
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
          className="shadow-inner"
        />
      </div>
      
      {/* Legenda */}
      {showLegend && (
        <div className="mt-3 border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Legenda</h4>
          <NetworkLegend items={defaultLegendItems} />
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
