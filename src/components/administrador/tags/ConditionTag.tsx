
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface ConditionTagProps {
  condition: string;
  score: number;
  showScore?: boolean;
  className?: string;
}

const ConditionTag: React.FC<ConditionTagProps> = ({ 
  condition, 
  score,
  showScore = true,
  className = ""
}) => {
  const { t } = useTranslation();
  const level = getEvidenceLevel(score);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`font-normal ${className}`}
            style={{ 
              backgroundColor: '#D3E4FD',
              color: '#1E40AF',
              borderColor: '#93C5FD'
            }}
          >
            <span>{condition}</span>
            {showScore && <span className="ml-1 font-semibold">({score.toFixed(1)})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p><span className="font-medium">{condition}</span> - {t('tags.efficacy')}: {score.toFixed(1)}/5</p>
          <p className="text-xs text-gray-500 mt-1">{t('tags.conditionRelevance')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConditionTag;
