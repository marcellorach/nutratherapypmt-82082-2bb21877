
import React from 'react';
import { Agent } from './types';

interface AgentLegendProps {
  agents: Agent[];
  activeAgent: string | null;
}

const AgentLegend: React.FC<AgentLegendProps> = ({ agents, activeAgent }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
      {agents.map(agent => {
        const Icon = agent.icon;
        return (
          <div key={agent.id} className={`flex items-center p-2 rounded-md ${activeAgent === agent.id ? 'bg-gray-100' : ''}`}>
            <div className={`p-1 rounded-md ${agent.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="ml-2">
              <div className="text-xs font-medium">{agent.name}</div>
              <div className="text-[10px] text-gray-500">{agent.model}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AgentLegend;
