
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Brain, Database, Network, BarChart3 } from "lucide-react";
import { useAnalysisSimulation } from '@/components/administrador/dataAnalysis/useAnalysisSimulation';
import AgentNetwork from '@/components/administrador/dataAnalysis/AgentNetwork';
import MessageLog from '@/components/administrador/dataAnalysis/MessageLog';
import AdvancedControlPanel from '@/components/administrador/dataAnalysis/network/AdvancedControlPanel';
import AdminLayout from '@/components/administrador/AdminLayout';

const MultiAgentSimulationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  const importStats = location.state?.importStats || {
    totalRecords: 0,
    petsImported: 0,
    prontuariosImported: 0,
    examsImported: 0,
    eligiblePets: 0
  };

  const {
    analyzing,
    progress,
    step,
    messages,
    activeAgent,
    connections,
    isPaused,
    simulateAnalysis,
    pauseAnalysis
  } = useAnalysisSimulation();

  // Contagem regressiva integrada no botão
  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      simulateAnalysis();
    }
  }, [countdown, isCountingDown, simulateAnalysis]);

  const handleStartAnalysis = () => {
    if (analyzing && !isPaused) {
      pauseAnalysis();
    } else if (isPaused) {
      simulateAnalysis();
    } else {
      setIsCountingDown(true);
      setCountdown(3);
    }
  };

  const getButtonText = () => {
    if (isCountingDown) {
      return `Iniciando em ${countdown}...`;
    }
    if (analyzing && !isPaused) {
      return 'Pausar';
    }
    if (isPaused) {
      return 'Continuar';
    }
    return 'Iniciar Análise';
  };

  const getButtonIcon = () => {
    if (isCountingDown) {
      return <Brain className="h-4 w-4 animate-pulse" />;
    }
    if (analyzing && !isPaused) {
      return <Pause className="h-4 w-4" />;
    }
    return <Play className="h-4 w-4" />;
  };

  return (
    <AdminLayout 
      currentStep="analysis" 
      setCurrentStep={() => navigate('/administrador?tab=analysis')}
    >
      <div className="space-y-6 min-h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/administrador?tab=analysis')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">Simulação Multi-Agente</h1>
                <p className="text-gray-600">
                  Análise inteligente de {importStats.eligiblePets} pets com dados correlacionados
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
              SIMULAÇÃO IA
            </Badge>
            <Button
              onClick={handleStartAnalysis}
              variant={analyzing && !isPaused ? "secondary" : "default"}
              className="flex items-center gap-2"
              disabled={isCountingDown}
            >
              {getButtonIcon()}
              {getButtonText()}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                Dados Importados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{importStats.totalRecords}</div>
              <p className="text-xs text-gray-500">registros totais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4 text-green-600" />
                Pets Elegíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{importStats.eligiblePets}</div>
              <p className="text-xs text-gray-500">para análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</div>
              <p className="text-xs text-gray-500">análise concluída</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-600" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-orange-600">
                {step === 'waiting' && 'Aguardando'}
                {step === 'processing' && 'Processando'}
                {step === 'completed' && 'Concluído'}
              </div>
              <p className="text-xs text-gray-500">
                {isPaused ? 'pausado' : 'ativo'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso da Análise</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content - Expandido */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Network - Espaço ampliado */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Rede de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[500px]">
                <AgentNetwork
                  connections={connections}
                  activeAgent={activeAgent}
                  step={step}
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Log - EXPANDIDO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Log de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MessageLog 
                messages={messages} 
                step={step}
                isPaused={isPaused}
              />
            </CardContent>
          </Card>
        </div>

        {/* Advanced Control Panel - Reposicionado */}
        <div className="mt-auto">
          <AdvancedControlPanel
            connections={connections}
            activeAgent={activeAgent}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default MultiAgentSimulationPage;
