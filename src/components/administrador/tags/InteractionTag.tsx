
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InteractionTagProps {
  name: string;
  score: number;
  type: 'positive' | 'negative';
  showScore?: boolean;
  className?: string;
}

const InteractionTag: React.FC<InteractionTagProps> = ({ 
  name, 
  score,
  type,
  showScore = true,
  className = ""
}) => {
  // Estilos com base no tipo de interação
  const getStyle = () => {
    if (type === 'positive') {
      return {
        bg: '#DCFCE7', // Verde claro
        color: '#166534', // Verde escuro
        border: '#86EFAC', // Verde médio
        icon: <ArrowUp className="w-3 h-3 mr-1" />
      };
    } else {
      return {
        bg: '#FEE2E2', // Vermelho claro
        color: '#B91C1C', // Vermelho escuro
        border: '#FCA5A5', // Vermelho médio
        icon: <ArrowDown className="w-3 h-3 mr-1" />
      };
    }
  };
  
  const style = getStyle();
  
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
            {style.icon}
            <span>{name}</span>
            {showScore && <span className="ml-1 font-semibold">({score.toFixed(1)})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <span className="font-medium">{name}</span> - 
            {type === 'positive' ? ' Interação positiva' : ' Interação negativa'}: {score.toFixed(1)}/5
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {type === 'positive' 
              ? 'Potencializa o efeito ou complementa a ação' 
              : 'Reduz a eficácia ou apresenta contraindicações'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InteractionTag;
