
import React from 'react';
import { Recommendation } from '@/types';
import { Badge } from '@/components/ui/badge';

interface RecommendationDetailsProps {
  recommendation: Recommendation;
}

const RecommendationDetails: React.FC<RecommendationDetailsProps> = ({ recommendation }) => {
  // Determinar cor da prioridade
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-red-50 text-red-700 border-red-200";
      case 2: return "bg-amber-50 text-amber-700 border-amber-200";
      case 3: return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Motivo da recomendação:</p>
        <Badge variant="outline" className={`${getPriorityColor(recommendation.priority)}`}>
          Prioridade {recommendation.priority}
        </Badge>
      </div>
      <p className="text-sm bg-slate-50 p-2 rounded">{recommendation.reason}</p>
    </div>
  );
};

export default RecommendationDetails;
