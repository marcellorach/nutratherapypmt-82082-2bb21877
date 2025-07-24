
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
    const baseWidth = 1.5;
    const activeWidth = connection.active ? 3 : baseWidth;
    const trafficWidth = connection.animating ? 4 : activeWidth;
    
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
      throughput: connection.animating ? getDynamicThroughput(connection) : '0.1 req/s'
    };
  };

  const getDynamicThroughput = (connection: AgentConnection) => {
    const baseValues = {
      'supervisor': '15 req/s',
      'data': '180 ops/s',
      'pattern': '320 tokens/s',
      'correlation': '280 tokens/s',
      'recommendation': '450 tokens/s',
      'viz': '220 ops/s'
    };
    
    // Adicionar variação baseada na conexão
    const variation = Math.random() * 0.3 + 0.8; // 0.8 a 1.1
    const baseValue = baseValues[connection.from] || '100 req/s';
    const [num, unit] = baseValue.split(' ');
    const newValue = Math.round(parseFloat(num) * variation);
    
    return `${newValue} ${unit}`;
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
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={metrics.strokeWidth + 1}
              opacity="0.4"
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
              strokeDasharray={connection.animating ? '10 5' : 'none'}
              className={connection.animating ? 'animate-pulse' : ''}
              style={{ animationDuration: '1.2s' }}
            />
            
            {/* Indicador de throughput dinâmico */}
            {connection.active && (
              <g>
                <rect
                  x={midX - 30}
                  y={midY - 12}
                  width="60"
                  height="20"
                  fill="rgba(255,255,255,0.95)"
                  stroke="#d1d5db"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {metrics.throughput}
                </text>
              </g>
            )}
            
            {/* Indicador de fluxo de dados animado */}
            {connection.animating && (
              <g>
                <circle
                  cx={fromX + (toX - fromX) * 0.3}
                  cy={fromY + (toY - fromY) * 0.3}
                  r="2.5"
                  fill={metrics.strokeColor}
                  opacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="2.5;4;2.5"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                <circle
                  cx={fromX + (toX - fromX) * 0.7}
                  cy={fromY + (toY - fromY) * 0.7}
                  r="2"
                  fill={metrics.strokeColor}
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="2;3.5;2"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default SophisticatedConnections;
