
import React, { useRef } from 'react';
import { Agent, AgentConnection, DataPacket } from './types';
import ConnectionsGraph from './ConnectionsGraph';
import AgentComponent from './AgentComponent';

interface AgentFlowVisualizationProps {
  agents: Agent[];
  agentPositions: Record<string, { x: number; y: number }>;
  connections: AgentConnection[];
  dataPackets: DataPacket[];
  activeAgent: string | null;
}

const AgentFlowVisualization: React.FC<AgentFlowVisualizationProps> = ({ 
  agents, 
  agentPositions, 
  connections, 
  dataPackets, 
  activeAgent 
}) => {
  const flowContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="relative h-[400px] w-full bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-hidden" ref={flowContainerRef}>
      <ConnectionsGraph 
        connections={connections} 
        dataPackets={dataPackets} 
        agentPositions={agentPositions}
      />
      
      {agents.map((agent) => {
        const position = agentPositions[agent.id];
        if (!position) return null;
        
        const isActive = activeAgent === agent.id;
        
        return (
          <AgentComponent 
            key={agent.id}
            agent={agent}
            position={position}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
};

export default AgentFlowVisualization;
