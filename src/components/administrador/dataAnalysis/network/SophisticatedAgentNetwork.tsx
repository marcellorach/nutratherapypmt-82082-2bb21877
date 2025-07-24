
import React, { useState, useEffect } from 'react';
import { AgentConnection } from '../types';
import { agents, agentPositions } from '../agentData';
import SophisticatedAgentNode from './SophisticatedAgentNode';
import SophisticatedConnections from './SophisticatedConnections';

interface SophisticatedAgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const SophisticatedAgentNetwork: React.FC<SophisticatedAgentNetworkProps> = ({
  connections,
  activeAgent
}) => {
  const [agentActivity, setAgentActivity] = useState<Record<string, number>>({});

  // Calcular atividade dos agentes baseada nas conexões
  useEffect(() => {
    const newActivity: Record<string, number> = {};
    
    agents.forEach(agent => {
      const agentConnections = connections.filter(
        conn => conn.from === agent.id || conn.to === agent.id
      );
      const activeConnections = agentConnections.filter(conn => conn.active);
      const animatingConnections = agentConnections.filter(conn => conn.animating);
      
      let activity = 0;
      if (activeAgent === agent.id) activity += 0.8;
      if (activeConnections.length > 0) activity += 0.4;
      if (animatingConnections.length > 0) activity += 0.3;
      
      newActivity[agent.id] = Math.min(activity, 1);
    });
    
    setAgentActivity(newActivity);
  }, [connections, activeAgent]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Grid de fundo profissional */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
        <defs>
          <pattern id="sophisticatedGrid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path
              d="M 25 0 L 0 0 0 25"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="0.5"
            />
            <circle cx="12.5" cy="12.5" r="0.5" fill="#e2e8f0" opacity="0.3" />
          </pattern>
          
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.02)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#sophisticatedGrid)" />
        <rect width="100%" height="100%" fill="url(#centerGlow)" />
      </svg>

      {/* Camada principal do diagrama */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
        {/* Zona de processamento central - sutil */}
        <circle
          cx="400"
          cy="300"
          r="200"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="5,5"
          opacity="0.4"
        />
        
        {/* Zona de dados */}
        <circle
          cx="400"
          cy="300"
          r="150"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="0.5"
          strokeDasharray="3,3"
          opacity="0.3"
        />

        {/* Conexões sofisticadas */}
        <SophisticatedConnections
          connections={connections}
          agentPositions={agentPositions}
          width={800}
          height={600}
          activeAgent={activeAgent}
        />

        {/* Nós dos agentes */}
        {agents.map(agent => (
          <SophisticatedAgentNode
            key={agent.id}
            agent={agent}
            position={agentPositions[agent.id]}
            isActive={activeAgent === agent.id}
            width={800}
            height={600}
            activityLevel={agentActivity[agent.id] || 0}
          />
        ))}
      </svg>
    </div>
  );
};

export default SophisticatedAgentNetwork;
