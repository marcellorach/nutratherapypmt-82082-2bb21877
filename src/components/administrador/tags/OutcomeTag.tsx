
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OutcomeTagProps {
  condition: string;
  score: number;
  showScore?: boolean;
  className?: string;
}

const OutcomeTag: React.FC<OutcomeTagProps> = ({ 
  condition, 
  score,
  showScore = true,
  className = ""
}) => {
  // Determina a cor do badge baseado na pontuação
  const getBadgeStyle = (score: number) => {
    if (score >= 4) {
      return {
        bg: '#D1FAE5', // Verde claro
        color: '#047857', // Verde escuro
        border: '#6EE7B7' // Verde médio
      };
    } else if (score >= 3) {
      return {
        bg: '#E0F2FE', // Azul claro
        color: '#0369A1', // Azul escuro
        border: '#7DD3FC' // Azul médio
      };
    } else {
      return {
        bg: '#FEF3C7', // Amarelo claro
        color: '#92400E', // Amarelo escuro
        border: '#FCD34D' // Amarelo médio
      };
    }
  };
  
  const style = getBadgeStyle(score);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`font-normal ${className}`}
            style={{ 
              backgroundColor: style.bg,
              color: style.color,
              borderColor: style.border
            }}
          >
            <span>{condition}</span>
            {showScore && <span className="ml-1 font-semibold">({score.toFixed(1)})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p><span className="font-medium">{condition}</span> - Pontuação: {score.toFixed(1)}/5</p>
          <p className="text-xs text-gray-500 mt-1">Relevância e eficácia para esta condição</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OutcomeTag;
