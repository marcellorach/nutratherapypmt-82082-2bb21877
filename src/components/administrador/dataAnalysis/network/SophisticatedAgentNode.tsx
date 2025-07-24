
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
  const nodeRadius = 42; // Reduzido de 48 para 42
  const ModelLogo = getModelLogo(agent.model);

  // Mini-gráfico corrigido - MAIOR e mais visível
  const renderActivityGraph = () => {
    if (!metrics?.activityHistory) return null;
    
    // Aumentar significativamente o tamanho do gráfico
    const graphWidth = 28;
    const graphHeight = 22;
    const marginX = 3;
    const marginY = 3;
    const frameWidth = 34;
    const frameHeight = 28;
    
    const points = metrics.activityHistory.map((value, index) => {
      const x = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
      const y = marginY + graphHeight - (value * graphHeight);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <g transform="translate(28, -2)">
        {/* Quadro de fundo com alta visibilidade */}
        <rect 
          width={frameWidth} 
          height={frameHeight} 
          fill="rgba(255,255,255,0.95)" 
          stroke="#cbd5e1" 
          strokeWidth="1.5" 
          rx="4"
          filter="url(#miniGraphShadow)"
        />
        
        {/* Grid interno mais visível */}
        <g opacity="0.4">
          <line x1="3" y1="14" x2="31" y2="14" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="17" y1="3" x2="17" y2="25" stroke="#e2e8f0" strokeWidth="1" />
        </g>
        
        {/* Clipping para o gráfico */}
        <defs>
          <clipPath id={`clip-${agent.id}`}>
            <rect x="2" y="2" width="30" height="24" />
          </clipPath>
          <filter id="miniGraphShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.15)" />
          </filter>
        </defs>
        
        <g clipPath={`url(#clip-${agent.id})`}>
          {/* Área preenchida sob a linha */}
          <polygon
            points={`3,25 ${points} 31,25`}
            fill={errorColor}
            opacity="0.2"
          />
          
          {/* Linha principal do gráfico - mais espessa e visível */}
          <polyline
            points={points}
            fill="none"
            stroke={errorColor}
            strokeWidth="3"
            opacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Pontos mais visíveis */}
          {metrics.activityHistory.map((value, index) => {
            const cx = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
            const cy = marginY + graphHeight - (value * graphHeight);
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={index === metrics.activityHistory.length - 1 ? "2.5" : "2"}
                fill={errorColor}
                opacity={index === metrics.activityHistory.length - 1 ? 1 : 0.8}
                stroke="white"
                strokeWidth="1"
              >
                {index === metrics.activityHistory.length - 1 && (
                  <animate
                    attributeName="r"
                    values="2.5;4;2.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            );
          })}
        </g>
        
        {/* Label do gráfico mais visível */}
        <text
          x={frameWidth/2}
          y={frameHeight + 12}
          textAnchor="middle"
          fill="#4b5563"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="600"
        >
          Activity
        </text>
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id={`shadow-${agent.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.15)" />
        </filter>
        
        <linearGradient id={`nodeGradient-${agent.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        
        <radialGradient id={`activeGlow-${agent.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`${errorColor}20`} />
          <stop offset="100%" stopColor={`${errorColor}00`} />
        </radialGradient>
      </defs>

      {/* Glow effect para nós ativos */}
      {isActive && (
        <circle
          cx="0"
          cy="0"
          r={nodeRadius + 8}
          fill={`url(#activeGlow-${agent.id})`}
          opacity="0.6"
        />
      )}

      {/* Nó principal */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={`url(#nodeGradient-${agent.id})`}
        stroke={isActive ? errorColor : '#d1d5db'}
        strokeWidth={isActive ? 3 : 2}
        filter={`url(#shadow-${agent.id})`}
        className={`transition-all duration-300 ${
          metrics?.errorState === 'error' ? 'animate-pulse' : ''
        }`}
      />

      {/* Círculo interno para o modelo */}
      <circle
        cx="0"
        cy="-8"
        r={nodeRadius - 18}
        fill={modelColor}
        opacity="0.12"
        stroke={modelColor}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      {/* Logo do modelo AI */}
      <g transform="translate(-12, -20)">
        <ModelLogo size={24} />
      </g>

      {/* Indicador de status */}
      {isActive && (
        <g>
          <circle
            cx="28"
            cy="-28"
            r="6"
            fill="white"
            stroke={
              metrics?.errorState === 'error' ? '#ef4444' :
              metrics?.errorState === 'warning' ? '#f59e0b' :
              metrics?.errorState === 'recovery' ? '#10b981' : '#10b981'
            }
            strokeWidth="2"
            className={metrics?.errorState === 'error' ? 'animate-pulse' : ''}
          />
          <circle
            cx="28"
            cy="-28"
            r="3"
            fill={
              metrics?.errorState === 'error' ? '#ef4444' :
              metrics?.errorState === 'warning' ? '#f59e0b' :
              metrics?.errorState === 'recovery' ? '#10b981' : '#10b981'
            }
            className={metrics?.errorState === 'error' ? 'animate-pulse' : ''}
          />
        </g>
      )}

      {/* Barra de processamento */}
      <g transform="translate(-30, 46)">
        <rect
          x="0"
          y="0"
          width="60"
          height="4"
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth="0.5"
          rx="2"
        />
        <rect
          x="1"
          y="1"
          width={58 * (processingProgress / 100)}
          height="2"
          fill={errorColor}
          rx="1"
          opacity="0.9"
        />
        <text
          x="30"
          y="14"
          textAnchor="middle"
          fill="#64748b"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="600"
        >
          {processingProgress.toFixed(0)}%
        </text>
      </g>

      {/* Métricas de performance */}
      <g transform="translate(-32, 62)">
        <rect
          x="0"
          y="0"
          width="64"
          height="28"
          fill="rgba(255,255,255,0.98)"
          stroke="#e2e8f0"
          strokeWidth="1"
          rx="4"
          filter="url(#shadow-${agent.id})"
        />
        
        <text
          x="6"
          y="10"
          fill="#374151"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="600"
        >
          CPU: {cpuUsage.toFixed(0)}%
        </text>
        
        <text
          x="6"
          y="20"
          fill="#374151"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="600"
        >
          MEM: {memoryUsage.toFixed(0)}%
        </text>
        
        {/* Mini-gráfico otimizado */}
        {renderActivityGraph()}
      </g>

      {/* TAG de throughput dinâmico - MELHORADA E MAIS VISÍVEL */}
      {metrics && (
        <g transform="translate(-30, 100)">
          <rect
            x="0"
            y="0"
            width="60"
            height="24"
            fill="rgba(255,255,255,0.98)"
            stroke={errorColor}
            strokeWidth="2"
            rx="6"
            filter="url(#shadow-${agent.id})"
          />
          
          {/* Background com cor do estado mais visível */}
          <rect
            x="2"
            y="2"
            width="56"
            height="20"
            fill={errorColor}
            opacity="0.12"
            rx="4"
          />
          
          <text
            x="30"
            y="10"
            textAnchor="middle"
            fill="#6b7280"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="600"
          >
            {metrics.metricType.toUpperCase()}
          </text>
          
          <text
            x="30"
            y="19"
            textAnchor="middle"
            fill="#1f2937"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="700"
          >
            {metrics.currentThroughput.split(' ')[0]}
          </text>
        </g>
      )}

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 130}
        textAnchor="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {agent.name.replace('Agente de ', '')}
      </text>

      {/* Modelo do agente */}
      <text
        x="0"
        y={nodeRadius + 145}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="600"
      >
        {agent.model}
      </text>

      {/* Indicador de atividade */}
      {activityLevel > 0 && (
        <g transform={`translate(-20, ${nodeRadius + 150})`}>
          <rect
            x="0"
            y="0"
            width="40"
            height="3"
            fill="#f1f5f9"
            rx="1.5"
          />
          <rect
            x="0"
            y="0"
            width={40 * activityLevel}
            height="3"
            fill={errorColor}
            opacity="0.8"
            rx="1.5"
          />
        </g>
      )}
    </g>
  );
};

export default SophisticatedAgentNode;
