
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { getEvidenceLevel } from '@/rules/general/evidence-levels';

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
  const level = getEvidenceLevel(score);
  
  return (
    <Card className="overflow-hidden">
      <div
        className="h-2"
        style={{ backgroundColor: level.color }}
      />
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">{title}</h4>
          <span 
            className="text-lg font-bold"
            style={{ color: level.color }}
          >
            {score.toFixed(1)}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: `${(score / 5) * 100}%`, 
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
