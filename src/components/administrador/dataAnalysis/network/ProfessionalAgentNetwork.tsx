
import React, { useState, useEffect } from 'react';
import { AgentConnection } from '../types';
import { agents, agentPositions } from '../agentData';
import ProfessionalAgentNode from './ProfessionalAgentNode';
import ProfessionalConnections from './ProfessionalConnections';

interface ProfessionalAgentNetworkProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const ProfessionalAgentNetwork: React.FC<ProfessionalAgentNetworkProps> = ({
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
      
      let activity = 0;
      if (activeAgent === agent.id) activity += 0.8;
      if (activeConnections.length > 0) activity += 0.4;
      
      newActivity[agent.id] = Math.min(activity, 1);
    });
    
    setAgentActivity(newActivity);
  }, [connections, activeAgent]);

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Grid de fundo profissional */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
        <defs>
          <pattern id="professionalGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#professionalGrid)" />
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
          strokeDasharray="8,4"
          opacity="0.5"
        />

        {/* Conexões profissionais */}
        <ProfessionalConnections
          connections={connections}
          agentPositions={agentPositions}
          width={800}
          height={600}
        />

        {/* Nós dos agentes */}
        {agents.map(agent => (
          <ProfessionalAgentNode
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

      {/* Painel de informações - mantido conforme solicitado */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Sistema Ativo</span>
            </div>
            <div className="text-sm text-slate-500">
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
                    className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-400'}`}
                  />
                  <span className="text-xs font-mono text-slate-600">{model}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAgentNetwork;
