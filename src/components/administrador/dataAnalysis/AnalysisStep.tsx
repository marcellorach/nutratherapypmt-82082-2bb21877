
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Bot, MessageSquare, CheckCircle, Play, Pause, RefreshCw, Shield, FileSearch, Database, BarChart3, Search, Filter, Network, RectangleHorizontal, Link2, GitCompare, Zap } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import './agentAnimation.css';

// Definição dos agentes do sistema com seus modelos
const agents = [
  { 
    id: 'supervisor', 
    name: 'Agente Supervisor', 
    model: 'GPT-4o',
    color: 'bg-blue-100 border-blue-300', 
    icon: Shield, 
    description: 'Coordena todos os agentes e garante a coerência da análise'
  },
  { 
    id: 'data', 
    name: 'Agente de Dados', 
    model: 'Llama-3-70B',
    color: 'bg-emerald-100 border-emerald-300', 
    icon: Database, 
    description: 'Processa e normaliza dados brutos de pets' 
  },
  { 
    id: 'pattern', 
    name: 'Agente de Padrões', 
    model: 'Claude-3 Opus',
    color: 'bg-amber-100 border-amber-300', 
    icon: Search, 
    description: 'Identifica padrões estatísticos nos dados de saúde' 
  },
  { 
    id: 'correlation', 
    name: 'Agente de Correlação', 
    model: 'Mistral Large',
    color: 'bg-purple-100 border-purple-300', 
    icon: GitCompare, 
    description: 'Analisa relações entre condições e tratamentos' 
  },
  { 
    id: 'recommendation', 
    name: 'Agente de Recomendação', 
    model: 'GPT-4-Turbo',
    color: 'bg-rose-100 border-rose-300', 
    icon: FileSearch, 
    description: 'Gera recomendações de nutracêuticos' 
  },
  { 
    id: 'viz', 
    name: 'Agente de Visualização', 
    model: 'Gemini Pro',
    color: 'bg-cyan-100 border-cyan-300', 
    icon: BarChart3, 
    description: 'Prepara visualizações e insights para relatórios' 
  },
];

// Posições de cada agente no fluxo
const agentPositions = {
  'supervisor': { x: 50, y: 8 },
  'data': { x: 50, y: 28 },
  'pattern': { x: 25, y: 40 },
  'correlation': { x: 50, y: 52 },
  'recommendation': { x: 25, y: 64 },
  'viz': { x: 75, y: 76 },
};

// Interface para mensagens dos agentes
interface AgentMessage {
  agentId: string;
  message: string;
  timestamp: Date;
}

// Interface para conexão entre agentes
interface AgentConnection {
  from: string;
  to: string;
  active: boolean;
  animating: boolean;
}

// Interface para transferência de dados na animação
interface DataPacket {
  fromId: string;
  toId: string;
  startTime: number;
  duration: number;
}

const AnalysisStep: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'waiting' | 'processing' | 'completed'>('waiting');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  // Criação das conexões iniciais entre os agentes
  useEffect(() => {
    const initialConnections: AgentConnection[] = [
      { from: 'supervisor', to: 'data', active: false, animating: false },
      { from: 'supervisor', to: 'pattern', active: false, animating: false },
      { from: 'supervisor', to: 'correlation', active: false, animating: false },
      { from: 'supervisor', to: 'recommendation', active: false, animating: false },
      { from: 'supervisor', to: 'viz', active: false, animating: false },
      { from: 'data', to: 'pattern', active: false, animating: false },
      { from: 'pattern', to: 'correlation', active: false, animating: false },
      { from: 'correlation', to: 'recommendation', active: false, animating: false },
      { from: 'recommendation', to: 'viz', active: false, animating: false },
    ];
    
    setConnections(initialConnections);
  }, []);
  
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
    const totalSteps = 30; // Aumentamos o número de etapas para ter mais interações
    let currentStep = 0;
    
    // Sequência de mensagens e ativações que compõem o fluxo da análise
    const analysisFlow = [
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
        currentStep++;
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
  
  // Renderização dos agentes no fluxo
  const renderAgents = () => {
    return (
      <div className="relative h-[400px] w-full bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-hidden" ref={flowContainerRef}>
        {/* SVG para desenhar as linhas de conexão */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((conn, idx) => {
            const fromPos = agentPositions[conn.from];
            const toPos = agentPositions[conn.to];
            
            if (!fromPos || !toPos) return null;
            
            return (
              <g key={`${conn.from}-${conn.to}`}>
                <line 
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  stroke={conn.active ? '#10b981' : '#e2e8f0'}
                  strokeWidth={conn.active ? 2 : 1}
                  strokeDasharray={conn.active ? 'none' : '4 2'}
                  className={conn.animating ? 'connection-path' : ''}
                />
                
                {/* Adiciona seta na conexão */}
                {conn.active && (
                  <polygon 
                    points="0,-3 6,0 0,3"
                    fill="#10b981"
                    transform={`translate(${toPos.x}%, ${toPos.y}%) rotate(${Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * (180 / Math.PI)})`}
                    className={conn.animating ? 'connection-arrow' : ''}
                  />
                )}
              </g>
            );
          })}
          
          {/* Animação de pacotes de dados */}
          {dataPackets.map((packet, idx) => {
            const fromPos = agentPositions[packet.fromId];
            const toPos = agentPositions[packet.toId];
            
            if (!fromPos || !toPos) return null;
            
            return (
              <circle
                key={`packet-${idx}`}
                cx="0"
                cy="0"
                r="4"
                fill="#10b981"
                className="data-packet"
                style={{
                  animation: `movePacket 2s linear forwards`,
                  '--from-x': `${fromPos.x}%`,
                  '--from-y': `${fromPos.y}%`,
                  '--to-x': `${toPos.x}%`,
                  '--to-y': `${toPos.y}%`,
                } as React.CSSProperties}
              />
            );
          })}
        </svg>
        
        {/* Agentes */}
        {agents.map((agent) => {
          const position = agentPositions[agent.id];
          if (!position) return null;
          
          const isActive = activeAgent === agent.id;
          
          return (
            <div
              key={agent.id}
              className={`absolute p-3 rounded-md border transition-all duration-300 ${
                isActive ? 'ring-2 shadow-lg scale-110 z-10' : ''
              } ${agent.color} ${isActive ? `ring-${agent.color.split('-')[1]}-500` : ''}`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '160px',
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center gap-2 font-medium text-sm mb-1">
                  <agent.icon className="h-4 w-4" />
                  <span>{agent.name}</span>
                </div>
                <div className="text-xs bg-white bg-opacity-70 rounded-full px-2 py-0.5 font-mono">
                  {agent.model}
                </div>
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de IA Multi-Agente</h2>
          <p className="text-gray-600">Processamento avançado de dados com sistema de agentes especializados</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5 text-primary" />
              Sistema de Análise Colaborativa
            </CardTitle>
            {step === 'completed' && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                Análise Completa
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            Este sistema utiliza múltiplos agentes especializados que colaboram entre si para analisar os dados de pets e gerar recomendações personalizadas de nutracêuticos.
          </div>
          
          {step !== 'waiting' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {step === 'processing' ? 'Processamento em andamento...' : 'Análise concluída'}
                  </span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
              </div>
              
              {/* Visualização do fluxo de agentes */}
              {renderAgents()}
              
              {/* Logs de mensagens dos agentes */}
              <div className="h-64 overflow-y-auto rounded-md border border-gray-200 bg-black p-4 text-sm font-mono">
                <div className="space-y-2 text-green-400">
                  {messages.map((msg, idx) => {
                    const agent = agents.find(a => a.id === msg.agentId);
                    return (
                      <div key={idx} className="py-1 flex">
                        <span className="text-blue-400 mr-2">[{agent?.name || msg.agentId}]</span>
                        <span>{msg.message}</span>
                      </div>
                    );
                  })}
                  {step === 'processing' && !isPaused && (
                    <div className="mt-1 flex items-center">
                      <span className="ml-1 h-4 w-2 animate-blink bg-green-400"></span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Legenda dos agentes */}
          {step !== 'waiting' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {agents.map(agent => (
                <div key={agent.id} className={`flex items-center p-2 rounded-md ${activeAgent === agent.id ? 'bg-gray-100' : ''}`}>
                  <div className={`p-1 rounded-md ${agent.color}`}>
                    <agent.icon className="h-4 w-4" />
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-medium">{agent.name}</div>
                    <div className="text-[10px] text-gray-500">{agent.model}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {step === 'processing' && analyzing && (
            <Button 
              variant="outline"
              onClick={pauseAnalysis}
              disabled={isPaused}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
          )}
          <Button 
            onClick={simulateAnalysis}
            disabled={analyzing && !isPaused}
          >
            {analyzing ? (
              isPaused ? (
                <span className="flex items-center">
                  <Play className="mr-2 h-4 w-4" />
                  Continuar
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analisando...
                </span>
              )
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {step === 'completed' ? 'Executar Novamente' : 'Iniciar Análise Multi-Agente'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {step === 'completed' && (
        <Card className="mt-6 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5" />
              Análise Concluída com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                A análise multi-agente dos dados foi concluída com sucesso. Os agentes colaboraram para produzir insights e recomendações de alta qualidade.
              </p>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2 text-emerald-600" />
                    Processamento de Dados
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• 2.341 pets processados</li>
                    <li>• 1.876 exames analisados</li>
                    <li>• 42 raças categorizadas</li>
                    <li>• 28 condições clínicas identificadas</li>
                  </ul>
                </div>
                
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <GitCompare className="h-4 w-4 mr-2 text-purple-600" />
                    Análise e Correlações
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• 12 padrões de saúde identificados</li>
                    <li>• 37% com gaps nutricionais</li>
                    <li>• 142 tratamentos avaliados</li>
                    <li>• 86 correlações significativas</li>
                  </ul>
                </div>
                
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <FileSearch className="h-4 w-4 mr-2 text-rose-600" />
                    Recomendações
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• 843 recomendações geradas</li>
                    <li>• 76% taxa de confiança média</li>
                    <li>• 92% com evidências científicas</li>
                    <li>• 23 nutracêuticos recorrentes</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Próximas Etapas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="w-full">
                    Visualizar Análise Detalhada
                  </Button>
                  <Button className="w-full">
                    Enviar para Revisão Veterinária
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisStep;
