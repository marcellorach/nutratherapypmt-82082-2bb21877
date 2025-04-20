
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { NutraceuticalCondition } from "@/types";
import { TrendingUp } from 'lucide-react';

interface HealthConditionTagsProps {
  conditions: NutraceuticalCondition[];
  onConditionClick: (condition: NutraceuticalCondition) => void;
}

const HealthConditionTags: React.FC<HealthConditionTagsProps> = ({ 
  conditions,
  onConditionClick
}) => {
  const getEfficacyColor = (score: number): string => {
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
          className={`cursor-pointer transition-colors ${getEfficacyColor(condition.efficacyScore)} flex items-center`}
          onClick={() => onConditionClick(condition)}
        >
          <div className="flex items-center space-x-1">
            <span className="text-gray-800 font-normal">{condition.name}</span>
            <div className="flex items-center ml-2">
              <TrendingUp 
                size={14} 
                className="text-black/50 mr-1 opacity-70" 
                strokeWidth={2}
              />
              <span className="text-xs font-light text-black/70">
                {condition.efficacyScore.toFixed(1)}
              </span>
            </div>
          </div>
        </Badge>
      ))}
    </div>
  );
};

export default HealthConditionTags;
