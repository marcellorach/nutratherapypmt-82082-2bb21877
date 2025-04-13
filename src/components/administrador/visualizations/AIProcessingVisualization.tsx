import React, { useState, useEffect } from 'react';
import { CircleCheck, CircleDashed, Sparkles, BookOpen, Brain, MoveHorizontal, Database, FlaskConical, BadgeCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import './ai-processing.css';

const stages = [
  { id: 'extract', label: 'Extração de Informações', icon: BookOpen, description: 'Extraindo dados estruturados do texto científico...' },
  { id: 'analyze', label: 'Análise Contextual', icon: Brain, description: 'Analisando contexto e relevância para medicina veterinária...' },
  { id: 'validate', label: 'Validação de Metodologia', icon: FlaskConical, description: 'Verificando rigor metodológico e amostragem...' },
  { id: 'compare', label: 'Comparação com Base de Dados', icon: Database, description: 'Comparando com outros estudos e evidências científicas...' },
  { id: 'integrate', label: 'Integração ao Sistema', icon: MoveHorizontal, description: 'Preparando dados para integração com nutracêuticos...' },
  { id: 'score', label: 'Geração de Pontuações', icon: BadgeCheck, description: 'Calculando scores de fundamentação, eficiência e constância...' },
];

const AIProcessingVisualization: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  
  useEffect(() => {
    const stageTime = 1300; // tempo por estágio em ms
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        
        const stageProgress = (newProgress / 100) * stages.length;
        const newStage = Math.min(Math.floor(stageProgress), stages.length - 1);
        
        if (newStage > currentStage) {
          setCompletedStages(prev => [...prev, stages[currentStage].id]);
          setCurrentStage(newStage);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          if (!completedStages.includes(stages[stages.length - 1].id)) {
            setCompletedStages(prev => [...prev, stages[stages.length - 1].id]);
          }
        }
        
        return newProgress > 100 ? 100 : newProgress;
      });
    }, stageTime / 20); // 20 atualizações por estágio
    
    return () => clearInterval(interval);
  }, [currentStage, completedStages]);
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-center mb-10">
        <Sparkles className="h-10 w-10 text-indigo-500 animate-pulse-glow mr-3" />
        <h3 className="text-xl font-semibold">Processamento por Inteligência Artificial</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Progresso Total</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="space-y-4 mt-8">
        {stages.map((stage, index) => {
          const isActive = index === currentStage;
          const isCompleted = completedStages.includes(stage.id);
          
          return (
            <div 
              key={stage.id} 
              className={`flex items-start p-3 rounded-lg transition-all ${
                isActive ? 'bg-indigo-50 border border-indigo-100' : 
                isCompleted ? 'bg-green-50 border border-green-100' : 
                'bg-gray-50 border border-gray-100 opacity-70'
              }`}
            >
              <div className={`p-2 rounded-full mr-3 ${
                isActive ? 'bg-indigo-100 text-indigo-500 animate-pulse-glow' : 
                isCompleted ? 'bg-green-100 text-green-500' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CircleCheck className="h-6 w-6" />
                ) : isActive ? (
                  <stage.icon className="h-6 w-6 animate-spin-slow" />
                ) : (
                  <CircleDashed className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${
                  isActive ? 'text-indigo-700' : 
                  isCompleted ? 'text-green-700' : 
                  'text-gray-700'
                }`}>
                  {stage.label}
                </h4>
                <p className={`text-sm ${
                  isActive ? 'text-indigo-600' : 
                  isCompleted ? 'text-green-600' : 
                  'text-gray-500'
                }`}>
                  {isActive || isCompleted ? stage.description : 'Aguardando processamento...'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {progress >= 100 && (
        <div className="flex items-center justify-center bg-green-50 p-4 rounded-lg mt-6">
          <CircleCheck className="h-6 w-6 text-green-500 mr-2" />
          <span className="font-medium text-green-700">Processamento concluído com sucesso!</span>
        </div>
      )}
    </div>
  );
};

export default AIProcessingVisualization;
