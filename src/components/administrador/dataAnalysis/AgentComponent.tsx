
import React from 'react';
import { Agent } from './types';

interface AgentComponentProps {
  agent: Agent;
  position: { x: number; y: number };
  isActive: boolean;
}

const AgentComponent: React.FC<AgentComponentProps> = ({ agent, position, isActive }) => {
  const { icon: Icon } = agent;
  
  return (
    <div
      className={`absolute p-3 rounded-md border transition-all duration-300 ${
        isActive ? 'agent-active ring-2 shadow-lg scale-110 z-10' : ''
      } ${agent.color} ${isActive ? `ring-${agent.color.split('-')[1]}-500` : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '160px',
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2 font-medium text-sm mb-1">
          <Icon className="h-4 w-4" />
          <span>{agent.name}</span>
        </div>
        <div className="text-xs bg-white bg-opacity-70 rounded-full px-2 py-0.5 font-mono">
          {agent.model}
        </div>
        {isActive && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
        )}
      </div>
    </div>
  );
};

export default AgentComponent;
