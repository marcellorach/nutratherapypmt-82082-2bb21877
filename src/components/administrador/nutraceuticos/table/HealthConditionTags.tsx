
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
  return (
    <div className="flex flex-wrap gap-1">
      {conditions.map((condition, index) => (
        <Badge 
          key={`${condition.name}-${index}`}
          variant="outline" 
          className="cursor-pointer transition-colors bg-green-50 hover:bg-green-100 flex items-center"
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
