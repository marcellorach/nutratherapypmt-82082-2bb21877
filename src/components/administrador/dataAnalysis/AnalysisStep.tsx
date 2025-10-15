
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <h2 className="text-2xl font-bold">{t('admin.multiAgentAnalysis.title')}</h2>
          <p className="text-gray-600">{t('admin.multiAgentAnalysis.subtitle')}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5 text-primary" />
              {t('admin.multiAgentAnalysis.card.title')}
            </CardTitle>
            {(step === 'completed' || step === 'simulated') && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                {step === 'simulated' ? t('admin.multiAgentAnalysis.card.status.simulated') : t('admin.multiAgentAnalysis.card.status.completed')}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            {t('admin.multiAgentAnalysis.card.description')}
          </div>
          
          {step !== 'waiting' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {step === 'processing' ? t('admin.multiAgentAnalysis.progress.processing') : step === 'simulated' ? t('admin.multiAgentAnalysis.progress.simulatedCompleted') : t('admin.multiAgentAnalysis.progress.completed')}
                  </span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
                {step === 'processing' && (
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{t('admin.multiAgentAnalysis.progress.estimatedTime')}</span>
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
                {t('admin.multiAgentAnalysis.buttons.pause')}
              </Button>
            )}
            {step === 'processing' && (
              <Button 
                variant="secondary"
                onClick={useExampleData}
              >
                {t('admin.multiAgentAnalysis.buttons.pauseAndUseExample')}
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
                  {t('admin.multiAgentAnalysis.buttons.continue')}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.multiAgentAnalysis.buttons.analyzing')}
                </span>
              )
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {(step === 'completed' || step === 'simulated') ? t('admin.multiAgentAnalysis.buttons.runAgain') : t('admin.multiAgentAnalysis.buttons.startAnalysis')}
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
