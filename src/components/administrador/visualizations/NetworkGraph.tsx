
import React, { useRef } from 'react';
import 'vis-network/styles/vis-network.css';
import { useNetworkGraph } from '@/hooks/useNetworkGraph';
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
  const { network } = useNetworkGraph(containerRef, data, customOptions);
  
  // Itens da legenda padrão
  const defaultLegendItems = [
    { color: '#3b82f6', label: 'Nutracêuticos' },
    { color: '#10b981', label: 'Condições de Saúde' },
    { color: '#a855f7', label: 'Estudos' }
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
            overflow: 'hidden'
          }}
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
