
import { useState, useRef, useEffect } from 'react';
import { AgentConnection, AgentMessage, DataPacket, AnalysisStep } from './types';
import { agents, createInitialConnections } from './agentData';

type AnalysisFlowItem = {
  delay: number;
  action: () => void;
};

export const useAnalysisSimulation = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<AnalysisStep>('waiting');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [connections, setConnections] = useState<AgentConnection[]>(createInitialConnections());
  const [isPaused, setIsPaused] = useState(false);
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);
  
  const animationTimersRef = useRef<number[]>([]);
  const analysisRef = useRef<{
    flowIndex: number;
    isPaused: boolean;
    totalTime: number;
    startTime: number;
    elapsedBeforePause: number;
  }>({
    flowIndex: 0,
    isPaused: false,
    totalTime: 65000, // Aumentado para incluir erros
    startTime: 0,
    elapsedBeforePause: 0,
  });
  
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    };
  }, []);
  
  const activateConnection = (fromId: string, toId: string, connectionType: 'normal' | 'warning' | 'error' = 'normal') => {
    if (isPaused) return;
    
    setConnections(prev => 
      prev.map(conn => 
        conn.from === fromId && conn.to === toId
          ? { ...conn, active: true, animating: true, connectionType }
          : conn
      )
    );
    
    const newPacket: DataPacket = {
      fromId,
      toId,
      startTime: Date.now(),
      duration: 2000,
    };
    
    setDataPackets(prev => [...prev, newPacket]);
    
    const timer = window.setTimeout(() => {
        setConnections(prev => 
          prev.map(conn => 
            conn.from === fromId && conn.to === toId
              ? { ...conn, animating: false, connectionType: connectionType === 'error' ? 'normal' : connectionType }
              : conn
          )
        );
      
      setDataPackets(prev => prev.filter(p => !(p.fromId === fromId && p.toId === toId)));
    }, 2000);
    
    animationTimersRef.current.push(timer);
  };
  
  const addAgentMessage = (agentId: string, message: string) => {
    if (isPaused) return;
    
    setMessages(prev => [...prev, {
      agentId,
      message,
      timestamp: new Date()
    }]);
    setActiveAgent(agentId);

    // Detectar tipo de mensagem e definir estado do agente
    if (typeof window.setAgentError === 'function') {
      if (message.includes('WARNING') || message.includes('Quebra') || message.includes('reboot')) {
        window.setAgentError(agentId, 'warning');
      } else if (message.includes('ERROR') || message.includes('Falha')) {
        window.setAgentError(agentId, 'error');
      } else if (message.includes('sucesso') || message.includes('concluída') || message.includes('restaurado')) {
        window.setAgentError(agentId, 'recovery');
        // Voltar ao normal após 2 segundos
        setTimeout(() => {
          if (typeof window.setAgentError === 'function') {
            window.setAgentError(agentId, 'none');
          }
        }, 2000);
      }
    }
  };
  
  // Sequência expandida com erros e recuperação
  const analysisFlow: AnalysisFlowItem[] = [
    { delay: 1000, action: () => addAgentMessage('supervisor', 'Iniciando análise multi-agente. Coordenando especialistas...') },
    { delay: 2000, action: () => addAgentMessage('data', 'Claude-3 Opus carregando 2.341 registros de pets...') },
    { delay: 1500, action: () => activateConnection('supervisor', 'data') },
    { delay: 2000, action: () => addAgentMessage('data', 'Processando dados clínicos: raças, idades, condições de saúde...') },
    { delay: 1800, action: () => activateConnection('supervisor', 'pattern') },
    { delay: 2200, action: () => addAgentMessage('pattern', 'Gemini Pro identificando padrões em 1.876 exames...') },
    { delay: 1500, action: () => activateConnection('data', 'pattern') },
    
    // ERRO AOS 25% - Quebra de processamento
    { delay: 2500, action: () => addAgentMessage('data', 'WARNING: Quebra de processamento detectada no módulo de análise...') },
    { delay: 1000, action: () => activateConnection('data', 'pattern', 'warning') },
    { delay: 1500, action: () => addAgentMessage('data', 'Executando reboot automático...') },
    { delay: 2000, action: () => addAgentMessage('data', 'Reboot concluído com sucesso. Retomando processamento...') },
    { delay: 1000, action: () => activateConnection('supervisor', 'data') },
    
    { delay: 2000, action: () => addAgentMessage('pattern', 'Detectados 12 clusters de condições por raça e idade...') },
    { delay: 2000, action: () => activateConnection('supervisor', 'correlation') },
    { delay: 2300, action: () => addAgentMessage('correlation', 'Mistral Large analisando correlações entre tratamentos...') },
    { delay: 1500, action: () => activateConnection('pattern', 'correlation') },
    
    // ERRO AOS 45% - Erro crítico
    { delay: 2000, action: () => addAgentMessage('correlation', 'ERROR: Falha crítica no processamento de correlações...') },
    { delay: 1000, action: () => activateConnection('correlation', 'supervisor', 'error') },
    { delay: 1500, action: () => addAgentMessage('correlation', 'Reprocessando... Procurando alternativas...') },
    { delay: 2000, action: () => addAgentMessage('correlation', 'Novo processo iniciado com algoritmo alternativo...') },
    { delay: 1500, action: () => addAgentMessage('correlation', 'Processamento restaurado com sucesso!') },
    
    { delay: 2000, action: () => addAgentMessage('correlation', 'Matriz de correlação: 89% de eficácia em tratamentos combinados...') },
    { delay: 2000, action: () => activateConnection('supervisor', 'recommendation') },
    { delay: 2400, action: () => addAgentMessage('recommendation', 'GPT-4o gerando recomendações personalizadas...') },
    { delay: 1800, action: () => activateConnection('correlation', 'recommendation') },
    { delay: 3000, action: () => addAgentMessage('recommendation', 'Consultando base de 247 nutracêuticos validados...') },
    { delay: 2200, action: () => addAgentMessage('recommendation', '1.156 recomendações geradas com base em evidências...') },
    { delay: 2000, action: () => activateConnection('supervisor', 'viz') },
    { delay: 2500, action: () => addAgentMessage('viz', 'Gemini Pro preparando visualizações interativas...') },
    { delay: 1800, action: () => activateConnection('recommendation', 'viz') },
    { delay: 2800, action: () => addAgentMessage('viz', 'Criando dashboards e relatórios executivos...') },
    { delay: 2000, action: () => activateConnection('viz', 'supervisor') },
    { delay: 2500, action: () => addAgentMessage('supervisor', 'Validação final: 98.7% de precisão nas recomendações...') },
    { delay: 2000, action: () => addAgentMessage('supervisor', 'Análise multi-agente concluída com sucesso!') },
    { delay: 1500, action: () => {
      setStep('completed');
      setAnalyzing(false);
      setActiveAgent(null);
      setProgress(100);
    }}
  ];
  
  // Atualizador de progresso
  useEffect(() => {
    if (!analyzing || isPaused || step !== 'processing') return;
    
    const progressInterval = window.setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - analysisRef.current.startTime + analysisRef.current.elapsedBeforePause;
      const progressValue = Math.min(100, (elapsedTime / analysisRef.current.totalTime) * 100);
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        window.clearInterval(progressInterval);
      }
    }, 100);
    
    return () => {
      window.clearInterval(progressInterval);
    };
  }, [analyzing, isPaused, step]);
  
  const executeFlowStep = (index: number) => {
    if (index >= analysisFlow.length || analysisRef.current.isPaused) return;
    
    const { delay, action } = analysisFlow[index];
    
    const timer = window.setTimeout(() => {
      if (analysisRef.current.isPaused) return;
      
      action();
      analysisRef.current.flowIndex = index + 1;
      
      if (index + 1 < analysisFlow.length) {
        executeFlowStep(index + 1);
      }
    }, delay);
    
    animationTimersRef.current.push(timer);
  };
  
  const simulateAnalysis = () => {
    if (isPaused) {
      setIsPaused(false);
      analysisRef.current.isPaused = false;
      analysisRef.current.startTime = Date.now();
      
      executeFlowStep(analysisRef.current.flowIndex);
      return;
    }
    
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    animationTimersRef.current = [];
    
    setAnalyzing(true);
    setProgress(0);
    setStep('processing');
    setMessages([]);
    setActiveAgent(null);
    setDataPackets([]);
    
    setConnections(prev => prev.map(conn => ({ ...conn, active: false, animating: false, connectionType: 'normal' })));
    
    analysisRef.current = {
      flowIndex: 0,
      isPaused: false,
      totalTime: 65000,
      startTime: Date.now(),
      elapsedBeforePause: 0
    };
    
    executeFlowStep(0);
  };
  
  const pauseAnalysis = () => {
    setIsPaused(true);
    analysisRef.current.isPaused = true;
    analysisRef.current.elapsedBeforePause += Date.now() - analysisRef.current.startTime;
    
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    animationTimersRef.current = [];
  };
  
  return {
    analyzing,
    progress,
    step,
    messages,
    activeAgent,
    connections,
    isPaused,
    dataPackets,
    simulateAnalysis,
    pauseAnalysis
  };
};
