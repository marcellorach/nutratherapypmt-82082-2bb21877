
import React, { useState, useEffect, useCallback } from 'react';
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
  const [graphData, setGraphData] = useState<number[]>([]);
  const [throughputValue, setThroughputValue] = useState(0);
  const [latencyValue, setLatencyValue] = useState(0);

  const x = (position.x / 100) * width;
  const y = (position.y / 100) * height;
  
  // Gerar dados dinâmicos para o mini-gráfico
  const generateGraphData = useCallback(() => {
    const baseActivity = isActive ? 0.7 : 0.3;
    const variation = activityLevel * 0.4;
    const newPoint = Math.max(0.1, Math.min(0.9, baseActivity + (Math.random() - 0.5) * variation));
    
    setGraphData(prev => {
      const newData = [...prev, newPoint];
      return newData.slice(-8); // Manter apenas 8 pontos
    });
  }, [isActive, activityLevel]);

  // Simular métricas de performance
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = (prev + 15) % 100;
          if (newProgress === 0) {
            setCpuUsage(Math.random() * 80 + 20);
            setMemoryUsage(Math.random() * 60 + 30);
          }
          return newProgress;
        });
        
        // Atualizar throughput e latência
        setThroughputValue(prev => {
          const base = agent.model === 'GPT-4o' ? 2.5 : 
                      agent.model === 'Claude-3 Opus' ? 2.1 : 
                      agent.model === 'Gemini Pro' ? 2.8 : 1.9;
          return base + (Math.random() - 0.5) * 0.8;
        });
        
        setLatencyValue(prev => {
          const base = agent.model === 'GPT-4o' ? 45 : 
                      agent.model === 'Claude-3 Opus' ? 38 : 
                      agent.model === 'Gemini Pro' ? 52 : 41;
          return base + (Math.random() - 0.5) * 20;
        });
      }, 500);
      
      // Atualizar gráfico mais frequentemente
      const graphInterval = setInterval(generateGraphData, 800);
      
      return () => {
        clearInterval(interval);
        clearInterval(graphInterval);
      };
    } else {
      setProcessingProgress(0);
      setCpuUsage(Math.random() * 30 + 10);
      setMemoryUsage(Math.random() * 40 + 20);
      setThroughputValue(0.1);
      setLatencyValue(120);
    }
  }, [isActive, generateGraphData]);

  // Inicializar dados do gráfico
  useEffect(() => {
    if (graphData.length === 0) {
      const initialData = Array.from({ length: 8 }, () => Math.random() * 0.5 + 0.2);
      setGraphData(initialData);
    }
  }, [graphData.length]);

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
  const nodeRadius = 42;

  // Criar pontos do gráfico
  const createGraphPoints = () => {
    if (graphData.length < 2) return '';
    
    const graphWidth = 24;
    const graphHeight = 20;
    const stepX = graphWidth / (graphData.length - 1);
    
    return graphData.map((value, index) => {
      const x = index * stepX;
      const y = graphHeight - (value * graphHeight);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id={`shadow-${agent.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.15)" />
        </filter>
        
        <linearGradient id={`nodeGradient-${agent.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        
        <linearGradient id={`graphGradient-${agent.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={modelColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={modelColor} stopOpacity="0.3" />
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
        cy="-8"
        r={nodeRadius - 15}
        fill={modelColor}
        opacity="0.1"
      />

      {/* Ícone do agente */}
      <g transform="translate(-6, -10)">
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
          cx="22"
          cy="-22"
          r="4"
          fill="#10b981"
          className="animate-pulse"
          style={{ animationDuration: '1.5s' }}
        />
      )}

      {/* Mini-gráfico melhorado */}
      <g transform="translate(-12, 8)">
        {/* Fundo do gráfico */}
        <rect
          x="0"
          y="0"
          width="24"
          height="20"
          fill="rgba(255,255,255,0.9)"
          stroke={modelColor}
          strokeWidth="0.5"
          rx="2"
          opacity="0.8"
        />
        
        {/* Área do gráfico */}
        {graphData.length > 1 && (
          <polygon
            points={`0,20 ${createGraphPoints()} 24,20`}
            fill={`url(#graphGradient-${agent.id})`}
            opacity="0.6"
          />
        )}
        
        {/* Linha do gráfico */}
        {graphData.length > 1 && (
          <polyline
            points={createGraphPoints()}
            fill="none"
            stroke={modelColor}
            strokeWidth="1.5"
            opacity="0.9"
          />
        )}
        
        {/* Pontos destacados */}
        {graphData.map((value, index) => {
          if (index === graphData.length - 1) {
            const x = (index / (graphData.length - 1)) * 24;
            const y = 20 - (value * 20);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={modelColor}
                opacity="0.9"
                className={isActive ? "animate-pulse" : ""}
              />
            );
          }
          return null;
        })}
      </g>

      {/* Tag de throughput dinâmica */}
      {isActive && (
        <g transform="translate(-20, 35)">
          <rect
            x="0"
            y="0"
            width="40"
            height="12"
            fill="rgba(255,255,255,0.95)"
            stroke={modelColor}
            strokeWidth="0.8"
            rx="2"
          />
          <text
            x="20"
            y="8"
            textAnchor="middle"
            fill={modelColor}
            fontSize="7"
            fontWeight="600"
            fontFamily="monospace"
          >
            {throughputValue.toFixed(1)}k tok/s
          </text>
        </g>
      )}

      {/* Barra de processamento */}
      <g transform="translate(-18, 50)">
        <rect
          x="0"
          y="0"
          width="36"
          height="3"
          fill="#f1f5f9"
          rx="1.5"
        />
        <rect
          x="0"
          y="0"
          width={36 * (processingProgress / 100)}
          height="3"
          fill={modelColor}
          rx="1.5"
          opacity="0.8"
        />
        <text
          x="18"
          y="12"
          textAnchor="middle"
          fill="#64748b"
          fontSize="7"
          fontFamily="monospace"
        >
          {processingProgress.toFixed(0)}%
        </text>
      </g>

      {/* Métricas de performance aprimoradas */}
      <g transform="translate(-25, 65)">
        <rect
          x="0"
          y="0"
          width="50"
          height="28"
          fill="rgba(255,255,255,0.95)"
          stroke="#e2e8f0"
          strokeWidth="1"
          rx="3"
        />
        
        <text
          x="4"
          y="8"
          fill="#374151"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="500"
        >
          CPU: {cpuUsage.toFixed(0)}%
        </text>
        
        <text
          x="4"
          y="16"
          fill="#374151"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="500"
        >
          MEM: {memoryUsage.toFixed(0)}%
        </text>
        
        <text
          x="4"
          y="24"
          fill="#374151"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="500"
        >
          {latencyValue.toFixed(0)}ms
        </text>
      </g>

      {/* Nome do agente */}
      <text
        x="0"
        y={nodeRadius + 105}
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
        y={nodeRadius + 118}
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
          y={nodeRadius + 125}
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
