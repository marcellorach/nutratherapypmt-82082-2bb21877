
import React, { useState, useEffect } from 'react';
import { Agent } from '../types';

interface SophisticatedAgentNodeProps {
  agent: Agent;
  position: { x: number; y: number };
  isActive: boolean;
  width: number;
  height: number;
  activityLevel: number;
}

const SophisticatedAgentNode: React.FC<SophisticatedAgentNodeProps> = ({
  agent,
  position,
  isActive,
  width,
  height,
  activityLevel
}) => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  const x = (position.x / 100) * width;
  const y = (position.y / 100) * height;
  
  // Simular métricas de performance
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = (prev + 20) % 100;
          if (newProgress === 0) {
            // Resetar ciclo
            setCpuUsage(Math.random() * 80 + 20);
            setMemoryUsage(Math.random() * 60 + 30);
          }
          return newProgress;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setProcessingProgress(0);
      setCpuUsage(Math.random() * 30 + 10);
      setMemoryUsage(Math.random() * 40 + 20);
    }
  }, [isActive]);

  const getModelColor = (model: string) => {
    switch (model) {
      case 'GPT-4o': return '#1e40af';
      case 'Claude-3 Opus': return '#166534';
      case 'Gemini Pro': return '#7c2d12';
      case 'Mistral Large': return '#581c87';
      default: return '#374151';
    }
  };

  const modelColor = getModelColor(agent.model);
  const nodeRadius = 32;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id={`shadow-${agent.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
        </filter>
        
        <linearGradient id={`nodeGradient-${agent.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>

      {/* Sombra do nó */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill="white"
        filter={`url(#shadow-${agent.id})`}
      />

      {/* Nó principal */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={`url(#nodeGradient-${agent.id})`}
        stroke={isActive ? modelColor : '#d1d5db'}
        strokeWidth={isActive ? 2 : 1}
        className="transition-all duration-300"
      />

      {/* Círculo interno para o modelo */}
      <circle
        cx="0"
        cy="-5"
        r={nodeRadius - 12}
        fill={modelColor}
        opacity="0.1"
      />

      {/* Ícone do agente */}
      <g transform="translate(-6, -8)">
        <rect
          x="0"
          y="0"
          width="12"
          height="12"
          fill={modelColor}
          rx="2"
          opacity="0.9"
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

      {/* Indicador de status */}
      {isActive && (
        <circle
          cx="18"
          cy="-18"
          r="4"
          fill="#10b981"
          className="animate-pulse"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Barra de processamento */}
      <g transform="translate(-25, 40)">
        <rect
          x="0"
          y="0"
          width="50"
          height="3"
          fill="#f1f5f9"
          rx="1.5"
        />
        <rect
          x="0"
          y="0"
          width={50 * (processingProgress / 100)}
          height="3"
          fill={modelColor}
          rx="1.5"
          opacity="0.8"
        />
        <text
          x="25"
          y="12"
          textAnchor="middle"
          fill="#64748b"
          fontSize="7"
          fontFamily="monospace"
        >
          {processingProgress.toFixed(0)}%
        </text>
      </g>

      {/* Métricas de performance */}
      <g transform="translate(-30, 55)">
        <rect
          x="0"
          y="0"
          width="60"
          height="25"
          fill="rgba(255,255,255,0.9)"
          stroke="#e2e8f0"
          strokeWidth="1"
          rx="3"
        />
        
        <text
          x="5"
          y="8"
          fill="#374151"
          fontSize="6"
          fontFamily="monospace"
        >
          CPU: {cpuUsage.toFixed(0)}%
        </text>
        
        <text
          x="5"
          y="18"
          fill="#374151"
          fontSize="6"
          fontFamily="monospace"
        >
          MEM: {memoryUsage.toFixed(0)}%
        </text>
        
        {/* Mini gráfico de atividade */}
        <g transform="translate(35, 2)">
          <rect width="20" height="20" fill="#f8fafc" rx="2" />
          <polyline
            points="2,15 6,8 10,12 14,6 18,10"
            fill="none"
            stroke={modelColor}
            strokeWidth="1"
            opacity="0.7"
          />
        </g>
      </g>

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 95}
        textAnchor="middle"
        fill="#374151"
        fontSize="11"
        fontWeight="600"
      >
        {agent.name.replace('Agente de ', '')}
      </text>

      {/* Modelo do agente */}
      <text
        x="0"
        y={nodeRadius + 108}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="9"
        fontFamily="monospace"
      >
        {agent.model}
      </text>

      {/* Indicador de atividade */}
      {activityLevel > 0 && (
        <rect
          x="-15"
          y={nodeRadius + 115}
          width={30 * activityLevel}
          height="2"
          fill={modelColor}
          opacity="0.6"
          rx="1"
        />
      )}
    </g>
  );
};

export default SophisticatedAgentNode;
