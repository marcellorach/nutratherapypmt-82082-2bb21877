
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NutraceuticalTagProps {
  name: string;
  score: number;
  showScore?: boolean;
  className?: string;
}

const NutraceuticalTag: React.FC<NutraceuticalTagProps> = ({ 
  name, 
  score,
  showScore = true,
  className = ""
}) => {
  const level = getEvidenceLevel(score ?? 0);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`font-normal ${className}`}
            style={{ 
              backgroundColor: level.backgroundColor || 'transparent',
              color: level.color,
              borderColor: `${level.color}50`
            }}
          >
            <span>{name}</span>
            {showScore && score !== undefined && !isNaN(score) && (
              <span className="ml-1 font-semibold">({score.toFixed(1)})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <span className="font-medium">{name}</span>
            {score !== undefined && !isNaN(score) && ` - Pontuação: ${score.toFixed(1)}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Qualidade científica, segurança e potencial terapêutico</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NutraceuticalTag;
