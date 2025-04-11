
import React from 'react';
import { AgentConnection, DataPacket } from './types';
import "./agentAnimation.css";

interface ConnectionsGraphProps {
  connections: AgentConnection[];
  dataPackets: DataPacket[];
  agentPositions: Record<string, { x: number; y: number }>;
}

const ConnectionsGraph: React.FC<ConnectionsGraphProps> = ({ connections, dataPackets, agentPositions }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {connections.map((conn, idx) => {
        const fromPos = agentPositions[conn.from];
        const toPos = agentPositions[conn.to];
        
        if (!fromPos || !toPos) return null;
        
        const connId = `${conn.from}-${conn.to}`;
        
        return (
          <g key={connId}>
            <line 
              x1={`${fromPos.x}%`}
              y1={`${fromPos.y}%`}
              x2={`${toPos.x}%`}
              y2={`${toPos.y}%`}
              stroke={conn.active ? '#10b981' : '#e2e8f0'}
              strokeWidth={conn.active ? 2 : 1}
              strokeDasharray={conn.animating ? '4 2' : (conn.active ? 'none' : '4 2')}
              className={conn.animating ? 'connection-path' : ''}
            />
            
            {/* Adiciona seta na conexão */}
            {conn.active && (
              <polygon 
                points="0,-3 6,0 0,3"
                fill="#10b981"
                transform={`translate(${toPos.x}%, ${toPos.y}%) rotate(${Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * (180 / Math.PI)})`}
                className={conn.animating ? 'connection-arrow' : ''}
              />
            )}
          </g>
        );
      })}
      
      {/* Animação de pacotes de dados */}
      {dataPackets.map((packet, idx) => {
        const fromPos = agentPositions[packet.fromId];
        const toPos = agentPositions[packet.toId];
        
        if (!fromPos || !toPos) return null;
        
        const packetId = `packet-${packet.fromId}-${packet.toId}-${idx}`;
        
        return (
          <circle
            key={packetId}
            cx="0"
            cy="0"
            r="4"
            fill="#10b981"
            className="data-packet"
            style={{
              animation: `movePacket ${packet.duration / 1000}s linear forwards`,
              '--from-x': `${fromPos.x}%`,
              '--from-y': `${fromPos.y}%`,
              '--to-x': `${toPos.x}%`,
              '--to-y': `${toPos.y}%`,
            } as React.CSSProperties}
          />
        );
      })}
    </svg>
  );
};

export default ConnectionsGraph;
