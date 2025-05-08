
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
  
  // Configurações personalizadas para melhorar a visualização
  const defaultCustomOptions = {
    physics: {
      stabilization: {
        iterations: 200,
        fit: true
      },
      barnesHut: {
        gravitationalConstant: -10000,  // Aumentei para melhorar a distribuição
        centralGravity: 0.8,
        springLength: 150,  // Aumentado para espaçar mais os nós
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
      randomSeed: 42  // Usar seed fixo para garantir consistência na visualização
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
    { color: '#a855f7', label: 'Estudos' },
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
