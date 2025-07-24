
import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { getModelLogo } from './ModelLogos';

interface SophisticatedAgentNodeProps {
  agent: Agent;
  position: { x: number; y: number };
  isActive: boolean;
  width: number;
  height: number;
  activityLevel: number;
  metrics?: {
    tokensPerSecond: number;
    requestsPerSecond: number;
    operationsPerSecond: number;
    activityHistory: number[];
    currentThroughput: string;
    metricType: 'tokens/s' | 'req/s' | 'ops/s';
  };
}

const SophisticatedAgentNode: React.FC<SophisticatedAgentNodeProps> = ({
  agent,
  position,
  isActive,
  width,
  height,
  activityLevel,
  metrics
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
          const newProgress = (prev + 15) % 100;
          if (newProgress === 0) {
            // Resetar ciclo
            setCpuUsage(Math.random() * 60 + 40);
            setMemoryUsage(Math.random() * 50 + 35);
          }
          return newProgress;
        });
      }, 400);
      
      return () => clearInterval(interval);
    } else {
      setProcessingProgress(0);
      setCpuUsage(Math.random() * 25 + 15);
      setMemoryUsage(Math.random() * 30 + 20);
    }
  }, [isActive]);

  const getModelColor = (model: string) => {
    switch (model) {
      case 'GPT-4o': return '#1e40af';
      case 'Claude-3 Opus': return '#d97706';
      case 'Gemini Pro': return '#059669';
      case 'Mistral Large': return '#7c3aed';
      default: return '#374151';
    }
  };

  const modelColor = getModelColor(agent.model);
  const nodeRadius = 48; // Aumentado de 32 para 48 (50% maior)
  const ModelLogo = getModelLogo(agent.model);

  // Renderizar gráfico de atividade animado
  const renderActivityGraph = () => {
    if (!metrics?.activityHistory) return null;
    
    const points = metrics.activityHistory.map((value, index) => {
      const x = (index / (metrics.activityHistory.length - 1)) * 16;
      const y = 16 - (value * 12);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <g transform="translate(35, 2)">
        <rect width="18" height="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
        <polyline
          points={points}
          fill="none"
          stroke={modelColor}
          strokeWidth="1.5"
          opacity="0.8"
        />
        {/* Pontos animados */}
        {metrics.activityHistory.map((value, index) => {
          const cx = (index / (metrics.activityHistory.length - 1)) * 16;
          const cy = 16 - (value * 12);
          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r="0.8"
              fill={modelColor}
              opacity={index === metrics.activityHistory.length - 1 ? 1 : 0.6}
            >
              {index === metrics.activityHistory.length - 1 && (
                <animate
                  attributeName="r"
                  values="0.8;1.2;0.8"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          );
        })}
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id={`shadow-${agent.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.1)" />
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
        strokeWidth={isActive ? 3 : 1}
        className="transition-all duration-300"
      />

      {/* Círculo interno para o modelo */}
      <circle
        cx="0"
        cy="-8"
        r={nodeRadius - 16}
        fill={modelColor}
        opacity="0.08"
      />

      {/* Logo do modelo AI */}
      <g transform="translate(-12, -20)">
        <ModelLogo size={24} />
      </g>

      {/* Indicador de status */}
      {isActive && (
        <circle
          cx="28"
          cy="-28"
          r="5"
          fill="#10b981"
          className="animate-pulse"
          style={{ animationDuration: '1.5s' }}
        />
      )}

      {/* Barra de processamento */}
      <g transform="translate(-30, 50)">
        <rect
          x="0"
          y="0"
          width="60"
          height="4"
          fill="#f1f5f9"
          rx="2"
        />
        <rect
          x="0"
          y="0"
          width={60 * (processingProgress / 100)}
          height="4"
          fill={modelColor}
          rx="2"
          opacity="0.8"
        />
        <text
          x="30"
          y="14"
          textAnchor="middle"
          fill="#64748b"
          fontSize="8"
          fontFamily="monospace"
        >
          {processingProgress.toFixed(0)}%
        </text>
      </g>

      {/* Métricas de performance */}
      <g transform="translate(-35, 65)">
        <rect
          x="0"
          y="0"
          width="70"
          height="28"
          fill="rgba(255,255,255,0.95)"
          stroke="#e2e8f0"
          strokeWidth="1"
          rx="4"
        />
        
        <text
          x="6"
          y="10"
          fill="#374151"
          fontSize="7"
          fontFamily="monospace"
        >
          CPU: {cpuUsage.toFixed(0)}%
        </text>
        
        <text
          x="6"
          y="21"
          fill="#374151"
          fontSize="7"
          fontFamily="monospace"
        >
          MEM: {memoryUsage.toFixed(0)}%
        </text>
        
        {/* Gráfico de atividade animado */}
        {renderActivityGraph()}
      </g>

      {/* Indicador de throughput dinâmico */}
      {metrics && (
        <g transform="translate(-25, 100)">
          <rect
            x="0"
            y="0"
            width="50"
            height="16"
            fill="rgba(255,255,255,0.9)"
            stroke="#e2e8f0"
            strokeWidth="1"
            rx="3"
          />
          <text
            x="25"
            y="10"
            textAnchor="middle"
            fill="#374151"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="500"
          >
            {metrics.currentThroughput}
          </text>
        </g>
      )}

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 125}
        textAnchor="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="600"
      >
        {agent.name.replace('Agente de ', '')}
      </text>

      {/* Modelo do agente */}
      <text
        x="0"
        y={nodeRadius + 140}
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
          y={nodeRadius + 145}
          width={40 * activityLevel}
          height="3"
          fill={modelColor}
          opacity="0.7"
          rx="1.5"
        />
      )}
    </g>
  );
};

export default SophisticatedAgentNode;
