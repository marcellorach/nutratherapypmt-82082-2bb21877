
import { useState, useRef, useEffect } from 'react';
import { AgentConnection, AgentMessage, DataPacket, AnalysisStep } from './types';
import { createInitialConnections } from './agentData';

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
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  // Limpeza dos temporizadores ao desmontar o componente
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Função para ativar uma conexão entre agentes com animação
  const activateConnection = (fromId: string, toId: string) => {
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
    const timer = setTimeout(() => {
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
    { delay: 1800, action: () => addAgentMessage('correlation', 'Preparando matriz de correlação com modelo Mistral Large...') },
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
  
  // Simulação da análise
  const simulateAnalysis = () => {
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    
    // Limpar quaisquer temporizadores existentes
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current = [];
    
    setAnalyzing(true);
    setProgress(0);
    setStep('processing');
    setMessages([]);
    setActiveAgent(null);
    setDataPackets([]);
    
    // Reset das conexões
    setConnections(prev => prev.map(conn => ({ ...conn, active: false, animating: false })));
    
    const totalTime = 90000; // 1.5 minutos = 90 segundos = 90000ms
    
    // Execução da sequência de análise
    const runAnalysis = (stepIndex: number) => {
      if (stepIndex >= analysisFlow.length || step !== 'processing') return;
      
      const { delay, action } = analysisFlow[stepIndex];
      
      const timer = setTimeout(() => {
        if (isPaused) {
          // Se pausado, parar a execução
          return;
        }
        
        action();
        const elapsedTime = analysisFlow.slice(0, stepIndex + 1).reduce((sum, item) => sum + item.delay, 0);
        const progressValue = Math.min(100, (elapsedTime / totalTime) * 100);
        setProgress(progressValue);
        
        runAnalysis(stepIndex + 1);
      }, delay);
      
      animationTimersRef.current.push(timer);
    };
    
    runAnalysis(0);
  };
  
  const pauseAnalysis = () => {
    setIsPaused(true);
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
