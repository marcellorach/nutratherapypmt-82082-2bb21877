
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

const MultiAgentSimulationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(true);
  
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

  // Contagem regressiva e início automático
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      simulateAnalysis();
    }
  }, [countdown, showCountdown, simulateAnalysis]);

  const handleBack = () => {
    navigate('/administrador?tab=analysis');
  };

  const handleToggleAnalysis = () => {
    if (analyzing && !isPaused) {
      pauseAnalysis();
    } else {
      simulateAnalysis();
    }
  };

  if (showCountdown) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Brain className="mx-auto h-16 w-16 text-purple-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulação Multi-Agente</h1>
            <p className="text-gray-600">Preparando análise inteligente dos dados importados</p>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-lg border">
            <div className="text-6xl font-bold text-purple-600 mb-4">
              {countdown}
            </div>
            <p className="text-lg text-gray-600">Iniciando análise automaticamente...</p>
            <div className="mt-6 space-y-2">
              <div className="text-sm text-gray-500">
                Pets elegíveis para análise: <span className="font-medium">{importStats.eligiblePets}</span>
              </div>
              <div className="text-sm text-gray-500">
                Exames disponíveis: <span className="font-medium">{importStats.examsImported}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold">Simulação Multi-Agente</h1>
                <p className="text-sm text-gray-600">
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
              onClick={handleToggleAnalysis}
              variant={analyzing && !isPaused ? "secondary" : "default"}
              className="flex items-center gap-2"
            >
              {analyzing && !isPaused ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {isPaused ? 'Continuar' : 'Iniciar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className="mb-6 bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso da Análise</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Network */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Rede de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <AgentNetwork
                  connections={connections}
                  activeAgent={activeAgent}
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Log de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <MessageLog messages={messages} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentSimulationPage;
