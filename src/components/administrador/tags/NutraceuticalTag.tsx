
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { normalizeScore, toPercentage } from '@/utils/score-normalization';

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
  // Normalize score to 0-1 scale (handles both 0-5 and 0-1 inputs)
  const normalizedScore = normalizeScore(score);
  const percentScore = toPercentage(score);
  const level = getEvidenceLevel(normalizedScore);
  
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
              <span className="ml-1 font-semibold">({Math.round(percentScore)}%)</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <span className="font-medium">{name}</span>
            {score !== undefined && !isNaN(score) && ` - Confiança: ${Math.round(percentScore)}%`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Nível de evidência científica</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NutraceuticalTag;
