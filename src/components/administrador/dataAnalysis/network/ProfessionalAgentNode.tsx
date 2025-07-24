
import React from 'react';
import { Agent } from '../types';

interface ProfessionalAgentNodeProps {
  agent: Agent;
  position: { x: number; y: number };
  isActive: boolean;
  width: number;
  height: number;
  activityLevel: number;
}

const ProfessionalAgentNode: React.FC<ProfessionalAgentNodeProps> = ({
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
      case 'GPT-4o': return '#374151';
      case 'Claude-3 Opus': return '#1f2937';
      case 'Gemini Pro': return '#111827';
      case 'Mistral Large': return '#0f172a';
      default: return '#6b7280';
    }
  };

  const modelColor = getModelColor(agent.model);
  const nodeRadius = 30;
  const activeStroke = isActive ? '#3b82f6' : '#d1d5db';
  const activeStrokeWidth = isActive ? 3 : 1;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sombra sutil */}
      <circle
        cx="1"
        cy="1"
        r={nodeRadius}
        fill="rgba(0,0,0,0.1)"
        opacity="0.3"
      />

      {/* Nó principal - design corporativo */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill="#ffffff"
        stroke={activeStroke}
        strokeWidth={activeStrokeWidth}
      />

      {/* Círculo interno para indicar modelo */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius - 8}
        fill={modelColor}
        opacity="0.1"
      />

      {/* Ícone do agente - simples e profissional */}
      <g transform="translate(-6, -6)">
        <rect
          x="0"
          y="0"
          width="12"
          height="12"
          fill={modelColor}
          rx="2"
        />
        <text
          x="6"
          y="9"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="600"
        >
          {agent.model.charAt(0)}
        </text>
      </g>

      {/* Indicador de atividade discreto */}
      {isActive && (
        <circle
          cx="20"
          cy="-20"
          r="4"
          fill="#3b82f6"
        />
      )}

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 18}
        textAnchor="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="500"
      >
        {agent.name.replace('Agente de ', '')}
      </text>

      {/* Modelo do agente */}
      <text
        x="0"
        y={nodeRadius + 32}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="10"
        fontFamily="monospace"
      >
        {agent.model}
      </text>

      {/* Barra de atividade minimalista */}
      {activityLevel > 0 && (
        <rect
          x={-15}
          y={nodeRadius + 38}
          width={30 * activityLevel}
          height="2"
          fill="#3b82f6"
          opacity="0.7"
        />
      )}
    </g>
  );
};

export default ProfessionalAgentNode;
