
import React from 'react';
import { AgentConnection } from '../types';

interface SophisticatedConnectionsProps {
  connections: AgentConnection[];
  agentPositions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  activeAgent: string | null;
}

const SophisticatedConnections: React.FC<SophisticatedConnectionsProps> = ({
  connections,
  agentPositions,
  width,
  height,
  activeAgent
}) => {
  const getConnectionMetrics = (connection: AgentConnection) => {
    const baseWidth = 1;
    const activeWidth = connection.active ? 3 : baseWidth;
    const trafficWidth = connection.animating ? 5 : activeWidth;
    
    const baseColor = '#e2e8f0';
    const activeColor = '#3b82f6';
    const trafficColor = '#1e40af';
    
    let strokeColor = baseColor;
    if (connection.active) strokeColor = activeColor;
    if (connection.animating) strokeColor = trafficColor;
    
    return {
      strokeWidth: trafficWidth,
      strokeColor,
      opacity: connection.active ? 0.9 : 0.4,
      throughput: connection.animating ? '2.3 Mbps' : '0.1 Mbps'
    };
  };

  const createArrowMarker = (connectionId: string, color: string) => (
    <defs>
      <marker
        id={`arrow-${connectionId}`}
        viewBox="0 -5 10 10"
        refX="8"
        refY="0"
        markerWidth="4"
        markerHeight="4"
        orient="auto"
      >
        <path d="M0,-3L6,0L0,3" fill={color} />
      </marker>
      
      <linearGradient id={`gradient-${connectionId}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
        <stop offset="50%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor={color} stopOpacity="0.3" />
      </linearGradient>
    </defs>
  );

  return (
    <g className="sophisticated-connections">
      {connections.map((connection, index) => {
        const fromPos = agentPositions[connection.from];
        const toPos = agentPositions[connection.to];
        
        if (!fromPos || !toPos) return null;
        
        const fromX = (fromPos.x / 100) * width;
        const fromY = (fromPos.y / 100) * height;
        const toX = (toPos.x / 100) * width;
        const toY = (toPos.y / 100) * height;
        
        const connectionId = `${connection.from}-${connection.to}-${index}`;
        const metrics = getConnectionMetrics(connection);
        
        // Calcular posição do meio para métricas
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        return (
          <g key={connectionId}>
            {createArrowMarker(connectionId, metrics.strokeColor)}
            
            {/* Linha de base (sombra sutil) */}
            <line
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={metrics.strokeWidth + 1}
              opacity="0.3"
            />
            
            {/* Linha principal com gradiente */}
            <line
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={connection.animating ? `url(#gradient-${connectionId})` : metrics.strokeColor}
              strokeWidth={metrics.strokeWidth}
              opacity={metrics.opacity}
              markerEnd={connection.active ? `url(#arrow-${connectionId})` : ''}
              strokeDasharray={connection.animating ? '8 4' : 'none'}
              className={connection.animating ? 'animate-pulse' : ''}
              style={{ animationDuration: '1.5s' }}
            />
            
            {/* Indicador de throughput */}
            {connection.active && (
              <g>
                <rect
                  x={midX - 25}
                  y={midY - 10}
                  width="50"
                  height="16"
                  fill="rgba(255,255,255,0.95)"
                  stroke="#d1d5db"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={midX}
                  y={midY + 2}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {metrics.throughput}
                </text>
              </g>
            )}
            
            {/* Indicador de direção do fluxo */}
            {connection.animating && (
              <circle
                cx={fromX + (toX - fromX) * 0.7}
                cy={fromY + (toY - fromY) * 0.7}
                r="2"
                fill={metrics.strokeColor}
                opacity="0.8"
              >
                <animate
                  attributeName="r"
                  values="2;4;2"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0.3;0.8"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default SophisticatedConnections;
