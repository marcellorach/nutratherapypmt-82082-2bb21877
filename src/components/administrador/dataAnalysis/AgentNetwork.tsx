import React from 'react';
import { AgentConnection } from './types';
import { agents, agentPositions } from './agentData';

interface AgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ connections, activeAgent }) => {
  const agentsList = agents.map(agent => ({
    ...agent,
    x: agentPositions[agent.id]?.x * 4 || 100, // Multiply by 4 to fit the SVG viewport
    y: agentPositions[agent.id]?.y * 4 || 100
  }));

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg border overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Connections */}
        {connections.map((conn, idx) => {
          const fromAgent = agentsList.find(a => a.id === conn.from);
          const toAgent = agentsList.find(a => a.id === conn.to);
          if (!fromAgent || !toAgent) return null;
          
          return (
            <line
              key={idx}
              x1={fromAgent.x}
              y1={fromAgent.y}
              x2={toAgent.x}
              y2={toAgent.y}
              stroke={conn.active ? "#10b981" : "#d1d5db"}
              strokeWidth={conn.active ? "3" : "1"}
              className="transition-all duration-300"
            />
          );
        })}
        
        {/* Agent nodes */}
        {agentsList.map(agent => (
          <g key={agent.id}>
            <circle
              cx={agent.x}
              cy={agent.y}
              r="20"
              fill={activeAgent === agent.id ? "#10b981" : "#6b7280"}
              className="transition-all duration-300"
            />
            <text
              x={agent.x}
              y={agent.y + 35}
              textAnchor="middle"
              className="text-xs font-medium fill-gray-700"
            >
              {agent.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default AgentNetwork;