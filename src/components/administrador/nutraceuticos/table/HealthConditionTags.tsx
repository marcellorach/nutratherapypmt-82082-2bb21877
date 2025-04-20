
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface HealthConditionTagsProps {
  conditions: string[];
}

const HealthConditionTags: React.FC<HealthConditionTagsProps> = ({ conditions }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {conditions.map((condition, index) => (
        <Badge 
          key={`${condition}-${index}`}
          variant="outline" 
          className="bg-slate-50"
        >
          {condition}
        </Badge>
      ))}
    </div>
  );
};

export default HealthConditionTags;
