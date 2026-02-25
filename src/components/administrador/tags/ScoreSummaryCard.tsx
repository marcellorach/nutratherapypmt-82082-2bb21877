
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { useTranslation } from 'react-i18next';

interface ScoreSummaryCardProps {
  score: number;
  title: string;
  description?: string;
}

const ScoreSummaryCard: React.FC<ScoreSummaryCardProps> = ({ 
  score,
  title,
  description
}) => {
  const { t } = useTranslation();
  const isNotEvaluated = score === 0;
  const level = getEvidenceLevel(score);
  
  return (
    <Card className="overflow-hidden">
      <div
        className="h-2"
        style={{ backgroundColor: isNotEvaluated ? 'hsl(var(--muted))' : level.color }}
      />
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">{title}</h4>
          {isNotEvaluated ? (
            <span className="text-sm font-medium text-muted-foreground">
              {t('studies.scores.notEvaluated')}
            </span>
          ) : (
            <span 
              className="text-lg font-bold"
              style={{ color: level.color }}
            >
              {score.toFixed(1)}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: isNotEvaluated ? '0%' : `${(score / 5) * 100}%`, 
                backgroundColor: level.color 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreSummaryCard;
