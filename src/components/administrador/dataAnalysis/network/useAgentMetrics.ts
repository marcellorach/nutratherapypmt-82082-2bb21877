
import { useState, useEffect, useRef } from 'react';
import { Agent } from '../types';

interface AgentMetrics {
  id: string;
  tokensPerSecond: number;
  requestsPerSecond: number;
  operationsPerSecond: number;
  activityHistory: number[];
  currentThroughput: string;
  metricType: 'tokens/s' | 'req/s' | 'ops/s';
}

export const useAgentMetrics = (agents: Agent[], activeAgent: string | null, isActive: boolean) => {
  const [metrics, setMetrics] = useState<Record<string, AgentMetrics>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyLength = 8; // Pontos no gráfico

  // Inicializar métricas
  useEffect(() => {
    const initialMetrics: Record<string, AgentMetrics> = {};
    
    agents.forEach(agent => {
      initialMetrics[agent.id] = {
        id: agent.id,
        tokensPerSecond: 0,
        requestsPerSecond: 0,
        operationsPerSecond: 0,
        activityHistory: new Array(historyLength).fill(0),
        currentThroughput: '0',
        metricType: getMetricType(agent.id)
      };
    });
    
    setMetrics(initialMetrics);
  }, [agents]);

  // Atualizar métricas dinamicamente
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setMetrics(prev => {
        const newMetrics = { ...prev };
        
        agents.forEach(agent => {
          const agentMetrics = newMetrics[agent.id];
          if (!agentMetrics) return;

          const isCurrentActive = activeAgent === agent.id;
          const activityMultiplier = isCurrentActive ? 2.5 : 1;
          
          // Gerar padrões únicos baseados no tipo de agente
          const newActivity = generateActivityPattern(agent.id, isCurrentActive) * activityMultiplier;
          
          // Atualizar histórico
          const newHistory = [...agentMetrics.activityHistory.slice(1), newActivity];
          
          // Calcular métricas baseadas na atividade
          const baseValue = Math.max(0.1, newActivity);
          
          newMetrics[agent.id] = {
            ...agentMetrics,
            tokensPerSecond: baseValue * getTokensMultiplier(agent.id),
            requestsPerSecond: baseValue * getRequestsMultiplier(agent.id),
            operationsPerSecond: baseValue * getOperationsMultiplier(agent.id),
            activityHistory: newHistory,
            currentThroughput: formatThroughput(baseValue, agentMetrics.metricType, agent.id)
          };
        });
        
        return newMetrics;
      });
    }, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, activeAgent, agents]);

  return metrics;
};

// Padrões de atividade únicos para cada agente
const generateActivityPattern = (agentId: string, isActive: boolean): number => {
  const baseActivity = isActive ? 0.6 : 0.2;
  const now = Date.now();
  
  switch (agentId) {
    case 'supervisor':
      // Picos regulares de coordenação
      return baseActivity + 0.3 * Math.sin(now / 3000) + 0.2 * Math.random();
    
    case 'data':
      // Processamento contínuo com variações
      return baseActivity + 0.4 * (0.5 + 0.5 * Math.sin(now / 2000)) + 0.1 * Math.random();
    
    case 'pattern':
      // Rajadas de análise intensiva
      const burst = Math.sin(now / 4000) > 0.7 ? 0.6 : 0.1;
      return baseActivity + burst + 0.2 * Math.random();
    
    case 'correlation':
      // Atividade em ondas correlacionadas
      return baseActivity + 0.5 * Math.sin(now / 2500 + 1) + 0.3 * Math.sin(now / 1200);
    
    case 'recommendation':
      // Picos quando gera recomendações
      const spike = Math.sin(now / 5000) > 0.5 ? 0.8 : 0.2;
      return baseActivity + spike + 0.1 * Math.random();
    
    case 'viz':
      // Atividade baixa até momentos de renderização
      const render = Math.sin(now / 6000) > 0.8 ? 0.9 : 0.1;
      return baseActivity + render + 0.1 * Math.random();
    
    default:
      return baseActivity + 0.3 * Math.random();
  }
};

const getMetricType = (agentId: string): 'tokens/s' | 'req/s' | 'ops/s' => {
  switch (agentId) {
    case 'supervisor':
      return 'req/s';
    case 'data':
      return 'ops/s';
    case 'pattern':
      return 'tokens/s';
    case 'correlation':
      return 'tokens/s';
    case 'recommendation':
      return 'tokens/s';
    case 'viz':
      return 'ops/s';
    default:
      return 'req/s';
  }
};

const getTokensMultiplier = (agentId: string): number => {
  switch (agentId) {
    case 'supervisor': return 150;
    case 'data': return 80;
    case 'pattern': return 320;
    case 'correlation': return 280;
    case 'recommendation': return 450;
    case 'viz': return 90;
    default: return 100;
  }
};

const getRequestsMultiplier = (agentId: string): number => {
  switch (agentId) {
    case 'supervisor': return 12;
    case 'data': return 8;
    case 'pattern': return 6;
    case 'correlation': return 9;
    case 'recommendation': return 4;
    case 'viz': return 3;
    default: return 5;
  }
};

const getOperationsMultiplier = (agentId: string): number => {
  switch (agentId) {
    case 'supervisor': return 25;
    case 'data': return 180;
    case 'pattern': return 95;
    case 'correlation': return 120;
    case 'recommendation': return 35;
    case 'viz': return 220;
    default: return 50;
  }
};

const formatThroughput = (value: number, type: 'tokens/s' | 'req/s' | 'ops/s', agentId: string): string => {
  let multiplier = 1;
  
  switch (type) {
    case 'tokens/s':
      multiplier = getTokensMultiplier(agentId);
      break;
    case 'req/s':
      multiplier = getRequestsMultiplier(agentId);
      break;
    case 'ops/s':
      multiplier = getOperationsMultiplier(agentId);
      break;
  }
  
  const result = Math.round(value * multiplier);
  return `${result} ${type}`;
};
