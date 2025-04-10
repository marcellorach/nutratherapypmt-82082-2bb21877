
import React from 'react';
import { Recommendation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface RecommendationDetailsProps {
  recommendation: Recommendation;
}

const RecommendationDetails: React.FC<RecommendationDetailsProps> = ({ recommendation }) => {
  // Determinar cor e ícone da prioridade
  const getPriorityDetails = (priority: number) => {
    switch (priority) {
      case 1: 
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Alta"
        };
      case 2: 
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <AlertTriangle className="h-4 w-4" />,
          label: "Média"
        };
      case 3: 
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Info className="h-4 w-4" />,
          label: "Baixa"
        };
      default: 
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Info className="h-4 w-4" />,
          label: "Normal"
        };
    }
  };

  const priorityDetails = getPriorityDetails(recommendation.priority);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Motivo da recomendação:</p>
        <Badge variant="outline" className={`flex items-center gap-1 ${priorityDetails.color}`}>
          {priorityDetails.icon}
          Prioridade {priorityDetails.label}
        </Badge>
      </div>
      <p className="text-sm bg-slate-50 p-2 rounded">{recommendation.reason}</p>
    </div>
  );
};

export default RecommendationDetails;
