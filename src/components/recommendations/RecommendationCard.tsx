
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recommendation, Nutraceutical } from '@/types';
import { ExternalLink, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

interface ActiveIngredientTag {
  name: string;
  quantity: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  // Preparar os ingredientes ativos como tags
  const [ingredients, setIngredients] = useState<ActiveIngredientTag[]>(
    nutraceutical.activeIngredients.map(ingredient => ({
      name: ingredient,
      quantity: '10mg' // Quantidade padrão para exemplo
    }))
  );

  // Função para remover um ingrediente
  const removeIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  };

  // Função para editar a quantidade de um ingrediente
  const editIngredientQuantity = (index: number) => {
    const newQuantity = prompt('Digite a nova quantidade:', ingredients[index].quantity);
    if (newQuantity) {
      const updatedIngredients = [...ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        quantity: newQuantity
      };
      setIngredients(updatedIngredients);
    }
  };

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
        {/* Condição movida para o topo */}
        <div className="bg-slate-50 -mx-6 -mt-6 px-6 py-2 border-b mb-4">
          <p className="font-medium text-sm">Condição: {nutraceutical.condition}</p>
        </div>
        
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
        
        {/* Princípios ativos como tags */}
        <div>
          <p className="text-sm font-medium mb-2">Princípios ativos:</p>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="py-1 pl-2 pr-1 flex items-center gap-1 bg-slate-50"
              >
                <span>{ingredient.name} ({ingredient.quantity})</span>
                <div className="flex">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 p-0.5 hover:bg-slate-200" 
                    onClick={() => editIngredientQuantity(index)}
                  >
                    <Edit2 size={14} className="text-blue-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 p-0.5 hover:bg-slate-200" 
                    onClick={() => removeIngredient(index)}
                  >
                    <X size={14} className="text-red-500" />
                  </Button>
                </div>
              </Badge>
            ))}
          </div>
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
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
