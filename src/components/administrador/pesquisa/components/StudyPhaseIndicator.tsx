
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type StudyPhase = 'recruitment' | 'baseline' | 'intervention' | 'evaluation' | 'analysis';

interface StudyPhaseProps {
  phase: StudyPhase;
  isActive?: boolean;
}

const phaseInfo = {
  recruitment: {
    label: 'Recrutamento',
    color: 'bg-purple-100 text-purple-800',
    description: 'Fase de seleção e recrutamento dos participantes do estudo.'
  },
  baseline: {
    label: 'Linha de Base',
    color: 'bg-blue-100 text-blue-800',
    description: 'Coleta de dados iniciais e estabelecimento de métricas base.'
  },
  intervention: {
    label: 'Intervenção',
    color: 'bg-green-100 text-green-800',
    description: 'Aplicação do tratamento ou intervenção nos grupos de estudo.'
  },
  evaluation: {
    label: 'Avaliação',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Coleta e avaliação dos resultados parciais ou finais.'
  },
  analysis: {
    label: 'Análise',
    color: 'bg-orange-100 text-orange-800',
    description: 'Análise estatística e interpretação dos dados coletados.'
  }
};

const StudyPhaseIndicator: React.FC<StudyPhaseProps> = ({ phase, isActive = true }) => {
  const { label, color, description } = phaseInfo[phase];
  
  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        className={`${color} ${isActive ? 'border border-current' : 'opacity-60'}`}
      >
        {label}
        {isActive && <span className="ml-1 animate-pulse">•</span>}
      </Badge>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default StudyPhaseIndicator;
