
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recommendation, Nutraceutical } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  const getPriorityColor = (priority: number) => {
    switch(priority) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{nutraceutical.name}</CardTitle>
          <Badge className={`${getPriorityColor(recommendation.priority)}`}>
            Prioridade {recommendation.priority}
          </Badge>
        </div>
        <CardDescription>{nutraceutical.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm font-medium">Motivo da recomendação:</p>
          <p className="text-sm">{recommendation.reason}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-medium">Dosagem:</p>
            <p>{recommendation.dosage}</p>
          </div>
          <div>
            <p className="font-medium">Duração:</p>
            <p>{recommendation.duration}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium">Benefícios esperados:</p>
          <ul className="list-disc list-inside text-sm">
            {nutraceutical.benefits.slice(0, 2).map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
            {nutraceutical.benefits.length > 2 && (
              <li>+ {nutraceutical.benefits.length - 2} outros</li>
            )}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between text-xs text-gray-500">
        <div>Início: {recommendation.startDate}</div>
        <div>
          Evidência científica: {nutraceutical.scientificEvidence.score}/5
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
