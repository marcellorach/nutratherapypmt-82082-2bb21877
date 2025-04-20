
import React from 'react';
import RecommendationCardContainer from './RecommendationCardContainer';
import { Recommendation, Nutraceutical } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical?: Nutraceutical;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  return (
    <RecommendationCardContainer 
      recommendation={recommendation}
      nutraceutical={nutraceutical}
    />
  );
};

export default RecommendationCard;
