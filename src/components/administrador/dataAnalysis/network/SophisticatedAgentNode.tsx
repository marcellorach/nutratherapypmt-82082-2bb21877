
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
  const nodeRadius = 48; // Mantém o tamanho 50% maior
  const ModelLogo = getModelLogo(agent.model);

  // Mini-gráfico otimizado - AUMENTADO e mais visível
  const renderActivityGraph = () => {
    if (!metrics?.activityHistory) return null;
    
    // Aumentar o tamanho do quadro para melhor visibilidade
    const graphWidth = 18;
    const graphHeight = 16;
    const marginX = 2;
    const marginY = 2;
    const frameWidth = 22;
    const frameHeight = 20;
    
    const points = metrics.activityHistory.map((value, index) => {
      const x = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
      const y = marginY + graphHeight - (value * graphHeight);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <g transform="translate(40, 2)">
        {/* Quadro de fundo com melhor contraste */}
        <rect 
          width={frameWidth} 
          height={frameHeight} 
          fill="#ffffff" 
          stroke="#cbd5e1" 
          strokeWidth="1" 
          rx="3"
          filter="url(#miniGraphShadow)"
        />
        
        {/* Grid interno sutil */}
        <g opacity="0.3">
          <line x1="2" y1="10" x2="20" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="11" y1="2" x2="11" y2="18" stroke="#e2e8f0" strokeWidth="0.5" />
        </g>
        
        {/* Clipping para garantir que não saia do quadro */}
        <defs>
          <clipPath id={`clip-${agent.id}`}>
            <rect x="1" y="1" width="20" height="18" />
          </clipPath>
          <filter id="miniGraphShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.1)" />
          </filter>
        </defs>
        
        <g clipPath={`url(#clip-${agent.id})`}>
          {/* Área preenchida sob a linha */}
          <polygon
            points={`2,18 ${points} 20,18`}
            fill={errorColor}
            opacity="0.15"
          />
          
          {/* Linha principal do gráfico - mais espessa */}
          <polyline
            points={points}
            fill="none"
            stroke={errorColor}
            strokeWidth="2"
            opacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Pontos animados - mais visíveis */}
          {metrics.activityHistory.map((value, index) => {
            const cx = marginX + (index / (metrics.activityHistory.length - 1)) * graphWidth;
            const cy = marginY + graphHeight - (value * graphHeight);
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={index === metrics.activityHistory.length - 1 ? "1.5" : "1"}
                fill={errorColor}
                opacity={index === metrics.activityHistory.length - 1 ? 1 : 0.7}
                stroke="white"
                strokeWidth="0.5"
              >
                {index === metrics.activityHistory.length - 1 && (
                  <animate
                    attributeName="r"
                    values="1.5;2.5;1.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            );
          })}
        </g>
        
        {/* Label do gráfico */}
        <text
          x={frameWidth/2}
          y={frameHeight + 8}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="500"
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

      {/* Sombra do nó */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill="white"
        filter={`url(#shadow-${agent.id})`}
      />

      {/* Nó principal com melhor contraste */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={`url(#nodeGradient-${agent.id})`}
        stroke={isActive ? errorColor : '#d1d5db'}
        strokeWidth={isActive ? 3 : 2}
        className={`transition-all duration-300 ${
          metrics?.errorState === 'error' ? 'animate-pulse' : ''
        }`}
      />

      {/* Círculo interno para o modelo com melhor destaque */}
      <circle
        cx="0"
        cy="-10"
        r={nodeRadius - 18}
        fill={modelColor}
        opacity="0.12"
        stroke={modelColor}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      {/* Logo do modelo AI - melhor posicionamento */}
      <g transform="translate(-14, -22)">
        <ModelLogo size={28} />
      </g>

      {/* Indicador de status com melhor visibilidade */}
      {isActive && (
        <g>
          <circle
            cx="32"
            cy="-32"
            r="7"
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
            cx="32"
            cy="-32"
            r="4"
            fill={
              metrics?.errorState === 'error' ? '#ef4444' :
              metrics?.errorState === 'warning' ? '#f59e0b' :
              metrics?.errorState === 'recovery' ? '#10b981' : '#10b981'
            }
            className={metrics?.errorState === 'error' ? 'animate-pulse' : ''}
          />
        </g>
      )}

      {/* Barra de processamento melhorada */}
      <g transform="translate(-35, 52)">
        <rect
          x="0"
          y="0"
          width="70"
          height="5"
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth="0.5"
          rx="2.5"
        />
        <rect
          x="1"
          y="1"
          width={68 * (processingProgress / 100)}
          height="3"
          fill={errorColor}
          rx="1.5"
          opacity="0.9"
        />
        <text
          x="35"
          y="16"
          textAnchor="middle"
          fill="#64748b"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="600"
        >
          {processingProgress.toFixed(0)}%
        </text>
      </g>

      {/* Métricas de performance otimizadas */}
      <g transform="translate(-40, 70)">
        <rect
          x="0"
          y="0"
          width="80"
          height="32"
          fill="rgba(255,255,255,0.98)"
          stroke="#e2e8f0"
          strokeWidth="1"
          rx="6"
          filter="url(#shadow-${agent.id})"
        />
        
        <text
          x="8"
          y="12"
          fill="#374151"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="600"
        >
          CPU: {cpuUsage.toFixed(0)}%
        </text>
        
        <text
          x="8"
          y="24"
          fill="#374151"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="600"
        >
          MEM: {memoryUsage.toFixed(0)}%
        </text>
        
        {/* Mini-gráfico otimizado */}
        {renderActivityGraph()}
      </g>

      {/* TAG de throughput dinâmico - MELHORADA */}
      {metrics && (
        <g transform="translate(-35, 110)">
          <rect
            x="0"
            y="0"
            width="70"
            height="22"
            fill="rgba(255,255,255,0.95)"
            stroke={errorColor}
            strokeWidth="2"
            rx="6"
            filter="url(#shadow-${agent.id})"
          />
          
          {/* Background com cor do estado */}
          <rect
            x="2"
            y="2"
            width="66"
            height="18"
            fill={errorColor}
            opacity="0.08"
            rx="4"
          />
          
          <text
            x="35"
            y="8"
            textAnchor="middle"
            fill="#6b7280"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="500"
          >
            {metrics.metricType.toUpperCase()}
          </text>
          
          <text
            x="35"
            y="17"
            textAnchor="middle"
            fill="#374151"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="700"
          >
            {metrics.currentThroughput.split(' ')[0]}
          </text>
        </g>
      )}

      {/* Nome do agente com melhor tipografia */}
      <text
        x="0"
        y={nodeRadius + 140}
        textAnchor="middle"
        fill="#374151"
        fontSize="13"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {agent.name.replace('Agente de ', '')}
      </text>

      {/* Modelo do agente com destaque */}
      <text
        x="0"
        y={nodeRadius + 157}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="11"
        fontFamily="monospace"
        fontWeight="600"
      >
        {agent.model}
      </text>

      {/* Indicador de atividade melhorado */}
      {activityLevel > 0 && (
        <g transform={`translate(-25, ${nodeRadius + 165})`}>
          <rect
            x="0"
            y="0"
            width="50"
            height="4"
            fill="#f1f5f9"
            rx="2"
          />
          <rect
            x="0"
            y="0"
            width={50 * activityLevel}
            height="4"
            fill={errorColor}
            opacity="0.8"
            rx="2"
          />
        </g>
      )}
    </g>
  );
};

export default SophisticatedAgentNode;
