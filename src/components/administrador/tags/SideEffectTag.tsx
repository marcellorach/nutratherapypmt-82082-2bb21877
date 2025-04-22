
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SideEffectTagProps {
  effect: string;
  score: number;
  showScore?: boolean;
  className?: string;
}

const SideEffectTag: React.FC<SideEffectTagProps> = ({ 
  effect, 
  score,
  showScore = true,
  className = ""
}) => {
  // Determina a cor do badge baseado na intensidade do efeito colateral
  const getStyle = (score: number) => {
    if (score >= 4) {
      return {
        bg: '#FEE2E2', // Vermelho claro
        color: '#B91C1C', // Vermelho escuro
        border: '#FCA5A5' // Vermelho médio
      };
    } else if (score >= 2.5) {
      return {
        bg: '#FEF3C7', // Amarelo claro
        color: '#B45309', // Amarelo escuro
        border: '#FCD34D' // Amarelo médio
      };
    } else {
      return {
        bg: '#ECFCCB', // Verde claro
        color: '#3F6212', // Verde escuro
        border: '#BEF264' // Verde médio
      };
    }
  };
  
  const style = getStyle(score);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`font-normal flex items-center ${className}`}
            style={{ 
              backgroundColor: style.bg,
              color: style.color,
              borderColor: style.border
            }}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>{effect}</span>
            {showScore && <span className="ml-1 font-semibold">({score.toFixed(1)})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p><span className="font-medium">{effect}</span> - Intensidade: {score.toFixed(1)}/5</p>
          <p className="text-xs text-gray-500 mt-1">
            {score >= 4 ? 'Efeito colateral severo' : 
             score >= 2.5 ? 'Efeito colateral moderado' : 
             'Efeito colateral leve'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SideEffectTag;
