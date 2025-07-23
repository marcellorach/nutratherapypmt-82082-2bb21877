
import React from 'react';
import { AgentConnection } from '../types';

interface AdvancedConnectionsProps {
  connections: AgentConnection[];
  agentPositions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  activeAgent: string | null;
}

const AdvancedConnections: React.FC<AdvancedConnectionsProps> = ({
  connections,
  agentPositions,
  width,
  height,
  activeAgent
}) => {
  const getConnectionStyle = (connection: AgentConnection) => {
    const baseStyle = {
      stroke: connection.active ? '#10b981' : '#e2e8f0',
      strokeWidth: connection.active ? 3 : 1,
      opacity: connection.active ? 0.8 : 0.3,
      filter: connection.active ? 'url(#glow)' : 'none'
    };

    if (connection.animating) {
      return {
        ...baseStyle,
        strokeDasharray: '8 4',
        animation: 'dash 1s linear infinite'
      };
    }

    return baseStyle;
  };

  const createCurvedPath = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    curve: number = 0.3
  ) => {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const controlX = midX + (-dy / distance) * curve * distance;
    const controlY = midY + (dx / distance) * curve * distance;
    
    return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
  };

  const createArrowMarker = (connectionId: string, color: string) => (
    <defs>
      <marker
        id={`arrow-${connectionId}`}
        viewBox="0 -5 10 10"
        refX="8"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M0,-5L10,0L0,5" fill={color} />
      </marker>
    </defs>
  );

  return (
    <g className="advanced-connections">
      <defs>
        {/* Filtro de brilho */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Gradiente para conexões */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
        </linearGradient>
      </defs>

      {connections.map((connection, index) => {
        const fromPos = agentPositions[connection.from];
        const toPos = agentPositions[connection.to];
        
        if (!fromPos || !toPos) return null;
        
        const fromX = (fromPos.x / 100) * width;
        const fromY = (fromPos.y / 100) * height;
        const toX = (toPos.x / 100) * width;
        const toY = (toPos.y / 100) * height;
        
        const connectionId = `${connection.from}-${connection.to}-${index}`;
        const style = getConnectionStyle(connection);
        const pathData = createCurvedPath(fromX, fromY, toX, toY);
        
        return (
          <g key={connectionId}>
            {createArrowMarker(connectionId, style.stroke as string)}
            
            {/* Linha de base (sombra) */}
            <path
              d={pathData}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={(style.strokeWidth as number) + 1}
              opacity="0.3"
              transform="translate(2, 2)"
            />
            
            {/* Linha principal */}
            <path
              d={pathData}
              fill="none"
              {...style}
              markerEnd={connection.active ? `url(#arrow-${connectionId})` : ''}
              className={connection.animating ? 'animate-pulse' : ''}
            />
            
            {/* Efeito de pulso para conexões ativas */}
            {connection.active && (
              <path
                d={pathData}
                fill="none"
                stroke={style.stroke}
                strokeWidth="6"
                opacity="0.2"
                className="animate-ping"
              />
            )}
            
            {/* Indicador de direção do fluxo */}
            {connection.active && (
              <circle
                cx={fromX + (toX - fromX) * 0.7}
                cy={fromY + (toY - fromY) * 0.7}
                r="3"
                fill={style.stroke}
                opacity="0.8"
                className="animate-bounce"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export default AdvancedConnections;
