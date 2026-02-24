
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { NutraceuticalCondition } from "@/types";
import { TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface HealthConditionTagsProps {
  conditions: NutraceuticalCondition[];
  onConditionClick: (condition: NutraceuticalCondition) => void;
}

const HealthConditionTags = ({ 
  conditions,
  onConditionClick
}) => {
  const { t } = useTranslation();
  
  const getEfficacyColor = (score: number): string => {
    if (score >= 4) return "bg-green-200 hover:bg-green-300";
    if (score >= 3) return "bg-amber-200 hover:bg-amber-300";
    if (score >= 2) return "bg-blue-200 hover:bg-blue-300";
    if (score >= 1) return "bg-orange-200 hover:bg-orange-300";
    return "bg-red-200 hover:bg-red-300";
  };

  const getIconColor = (score: number): string => {
    if (score >= 3.7) return "text-green-600";
    if (score > 2 && score < 3.7) return "text-black/50";
    return "text-red-600";
  };

  if (!conditions || conditions.length === 0) {
    return (
      <div className="flex items-center justify-center h-8">
        <span className="text-muted-foreground text-xs">{t('healthTags.noCondition')}</span>
      </div>
    );
  }

  const visibleConditions = conditions.slice(0, 3);
  const hasMore = conditions.length > 3;

  return (
    <div className="flex flex-wrap gap-1 max-w-full">
      {visibleConditions.map((condition, index) => {
        const truncatedName = condition.name.length > 15 
          ? `${condition.name.substring(0, 15)}...` 
          : condition.name;
        
        return (
          <TooltipProvider key={`${condition.id || condition.name}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`cursor-pointer transition-colors text-xs px-2 py-1 ${getEfficacyColor(condition.efficacyScore)} flex items-center max-w-[140px]`}
                  onClick={() => onConditionClick(condition)}
                >
                  <div className="flex items-center space-x-1 min-w-0">
                    <span className="text-foreground font-normal truncate">{truncatedName}</span>
                    <div className="flex items-center flex-shrink-0">
                      <TrendingUp 
                        size={12} 
                        className={`${getIconColor(condition.efficacyScore)}`} 
                        strokeWidth={2}
                      />
                      <span className="text-xs font-light text-foreground/70 ml-1">
                        {condition.efficacyScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium">{condition.name}</p>
                  <p className="text-xs mt-1">{t('healthTags.efficacy', { score: condition.efficacyScore.toFixed(1) })}</p>
                  {condition.description && (
                    <p className="text-xs mt-1 text-muted-foreground">{condition.description}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      
      {hasMore && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="cursor-pointer bg-muted hover:bg-muted/80 text-xs px-2 py-1"
              >
                +{conditions.length - 3}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium">{t('healthTags.additionalConditions')}</p>
                <ul className="text-xs mt-1">
                  {conditions.slice(3).map((condition, index) => (
                    <li key={index} className="truncate">• {condition.name}</li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default HealthConditionTags;
