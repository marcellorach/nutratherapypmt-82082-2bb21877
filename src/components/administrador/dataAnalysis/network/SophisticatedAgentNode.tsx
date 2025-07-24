
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
    errorState: 'none' | 'warning' | 'error' | 'recovery';
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

  const getErrorColor = (errorState: string) => {
    switch (errorState) {
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'recovery': return '#10b981';
      default: return getModelColor(agent.model);
    }
  };

  const modelColor = getModelColor(agent.model);
  const errorColor = getErrorColor(metrics?.errorState || 'none');
  const nodeRadius = 48;
  const ModelLogo = getModelLogo(agent.model);

  // Renderizar gráfico de atividade animado - CORRIGIDO para ficar dentro do quadro
  const renderActivityGraph = () => {
    if (!metrics?.activityHistory) return null;
    
    // Garantir que os pontos fiquem dentro do quadro 16x14 (com margem de 2px)
    const graphWidth = 14;
    const graphHeight = 12;
    const marginX = 2;
    const marginY = 2;
    
    const points = metrics.activityHistory.map((value, index) => {
      const x = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
      const y = marginY + graphHeight - (value * graphHeight);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <g transform="translate(35, 2)">
        {/* Quadro de fundo */}
        <rect width="18" height="16" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
        
        {/* Clipping para garantir que não saia do quadro */}
        <defs>
          <clipPath id={`clip-${agent.id}`}>
            <rect x="1" y="1" width="16" height="14" />
          </clipPath>
        </defs>
        
        <g clipPath={`url(#clip-${agent.id})`}>
          {/* Linha do gráfico */}
          <polyline
            points={points}
            fill="none"
            stroke={errorColor}
            strokeWidth="1.5"
            opacity="0.8"
          />
          
          {/* Pontos animados */}
          {metrics.activityHistory.map((value, index) => {
            const cx = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
            const cy = marginY + graphHeight - (value * graphHeight);
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r="0.8"
                fill={errorColor}
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

      {/* Nó principal com cor baseada no estado de erro */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={`url(#nodeGradient-${agent.id})`}
        stroke={isActive ? errorColor : '#d1d5db'}
        strokeWidth={isActive ? 3 : 1}
        className={`transition-all duration-300 ${
          metrics?.errorState === 'error' ? 'animate-pulse' : ''
        }`}
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

      {/* Indicador de status com cores de erro */}
      {isActive && (
        <circle
          cx="28"
          cy="-28"
          r="5"
          fill={
            metrics?.errorState === 'error' ? '#ef4444' :
            metrics?.errorState === 'warning' ? '#f59e0b' :
            metrics?.errorState === 'recovery' ? '#10b981' : '#10b981'
          }
          className={metrics?.errorState === 'error' ? 'animate-pulse' : ''}
          style={{ animationDuration: '1s' }}
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
          fill={errorColor}
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
          fill={errorColor}
          opacity="0.7"
          rx="1.5"
        />
      )}
    </g>
  );
};

export default SophisticatedAgentNode;
