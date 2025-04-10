
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Recommendation, Nutraceutical } from '@/types';
import CardHeader from './CardHeader';
import IngredientsSection from './IngredientsSection';
import RemovedIngredientsSection from './RemovedIngredientsSection';
import BenefitsSection from './BenefitsSection';
import ScientificEvidence from './ScientificEvidence';
import CardActions from './CardActions';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  // Preparar os ingredientes ativos como tags
  const [ingredients, setIngredients] = useState<ActiveIngredientTag[]>(
    nutraceutical.activeIngredients.map(ingredient => ({
      name: ingredient,
      quantity: '10mg', // Quantidade padrão para exemplo
      removed: false
    }))
  );

  // Função para remover um ingrediente
  const removeIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      removed: true
    };
    setIngredients(updatedIngredients);
  };

  // Função para restaurar um ingrediente
  const restoreIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      removed: false
    };
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
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader 
        title={nutraceutical.name}
        description={nutraceutical.description}
        condition={nutraceutical.condition}
        priority={recommendation.priority}
      />
      
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Motivo da recomendação:</p>
          <p className="text-sm">{recommendation.reason}</p>
        </div>
        
        {/* Princípios ativos como tags */}
        <IngredientsSection 
          ingredients={ingredients}
          nutraceutical={nutraceutical}
          onEdit={editIngredientQuantity}
          onRemove={removeIngredient}
        />
        
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
        
        <BenefitsSection benefits={nutraceutical.benefits} />

        <ScientificEvidence nutraceutical={nutraceutical} />
        
        {/* Novos botões de ação */}
        <CardActions 
          recommendation={recommendation}
          nutraceutical={nutraceutical}
        />
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col text-xs text-gray-500 border-t">
        <div className="w-full flex justify-between mb-2">
          <div>Início: {recommendation.startDate}</div>
        </div>
        
        {/* Área de ingredientes excluídos */}
        <RemovedIngredientsSection 
          ingredients={ingredients}
          onRestore={restoreIngredient}
        />
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
