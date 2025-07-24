
import React from 'react';
import { AgentConnection } from '../types';

interface ProfessionalConnectionsProps {
  connections: AgentConnection[];
  agentPositions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
}

const ProfessionalConnections: React.FC<ProfessionalConnectionsProps> = ({
  connections,
  agentPositions,
  width,
  height
}) => {
  const getConnectionStyle = (connection: AgentConnection) => {
    return {
      stroke: connection.active ? '#3b82f6' : '#d1d5db',
      strokeWidth: connection.active ? 2 : 1,
      opacity: connection.active ? 0.8 : 0.4
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
    </defs>
  );

  return (
    <g className="professional-connections">
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
        
        return (
          <g key={connectionId}>
            {createArrowMarker(connectionId, style.stroke as string)}
            
            {/* Linha principal - simples e direta */}
            <line
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              {...style}
              markerEnd={connection.active ? `url(#arrow-${connectionId})` : ''}
              strokeDasharray={connection.animating ? '6 3' : 'none'}
              className={connection.animating ? 'animate-pulse' : ''}
            />
            
            {/* Indicador de fluxo de dados - apenas uma animação sutil */}
            {connection.active && connection.animating && (
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.6"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export default ProfessionalConnections;
