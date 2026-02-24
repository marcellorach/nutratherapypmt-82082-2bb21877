
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface RelatedConditionsListProps {
  conditions: any[];
}

const RelatedConditionsList: React.FC<RelatedConditionsListProps> = ({ conditions }) => {
  const { t } = useTranslation();

  if (!conditions || conditions.length === 0) {
    return <div className="text-sm text-gray-500">{t('relatedConditions.noConditions')}</div>;
  }

  const preventionConditions = conditions.filter(c => 
    c.relationshipType === 'prevention' || 
    c.relationship_type === 'prevention'
  );
  
  const treatmentConditions = conditions.filter(c => 
    c.relationshipType === 'treatment' || 
    c.relationship_type === 'treatment'
  );
  
  const supportConditions = conditions.filter(c => 
    c.relationshipType === 'support' || 
    c.relationship_type === 'support' || 
    (!c.relationshipType && !c.relationship_type)
  );

  const getEfficacyColor = (score: number): string => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 3) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 2) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const renderConditionsGroup = (conditionsGroup: any[], title: string) => {
    if (conditionsGroup.length === 0) return null;

    return (
      <div className="mb-3" key={title}>
        <h6 className="text-sm font-medium mb-1">{title}</h6>
        <div className="flex flex-wrap gap-1">
          {conditionsGroup.map((condition, idx) => {
            const score = condition.efficacyScore || condition.efficacy_score || 0;
            return (
              <Badge 
                key={idx} 
                variant="outline"
                className={`${getEfficacyColor(score)} flex items-center gap-1`}
              >
                <span>{condition.name}</span>
                <div className="flex items-center space-x-1 ml-1">
                  <TrendingUp size={12} className="opacity-70" />
                  <span className="text-xs font-medium">
                    {score.toFixed(1)}/5
                  </span>
                </div>
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderConditionsGroup(preventionConditions, t('relatedConditions.prevention'))}
      {renderConditionsGroup(treatmentConditions, t('relatedConditions.treatment'))}
      {renderConditionsGroup(supportConditions, t('relatedConditions.support'))}
    </div>
  );
};

export default RelatedConditionsList;
