
import React from 'react';
import { Recommendation } from '@/types';

interface RecommendationDetailsProps {
  recommendation: Recommendation;
}

const RecommendationDetails: React.FC<RecommendationDetailsProps> = ({ recommendation }) => {
  return (
    <div>
      <p className="text-sm font-medium">Motivo da recomendação:</p>
      <p className="text-sm">{recommendation.reason}</p>
    </div>
  );
};

export default RecommendationDetails;
