
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
  
  // Referência para armazenar todos os temporizadores
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
    totalTime: 900000, // 15 minutos
    startTime: 0,
    elapsedBeforePause: 0,
  });
  
  // Limpeza dos temporizadores ao desmontar o componente
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    };
  }, []);
  
  // Função para ativar uma conexão entre agentes com animação
  const activateConnection = (fromId: string, toId: string) => {
    if (isPaused) return;
    
    // Primeiro ativa a conexão
    setConnections(prev => 
      prev.map(conn => 
        conn.from === fromId && conn.to === toId
          ? { ...conn, active: true, animating: true }
          : conn
      )
    );
    
    // Adiciona um pacote de dados para animação
    const newPacket: DataPacket = {
      fromId,
      toId,
      startTime: Date.now(),
      duration: 2000, // duração da animação em ms
    };
    
    setDataPackets(prev => [...prev, newPacket]);
    
    // Desliga a animação após a duração
    const timer = window.setTimeout(() => {
      setConnections(prev => 
        prev.map(conn => 
          conn.from === fromId && conn.to === toId
            ? { ...conn, animating: false }
            : conn
        )
      );
      
      // Remove o pacote após a animação
      setDataPackets(prev => prev.filter(p => !(p.fromId === fromId && p.toId === toId)));
    }, 2000);
    
    animationTimersRef.current.push(timer);
  };
  
  // Função para adicionar mensagem de um agente
  const addAgentMessage = (agentId: string, message: string) => {
    if (isPaused) return;
    
    setMessages(prev => [...prev, {
      agentId,
      message,
      timestamp: new Date()
    }]);
    setActiveAgent(agentId);
  };
  
  // Sequência de mensagens e ativações que compõem o fluxo da análise
  const analysisFlow: AnalysisFlowItem[] = [
    { delay: 1000, action: () => addAgentMessage('supervisor', 'Iniciando análise de dados de pets. Preparando agentes...') },
    { delay: 1500, action: () => addAgentMessage('data', 'Conectando ao banco de dados. Preparando carregamento de 2.341 registros.') },
    { delay: 1800, action: () => activateConnection('supervisor', 'data') },
    { delay: 2000, action: () => addAgentMessage('supervisor', 'Distribuindo tarefas para agentes especializados...') },
    { delay: 1500, action: () => activateConnection('supervisor', 'pattern') },
    { delay: 1000, action: () => addAgentMessage('data', 'Extraindo informações de raças, idades, pesos e condições clínicas...') },
    { delay: 2200, action: () => addAgentMessage('data', 'Normalizando dados de 1.876 exames laboratoriais com Llama-3-70B...') },
    { delay: 2000, action: () => activateConnection('supervisor', 'correlation') },
    { delay: 1800, action: () => addAgentMessage('pattern', 'Recebendo dados normalizados. Iniciando análise estatística com Claude-3 Opus...') },
    { delay: 1500, action: () => activateConnection('data', 'pattern') },
    { delay: 2000, action: () => addAgentMessage('pattern', 'Identificando clusters de condições de saúde por faixa etária e raça...') },
    { delay: 1800, action: () => addAgentMessage('correlation', 'Preparando matriz de correlação com modelo Claude-3 Opus...') },
    { delay: 2200, action: () => addAgentMessage('pattern', 'Detectados 7 padrões significativos de saúde em populações caninas e 5 em felinas.') },
    { delay: 1500, action: () => activateConnection('supervisor', 'recommendation') },
    { delay: 1800, action: () => addAgentMessage('correlation', 'Analisando correlações entre condições identificadas e histórico de tratamentos...') },
    { delay: 1500, action: () => activateConnection('pattern', 'correlation') },
    { delay: 2500, action: () => addAgentMessage('correlation', 'Calculando taxas de eficácia para 142 tratamentos existentes...') },
    { delay: 2000, action: () => activateConnection('supervisor', 'viz') },
    { delay: 2300, action: () => addAgentMessage('correlation', 'Identificando gaps nutricionais em 37% dos casos analisados.') },
    { delay: 2000, action: () => addAgentMessage('recommendation', 'Processando dados correlacionados com GPT-4-Turbo para gerar recomendações...') },
    { delay: 1500, action: () => activateConnection('correlation', 'recommendation') },
    { delay: 2500, action: () => addAgentMessage('recommendation', 'Consultando base de nutracêuticos e evidências científicas...') },
    { delay: 2200, action: () => addAgentMessage('recommendation', 'Gerando 843 recomendações personalizadas com base em perfis clínicos.') },
    { delay: 1800, action: () => addAgentMessage('supervisor', 'Validando recomendações e preparando relatório final...') },
    { delay: 2000, action: () => addAgentMessage('viz', 'Preparando visualizações e relatórios com modelo Gemini Pro...') },
    { delay: 1500, action: () => activateConnection('recommendation', 'viz') },
    { delay: 2500, action: () => addAgentMessage('viz', 'Criando gráficos de distribuição de condições e eficácia de tratamentos...') },
    { delay: 2300, action: () => addAgentMessage('viz', 'Agrupando recomendações por categorias e gerando relatórios interativos.') },
    { delay: 2000, action: () => addAgentMessage('supervisor', 'Compilando resultados finais e preparando dashboard interativo...') },
    { delay: 2500, action: () => {
      setStep('completed');
      setAnalyzing(false);
      setActiveAgent(null);
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
  
  // Executar um passo do fluxo de análise
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
  
  // Simulação da análise
  const simulateAnalysis = () => {
    // Se estiver pausado, continuar de onde parou
    if (isPaused) {
      setIsPaused(false);
      analysisRef.current.isPaused = false;
      analysisRef.current.startTime = Date.now();
      
      // Continuar do último passo
      executeFlowStep(analysisRef.current.flowIndex);
      return;
    }
    
    // Limpar quaisquer temporizadores existentes
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    animationTimersRef.current = [];
    
    // Resetar estado
    setAnalyzing(true);
    setProgress(0);
    setStep('processing');
    setMessages([]);
    setActiveAgent(null);
    setDataPackets([]);
    
    // Reset das conexões
    setConnections(prev => prev.map(conn => ({ ...conn, active: false, animating: false })));
    
    // Inicializar o controlador de análise
    analysisRef.current = {
      flowIndex: 0,
      isPaused: false,
      totalTime: 900000, // 15 minutos
      startTime: Date.now(),
      elapsedBeforePause: 0
    };
    
    // Iniciar a simulação
    executeFlowStep(0);
  };
  
  const pauseAnalysis = () => {
    setIsPaused(true);
    analysisRef.current.isPaused = true;
    analysisRef.current.elapsedBeforePause += Date.now() - analysisRef.current.startTime;
    
    // Pausar todos os temporizadores ativos
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer));
    animationTimersRef.current = [];
  };
  
  const useExampleData = () => {
    // Pausar análise atual se estiver rodando
    if (analyzing) {
      pauseAnalysis();
    }
    
    // Definir estado como simulado
    setStep('simulated');
    setProgress(100);
    setAnalyzing(false);
    setActiveAgent(null);
    
    // Adicionar mensagem final de simulação
    setMessages(prev => [...prev, {
      agentId: 'supervisor',
      message: 'Análise finalizada com dados de exemplo. Resultados simulados disponíveis.',
      timestamp: new Date()
    }]);
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
    pauseAnalysis,
    useExampleData
  };
};
