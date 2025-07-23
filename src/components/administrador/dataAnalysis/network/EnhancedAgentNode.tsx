
import React from 'react';
import { Agent } from '../types';

interface EnhancedAgentNodeProps {
  agent: Agent;
  position: { x: number; y: number };
  isActive: boolean;
  width: number;
  height: number;
  activityLevel: number;
}

const EnhancedAgentNode: React.FC<EnhancedAgentNodeProps> = ({
  agent,
  position,
  isActive,
  width,
  height,
  activityLevel
}) => {
  const x = (position.x / 100) * width;
  const y = (position.y / 100) * height;
  
  const getModelColor = (model: string) => {
    switch (model) {
      case 'GPT-4o': return '#10b981';
      case 'Claude-3 Opus': return '#8b5cf6';
      case 'Gemini Pro': return '#3b82f6';
      case 'Mistral Large': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const modelColor = getModelColor(agent.model);
  const nodeRadius = 35 + (activityLevel * 15);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Gradiente radial para o nó */}
        <radialGradient id={`nodeGradient-${agent.id}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={modelColor} stopOpacity="0.9"/>
          <stop offset="70%" stopColor={modelColor} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={modelColor} stopOpacity="0.3"/>
        </radialGradient>
        
        {/* Filtro de brilho */}
        <filter id={`nodeGlow-${agent.id}`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Círculo de atividade (pulsação) */}
      {isActive && (
        <circle
          cx="0"
          cy="0"
          r={nodeRadius + 20}
          fill="none"
          stroke={modelColor}
          strokeWidth="2"
          opacity="0.4"
          className="animate-ping"
        />
      )}

      {/* Anéis de atividade */}
      {activityLevel > 0 && (
        <>
          <circle
            cx="0"
            cy="0"
            r={nodeRadius + 10}
            fill="none"
            stroke={modelColor}
            strokeWidth="1"
            opacity={activityLevel * 0.6}
            className="animate-pulse"
          />
          <circle
            cx="0"
            cy="0"
            r={nodeRadius + 5}
            fill="none"
            stroke={modelColor}
            strokeWidth="1"
            opacity={activityLevel * 0.8}
            className="animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
        </>
      )}

      {/* Sombra do nó */}
      <circle
        cx="2"
        cy="2"
        r={nodeRadius}
        fill="rgba(0,0,0,0.2)"
        opacity="0.6"
      />

      {/* Nó principal */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={`url(#nodeGradient-${agent.id})`}
        stroke={modelColor}
        strokeWidth={isActive ? 4 : 2}
        filter={isActive ? `url(#nodeGlow-${agent.id})` : 'none'}
        className={isActive ? 'animate-pulse' : ''}
      />

      {/* Círculo interno */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius - 8}
        fill="rgba(255,255,255,0.9)"
        stroke={modelColor}
        strokeWidth="1"
      />

      {/* Ícone do agente */}
      <g transform="translate(-8, -8)">
        <rect
          x="0"
          y="0"
          width="16"
          height="16"
          fill={modelColor}
          opacity="0.8"
          rx="2"
        />
        <text
          x="8"
          y="12"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          {agent.model.charAt(0)}
        </text>
      </g>

      {/* Indicador de processamento */}
      {isActive && (
        <g>
          <circle
            cx="15"
            cy="-15"
            r="6"
            fill={modelColor}
            className="animate-bounce"
          />
          <circle
            cx="15"
            cy="-15"
            r="3"
            fill="white"
            className="animate-ping"
          />
        </g>
      )}

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 20}
        textAnchor="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="600"
      >
        {agent.name.split(' ')[1]}
      </text>

      {/* Modelo do agente */}
      <text
        x="0"
        y={nodeRadius + 35}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="10"
        fontFamily="monospace"
      >
        {agent.model}
      </text>

      {/* Indicador de atividade */}
      {activityLevel > 0 && (
        <rect
          x="-20"
          y={nodeRadius + 45}
          width={40 * activityLevel}
          height="3"
          fill={modelColor}
          opacity="0.8"
          rx="1.5"
        />
      )}
    </g>
  );
};

export default EnhancedAgentNode;
