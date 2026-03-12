
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface EvidenceTagProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

const EvidenceTag: React.FC<EvidenceTagProps> = ({ 
  score,
  showLabel = true,
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
              backgroundColor: level.backgroundColor || 'transparent',
              color: level.color,
              borderColor: `${level.color}50`
            }}
          >
            <span>{showLabel ? t(level.level) : `${score.toFixed(1)}/5`}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p><span className="font-medium">{t(level.level)}</span> ({score.toFixed(1)}/5)</p>
          <p className="text-xs text-muted-foreground mt-1">{t('evidenceTag.qualityTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EvidenceTag;
