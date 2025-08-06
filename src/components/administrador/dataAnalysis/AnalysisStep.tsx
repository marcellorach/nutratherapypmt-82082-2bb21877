
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Zap, Network } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import "./agentAnimation.css";

import { agents, agentPositions } from './agentData';
import { useAnalysisSimulation } from './useAnalysisSimulation';
import AgentFlowVisualization from './AgentFlowVisualization';
import MessageLog from './MessageLog';
import AgentLegend from './AgentLegend';
import AnalysisResult from './AnalysisResult';

const AnalysisStep: React.FC = () => {
  const {
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
  } = useAnalysisSimulation();
  
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
            {(step === 'completed' || step === 'simulated') && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                {step === 'simulated' ? 'Análise Simulada' : 'Análise Completa'}
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
                    {step === 'processing' ? 'Processamento em andamento...' : step === 'simulated' ? 'Análise SIMULADA concluída' : 'Análise concluída'}
                  </span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
                {step === 'processing' && (
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Tempo estimado: 33 horas e 20 minutos</span>
                  </div>
                )}
              </div>
              
              {/* Visualização do fluxo de agentes */}
              <AgentFlowVisualization 
                agents={agents}
                agentPositions={agentPositions}
                connections={connections}
                dataPackets={dataPackets}
                activeAgent={activeAgent}
              />
              
              {/* Logs de mensagens dos agentes */}
              <MessageLog 
                messages={messages}
                step={step}
                isPaused={isPaused}
              />
              
              {/* Legenda dos agentes */}
              <AgentLegend 
                agents={agents}
                activeAgent={activeAgent}
              />
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between space-x-2">
          <div className="flex space-x-2">
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
            {step === 'processing' && (
              <Button 
                variant="secondary"
                onClick={useExampleData}
              >
                Pausar e usar dados de exemplo
              </Button>
            )}
          </div>
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
                {(step === 'completed' || step === 'simulated') ? 'Executar Novamente' : 'Iniciar Análise Multi-Agente'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {(step === 'completed' || step === 'simulated') && <AnalysisResult />}
    </div>
  );
};

export default AnalysisStep;
