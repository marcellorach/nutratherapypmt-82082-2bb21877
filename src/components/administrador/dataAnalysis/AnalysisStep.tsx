
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Bot, MessageSquare, CheckCircle, Play, Pause, RefreshCw, Shield, FileSearch, Database, BarChart3, Search, Filter, Network, RectangleHorizontal, Link2, GitCompare } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definição dos agentes do sistema
const agents = [
  { id: 'supervisor', name: 'Agente Supervisor', color: 'bg-blue-100 border-blue-300', icon: Shield, description: 'Coordena todos os agentes e garante a coerência da análise' },
  { id: 'data', name: 'Agente de Dados', color: 'bg-emerald-100 border-emerald-300', icon: Database, description: 'Processa e normaliza dados brutos de pets' },
  { id: 'pattern', name: 'Agente de Padrões', color: 'bg-amber-100 border-amber-300', icon: Search, description: 'Identifica padrões estatísticos nos dados de saúde' },
  { id: 'correlation', name: 'Agente de Correlação', color: 'bg-purple-100 border-purple-300', icon: GitCompare, description: 'Analisa relações entre condições e tratamentos' },
  { id: 'recommendation', name: 'Agente de Recomendação', color: 'bg-rose-100 border-rose-300', icon: FileSearch, description: 'Gera recomendações de nutracêuticos' },
  { id: 'viz', name: 'Agente de Visualização', color: 'bg-cyan-100 border-cyan-300', icon: BarChart3, description: 'Prepara visualizações e insights para relatórios' },
];

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
}

const AnalysisStep: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'waiting' | 'processing' | 'completed'>('waiting');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  
  // Criação das conexões iniciais entre os agentes
  useEffect(() => {
    const initialConnections: AgentConnection[] = [
      { from: 'supervisor', to: 'data', active: false },
      { from: 'supervisor', to: 'pattern', active: false },
      { from: 'supervisor', to: 'correlation', active: false },
      { from: 'supervisor', to: 'recommendation', active: false },
      { from: 'supervisor', to: 'viz', active: false },
      { from: 'data', to: 'pattern', active: false },
      { from: 'pattern', to: 'correlation', active: false },
      { from: 'correlation', to: 'recommendation', active: false },
      { from: 'recommendation', to: 'viz', active: false },
    ];
    
    setConnections(initialConnections);
  }, []);
  
  // Função para ativar uma conexão entre agentes
  const activateConnection = (fromId: string, toId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.from === fromId && conn.to === toId
          ? { ...conn, active: true }
          : conn
      )
    );
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
    
    setAnalyzing(true);
    setProgress(0);
    setStep('processing');
    setMessages([]);
    setActiveAgent(null);
    
    // Reset das conexões
    setConnections(prev => prev.map(conn => ({ ...conn, active: false })));
    
    const totalSteps = 22;
    let currentStep = 0;
    
    // Sequência de mensagens e ativações que compõem o fluxo da análise
    const analysisFlow = [
      { delay: 1000, action: () => addAgentMessage('supervisor', 'Iniciando análise de dados de pets. Preparando agentes...') },
      { delay: 1500, action: () => addAgentMessage('data', 'Conectando ao banco de dados. Preparando carregamento de 2.341 registros.') },
      { delay: 2000, action: () => activateConnection('supervisor', 'data') },
      { delay: 2000, action: () => addAgentMessage('data', 'Extraindo informações de raças, idades, pesos e condições clínicas...') },
      { delay: 2500, action: () => addAgentMessage('data', 'Normalizando dados de 1.876 exames laboratoriais...') },
      { delay: 1800, action: () => addAgentMessage('pattern', 'Recebendo dados normalizados. Iniciando análise estatística...') },
      { delay: 1500, action: () => activateConnection('data', 'pattern') },
      { delay: 2000, action: () => addAgentMessage('pattern', 'Identificando clusters de condições de saúde por faixa etária e raça...') },
      { delay: 2200, action: () => addAgentMessage('pattern', 'Detectados 7 padrões significativos de saúde em populações caninas e 5 em felinas.') },
      { delay: 1800, action: () => addAgentMessage('correlation', 'Analisando correlações entre condições identificadas e histórico de tratamentos...') },
      { delay: 1500, action: () => activateConnection('pattern', 'correlation') },
      { delay: 2500, action: () => addAgentMessage('correlation', 'Calculando taxas de eficácia para 142 tratamentos existentes...') },
      { delay: 2300, action: () => addAgentMessage('correlation', 'Identificando gaps nutricionais em 37% dos casos analisados.') },
      { delay: 2000, action: () => addAgentMessage('recommendation', 'Processando dados correlacionados para gerar recomendações...') },
      { delay: 1500, action: () => activateConnection('correlation', 'recommendation') },
      { delay: 2500, action: () => addAgentMessage('recommendation', 'Consultando base de nutracêuticos e evidências científicas...') },
      { delay: 2200, action: () => addAgentMessage('recommendation', 'Gerando 843 recomendações personalizadas com base em perfis clínicos.') },
      { delay: 2000, action: () => addAgentMessage('viz', 'Preparando visualizações e relatórios com base nas análises...') },
      { delay: 1500, action: () => activateConnection('recommendation', 'viz') },
      { delay: 2500, action: () => addAgentMessage('viz', 'Criando gráficos de distribuição de condições e eficácia de tratamentos...') },
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
      
      setTimeout(() => {
        if (isPaused) {
          // Se pausado, parar a execução
          return;
        }
        
        action();
        currentStep++;
        setProgress(Math.min(100, (currentStep / totalSteps) * 100));
        
        runAnalysis(stepIndex + 1);
      }, delay);
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
        {/* Agente supervisor no topo */}
        <div 
          className={`absolute top-4 left-1/2 -translate-x-1/2 w-48 p-3 rounded-md border ${
            activeAgent === 'supervisor' ? 'ring-2 ring-blue-500 shadow-lg' : ''
          } bg-blue-100 border-blue-300 transition-all duration-300`}
        >
          <div className="flex items-center justify-center gap-2 font-medium text-sm">
            <Shield className="h-4 w-4" />
            <span>Agente Supervisor</span>
          </div>
        </div>
        
        {/* Agentes de primeira camada */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full flex justify-center space-x-4">
          <div 
            className={`w-40 p-2 rounded-md border ${
              activeAgent === 'data' ? 'ring-2 ring-emerald-500 shadow-lg' : ''
            } bg-emerald-100 border-emerald-300 transition-all duration-300`}
          >
            <div className="flex items-center justify-center gap-2 font-medium text-sm">
              <Database className="h-4 w-4" />
              <span>Agente de Dados</span>
            </div>
          </div>
        </div>
        
        {/* Agentes de segunda camada */}
        <div className="absolute top-36 left-1/4 -translate-x-1/2 flex flex-col items-center">
          <div 
            className={`w-40 p-2 mb-4 rounded-md border ${
              activeAgent === 'pattern' ? 'ring-2 ring-amber-500 shadow-lg' : ''
            } bg-amber-100 border-amber-300 transition-all duration-300`}
          >
            <div className="flex items-center justify-center gap-2 font-medium text-sm">
              <Search className="h-4 w-4" />
              <span>Agente de Padrões</span>
            </div>
          </div>
        </div>
        
        {/* Agentes de terceira camada */}
        <div className="absolute top-48 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div 
            className={`w-40 p-2 mb-4 rounded-md border ${
              activeAgent === 'correlation' ? 'ring-2 ring-purple-500 shadow-lg' : ''
            } bg-purple-100 border-purple-300 transition-all duration-300`}
          >
            <div className="flex items-center justify-center gap-2 font-medium text-sm">
              <GitCompare className="h-4 w-4" />
              <span>Agente de Correlação</span>
            </div>
          </div>
        </div>
        
        {/* Agentes de quarta camada */}
        <div className="absolute bottom-36 left-1/4 -translate-x-1/2 flex flex-col items-center">
          <div 
            className={`w-40 p-2 mb-4 rounded-md border ${
              activeAgent === 'recommendation' ? 'ring-2 ring-rose-500 shadow-lg' : ''
            } bg-rose-100 border-rose-300 transition-all duration-300`}
          >
            <div className="flex items-center justify-center gap-2 font-medium text-sm">
              <FileSearch className="h-4 w-4" />
              <span>Agente de Recomendação</span>
            </div>
          </div>
        </div>
        
        {/* Agentes de quinta camada */}
        <div className="absolute bottom-24 left-3/4 -translate-x-1/2 flex flex-col items-center">
          <div 
            className={`w-40 p-2 rounded-md border ${
              activeAgent === 'viz' ? 'ring-2 ring-cyan-500 shadow-lg' : ''
            } bg-cyan-100 border-cyan-300 transition-all duration-300`}
          >
            <div className="flex items-center justify-center gap-2 font-medium text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Agente de Visualização</span>
            </div>
          </div>
        </div>
        
        {/* Linhas de conexão entre agentes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
          {connections.map((conn, idx) => {
            // Determinando a posição das conexões entre agentes
            const positions: Record<string, {x: number, y: number}> = {
              'supervisor': { x: 50, y: 8 },
              'data': { x: 50, y: 28 },
              'pattern': { x: 25, y: 40 },
              'correlation': { x: 50, y: 52 },
              'recommendation': { x: 25, y: 64 },
              'viz': { x: 75, y: 76 },
            };
            
            const fromPos = positions[conn.from];
            const toPos = positions[conn.to];
            
            if (!fromPos || !toPos) return null;
            
            return (
              <line 
                key={`${conn.from}-${conn.to}`}
                x1={`${fromPos.x}%`}
                y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`}
                y2={`${toPos.y}%`}
                stroke={conn.active ? '#10b981' : '#e2e8f0'}
                strokeWidth={conn.active ? 2 : 1}
                strokeDasharray={conn.active ? 'none' : '4 2'}
              />
            );
          })}
        </svg>
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
                  <span className="ml-2 text-xs font-medium">{agent.name}</span>
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
                <Brain className="mr-2 h-4 w-4" />
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
