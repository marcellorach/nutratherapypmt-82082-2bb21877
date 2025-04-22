
import React from 'react';
import { Brain, Network, FileText, TagIcon, Flask, Database } from 'lucide-react';

interface AIProcessingVisualizationProps {
  progress: number;
  stage?: string;
}

const AIProcessingVisualization: React.FC<AIProcessingVisualizationProps> = ({ 
  progress,
  stage
}) => {
  // Determinar qual etapa está ativa com base no progresso
  const getActiveStage = () => {
    if (progress < 25) return 'extraction';
    if (progress < 60) return 'analysis';
    if (progress < 75) return 'nutraceuticals';
    if (progress < 90) return 'correlation';
    return 'card';
  };
  
  const activeStage = getActiveStage();
  
  // Configuração para os ícones e animações
  const stageConfig = {
    extraction: {
      icon: FileText,
      text: 'Extração de texto',
      active: activeStage === 'extraction',
      completed: progress >= 25,
    },
    analysis: {
      icon: Brain,
      text: 'Análise por IA',
      active: activeStage === 'analysis',
      completed: progress >= 60,
    },
    nutraceuticals: {
      icon: Flask,
      text: 'Identificação de nutracêuticos',
      active: activeStage === 'nutraceuticals',
      completed: progress >= 75,
    },
    correlation: {
      icon: Network,
      text: 'Correlação clínica',
      active: activeStage === 'correlation',
      completed: progress >= 90,
    },
    card: {
      icon: TagIcon,
      text: 'Criação de card',
      active: activeStage === 'card',
      completed: progress >= 100,
    },
  };
  
  // Renderiza os nós do processo
  const renderStageNode = (stage: keyof typeof stageConfig, index: number) => {
    const config = stageConfig[stage];
    const Icon = config.icon;
    
    return (
      <div className="flex flex-col items-center" key={stage}>
        <div 
          className={`
            relative z-10 flex items-center justify-center w-12 h-12 rounded-full 
            ${config.active ? 'bg-purple-100 border-2 border-purple-600 animate-pulse' : 
              config.completed ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}
            transition-all duration-300
          `}
        >
          <Icon 
            className={`
              w-6 h-6 
              ${config.active ? 'text-purple-600' : 
                config.completed ? 'text-green-500' : 'text-gray-400'}
            `} 
          />
          
          {config.completed && !config.active && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        <span className={`
          mt-2 text-xs text-center max-w-[80px]
          ${config.active ? 'text-purple-600 font-medium' : 
            config.completed ? 'text-green-600 font-medium' : 'text-gray-500'}
        `}>
          {config.text}
        </span>
        
        {/* Linha de conexão */}
        {index < Object.keys(stageConfig).length - 1 && (
          <div className="hidden md:block absolute h-0.5 bg-gray-200 top-[45px]" 
               style={{ 
                 left: `${(index * 25) + 10}%`, 
                 width: '15%',
                 backgroundColor: config.completed ? '#10b981' : '#e5e7eb' 
               }}>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-6 px-4 bg-white rounded-lg border">
      <div className="relative flex justify-between md:justify-around">
        {Object.keys(stageConfig).map((stage, index) => 
          renderStageNode(stage as keyof typeof stageConfig, index)
        )}
      </div>
      
      {/* Animação de Partículas AI */}
      <div className="mt-8 h-32 bg-gray-50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain 
            className={`w-16 h-16 text-purple-300 ${activeStage === 'analysis' ? 'animate-pulse' : ''}`}
            opacity={0.2}
          />
        </div>
        
        {/* Simulação de fluxo de dados */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-purple-500"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${(progress / 100) * 70}%`,
                opacity: 0.7,
                animation: `particle-flow ${1 + Math.random() * 3}s linear infinite`,
              }}
            />
          ))}
        </div>
        
        <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500">
          {stage || "Processando estudo com IA..."}
        </div>
      </div>
      
      <style>
        {`
        @keyframes particle-flow {
          0% {
            transform: translateX(0) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
            transform: translateX(50px) scale(1.2);
          }
          100% {
            transform: translateX(100px) scale(0.8);
            opacity: 0;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AIProcessingVisualization;
