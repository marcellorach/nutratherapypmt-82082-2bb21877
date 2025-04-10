
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recommendation, Nutraceutical } from '@/types';
import { ExternalLink } from 'lucide-react';

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
      
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Motivo da recomendação:</p>
          <p className="text-sm">{recommendation.reason}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Princípios ativos:</p>
          <p className="text-sm">{nutraceutical.activeIngredients.join(', ')}</p>
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

        <div>
          <p className="text-sm font-medium mb-1">Evidências científicas:</p>
          <div className="flex gap-2 text-xs mb-2">
            <Badge variant="outline" className="bg-slate-50">
              Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5
            </Badge>
            <Badge variant="outline" className="bg-slate-50">
              Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5
            </Badge>
          </div>
          <div className="text-xs text-blue-600">
            {nutraceutical.scientificEvidence.studies.slice(0, 1).map((study, index) => (
              <div key={index} className="flex items-center gap-1 hover:underline cursor-pointer">
                <ExternalLink size={12} />
                <span>{study.title} ({study.year})</span>
              </div>
            ))}
            {nutraceutical.scientificEvidence.studies.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                + {nutraceutical.scientificEvidence.studies.length - 1} outro(s) estudo(s)
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between text-xs text-gray-500 border-t">
        <div>Início: {recommendation.startDate}</div>
        <div>
          Condição: {nutraceutical.condition}
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
