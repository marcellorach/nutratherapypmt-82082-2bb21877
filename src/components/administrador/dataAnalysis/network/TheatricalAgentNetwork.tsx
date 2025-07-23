
import React, { useState, useEffect } from 'react';
import { AgentConnection } from '../types';
import { agents, agentPositions } from '../agentData';
import EnhancedAgentNode from './EnhancedAgentNode';
import AdvancedConnections from './AdvancedConnections';
import ParticleSystem from '../particles/ParticleSystem';

interface TheatricalAgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const TheatricalAgentNetwork: React.FC<TheatricalAgentNetworkProps> = ({
  connections,
  activeAgent
}) => {
  const [agentActivity, setAgentActivity] = useState<Record<string, number>>({});
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
      if (activeConnections.length > 0) activity += 0.5;
      if (animatingConnections.length > 0) activity += 0.3;
      
      newActivity[agent.id] = Math.min(activity, 1);
    });
    
    setAgentActivity(newActivity);
  }, [connections, activeAgent]);

  // Preparar conexões para o sistema de partículas
  const activeConnections = connections
    .filter(conn => conn.active)
    .map(conn => ({
      from: conn.from,
      to: conn.to,
      type: getConnectionType(conn.from, conn.to)
    }));

  function getConnectionType(from: string, to: string): string {
    if (from === 'supervisor') return 'data';
    if (to === 'supervisor') return 'feedback';
    if (from === 'data') return 'analysis';
    if (to === 'viz') return 'recommendation';
    return 'data';
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border overflow-hidden">
      {/* Background animado */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)] animate-ping"></div>
      </div>

      {/* Grid de fundo */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
        <defs>
          <pattern id="neuralGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(100,116,139,0.3)"
              strokeWidth="0.5"
            />
            <circle cx="20" cy="20" r="1" fill="rgba(100,116,139,0.2)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neuralGrid)" />
      </svg>

      {/* Camadas centrais do diagrama */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
        {/* Zona de processamento central */}
        <circle
          cx="400"
          cy="300"
          r="250"
          fill="none"
          stroke="rgba(139,92,246,0.3)"
          strokeWidth="2"
          strokeDasharray="10,5"
          className="animate-spin"
          style={{ animationDuration: '20s' }}
        />
        
        {/* Zona de dados */}
        <circle
          cx="400"
          cy="300"
          r="180"
          fill="none"
          stroke="rgba(59,130,246,0.3)"
          strokeWidth="1"
          strokeDasharray="5,3"
          className="animate-spin"
          style={{ animationDuration: '15s', animationDirection: 'reverse' }}
        />

        {/* Conexões avançadas */}
        <AdvancedConnections
          connections={connections}
          agentPositions={agentPositions}
          width={800}
          height={600}
          activeAgent={activeAgent}
        />

        {/* Sistema de partículas */}
        <ParticleSystem
          width={800}
          height={600}
          agentPositions={agentPositions}
          activeConnections={activeConnections}
          isActive={connections.some(conn => conn.active)}
        />

        {/* Nós dos agentes */}
        {agents.map(agent => (
          <EnhancedAgentNode
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

      {/* Painel de informações */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sistema Ativo</span>
            </div>
            <div className="text-sm opacity-80">
              {connections.filter(c => c.active).length} conexões ativas
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {['GPT-4o', 'Claude-3 Opus', 'Gemini Pro', 'Mistral Large'].map(model => {
              const agent = agents.find(a => a.model === model);
              const isActive = agent && activeAgent === agent.id;
              return (
                <div key={model} className="flex items-center gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                    style={{ 
                      backgroundColor: isActive ? '#10b981' : '#6b7280'
                    }}
                  />
                  <span className="text-xs font-mono">{model}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheatricalAgentNetwork;
