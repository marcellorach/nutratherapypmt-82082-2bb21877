
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface HealthConditionTagsProps {
  conditions: string[];
  efficacyScore: number;
  onConditionClick: (condition: string) => void;
}

const HealthConditionTags: React.FC<HealthConditionTagsProps> = ({ 
  conditions,
  efficacyScore,
  onConditionClick
}) => {
  const getTagColor = (score: number): string => {
    if (score >= 4) return "bg-green-200 hover:bg-green-300";
    if (score >= 3) return "bg-amber-200 hover:bg-amber-300";
    if (score >= 2) return "bg-orange-200 hover:bg-orange-300";
    return "bg-red-200 hover:bg-red-300";
  };

  return (
    <div className="flex flex-wrap gap-1">
      {conditions.map((condition, index) => (
        <Badge 
          key={`${condition}-${index}`}
          variant="outline" 
          className={`cursor-pointer transition-colors ${getTagColor(efficacyScore)}`}
          onClick={() => onConditionClick(condition)}
        >
          {condition}
        </Badge>
      ))}
    </div>
  );
};

export default HealthConditionTags;
