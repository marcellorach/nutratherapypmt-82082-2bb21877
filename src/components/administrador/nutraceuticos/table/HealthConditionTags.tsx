
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { NutraceuticalCondition } from "@/types";

interface HealthConditionTagsProps {
  conditions: NutraceuticalCondition[];
  onConditionClick: (condition: NutraceuticalCondition) => void;
}

const HealthConditionTags: React.FC<HealthConditionTagsProps> = ({ 
  conditions,
  onConditionClick
}) => {
  const getTagColor = (score: number): string => {
    if (score >= 4) return "bg-green-200 hover:bg-green-300";
    if (score >= 3) return "bg-amber-200 hover:bg-amber-300";
    if (score >= 2) return "bg-blue-200 hover:bg-blue-300";
    if (score >= 1) return "bg-orange-200 hover:bg-orange-300";
    return "bg-red-200 hover:bg-red-300";
  };

  return (
    <div className="flex flex-wrap gap-1">
      {conditions.map((condition, index) => (
        <Badge 
          key={`${condition.name}-${index}`}
          variant="outline" 
          className={`cursor-pointer transition-colors ${getTagColor(condition.efficacyScore)}`}
          onClick={() => onConditionClick(condition)}
        >
          <span className="mr-1 text-gray-500 font-normal">{condition.efficacyScore.toFixed(1)}</span>
          {condition.name}
        </Badge>
      ))}
    </div>
  );
};

export default HealthConditionTags;

