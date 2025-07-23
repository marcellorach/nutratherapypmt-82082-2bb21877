
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
    x: agentPositions[agent.id]?.x || 50,
    y: agentPositions[agent.id]?.y || 50
  }));

  // Função para obter cor do modelo
  const getModelColor = (model: string) => {
    switch (model) {
      case 'GPT-4o': return '#10b981'; // Verde OpenAI
      case 'Claude-3 Opus': return '#8b5cf6'; // Roxo Anthropic
      case 'Gemini Pro': return '#3b82f6'; // Azul Google
      case 'Mistral Large': return '#f59e0b'; // Laranja Mistral
      default: return '#6b7280';
    }
  };

  // Função para obter gradiente baseado no modelo
  const getGradientId = (model: string) => {
    return `gradient-${model.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Definições de gradientes para cada modelo */}
        <defs>
          <radialGradient id="gradient-gpt4o" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="gradient-claude3opus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="gradient-geminipro" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="gradient-mistrallarge" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </radialGradient>
          
          {/* Filtros para efeitos visuais */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>

        {/* Grid de fundo para dar aspecto técnico */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Conexões com diferentes estilos baseados no tipo */}
        {connections.map((conn, idx) => {
          const fromAgent = agentsList.find(a => a.id === conn.from);
          const toAgent = agentsList.find(a => a.id === conn.to);
          if (!fromAgent || !toAgent) return null;
          
          const fromX = (fromAgent.x / 100) * 100;
          const fromY = (fromAgent.y / 100) * 100;
          const toX = (toAgent.x / 100) * 100;
          const toY = (toAgent.y / 100) * 100;
          
          // Calcular ponto de controle para curva
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          const controlX = midX + (fromY - toY) * 0.1;
          const controlY = midY + (toX - fromX) * 0.1;
          
          const pathData = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
          
          return (
            <g key={`${conn.from}-${conn.to}-${idx}`}>
              {/* Conexão principal */}
              <path
                d={pathData}
                fill="none"
                stroke={conn.active ? getModelColor(fromAgent.model) : "#d1d5db"}
                strokeWidth={conn.active ? 2.5 : 1}
                strokeDasharray={conn.animating ? "5,5" : "none"}
                opacity={conn.active ? 0.8 : 0.3}
                filter={conn.active ? "url(#glow)" : "none"}
                className={conn.animating ? "animate-pulse" : ""}
              />
              
              {/* Seta direccional */}
              {conn.active && (
                <circle
                  cx={toX}
                  cy={toY}
                  r="4"
                  fill={getModelColor(fromAgent.model)}
                  opacity="0.8"
                  className={conn.animating ? "animate-ping" : ""}
                />
              )}
            </g>
          );
        })}
        
        {/* Nós dos agentes com design mais sofisticado */}
        {agentsList.map(agent => {
          const x = (agent.x / 100) * 100;
          const y = (agent.y / 100) * 100;
          const isActive = activeAgent === agent.id;
          const modelColor = getModelColor(agent.model);
          
          return (
            <g key={agent.id} transform={`translate(${x}, ${y})`}>
              {/* Círculo de fundo com gradiente */}
              <circle
                cx="0"
                cy="0"
                r="28"
                fill={`url(#${getGradientId(agent.model)})`}
                stroke={modelColor}
                strokeWidth={isActive ? 3 : 2}
                filter="url(#shadow)"
                className={isActive ? "animate-pulse" : ""}
              />
              
              {/* Círculo interno */}
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="white"
                stroke={modelColor}
                strokeWidth="1"
                opacity="0.9"
              />
              
              {/* Indicador de atividade */}
              {isActive && (
                <circle
                  cx="0"
                  cy="0"
                  r="32"
                  fill="none"
                  stroke={modelColor}
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-ping"
                />
              )}
              
              {/* Texto do nome (posicionado abaixo) */}
              <text
                x="0"
                y="45"
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700"
                style={{ fontSize: '11px' }}
              >
                {agent.name.split(' ')[1]} {/* Apenas a segunda palavra */}
              </text>
              
              {/* Texto do modelo (posicionado ainda mais abaixo) */}
              <text
                x="0"
                y="58"
                textAnchor="middle"
                className="text-xs font-mono fill-gray-500"
                style={{ fontSize: '9px' }}
              >
                {agent.model}
              </text>
            </g>
          );
        })}
        
        {/* Camadas de informação adicionais */}
        <g opacity="0.1">
          {/* Hexágono de fundo para dar aspecto técnico */}
          <polygon
            points="50,10 90,30 90,70 50,90 10,70 10,30"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </g>
      </svg>
      
      {/* Legenda dos modelos */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 text-xs">
        <div className="grid grid-cols-2 gap-1">
          {['GPT-4o', 'Claude-3 Opus', 'Gemini Pro', 'Mistral Large'].map(model => (
            <div key={model} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getModelColor(model) }}
              />
              <span className="font-mono">{model}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentNetwork;
