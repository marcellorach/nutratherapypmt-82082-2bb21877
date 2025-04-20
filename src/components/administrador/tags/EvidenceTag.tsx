
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EvidenceTagProps {
  score: number;
  showLabel?: boolean;
  showScore?: boolean;
  className?: string;
}

const EvidenceTag: React.FC<EvidenceTagProps> = ({ 
  score, 
  showLabel = true,
  showScore = true,
  className = ""
}) => {
  const level = getEvidenceLevel(score);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`font-normal ${className}`}
            style={{ 
              backgroundColor: level.backgroundColor,
              color: level.color,
              borderColor: level.color
            }}
          >
            {showScore && <span className="font-medium mr-1">{score.toFixed(1)}</span>}
            {showLabel && <span>{level.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Pontuação de evidência: {score.toFixed(1)} ({level.label})</p>
          <p className="text-xs text-gray-500 mt-1">Baseado em rigor científico, reprodutibilidade e aplicabilidade</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EvidenceTag;
