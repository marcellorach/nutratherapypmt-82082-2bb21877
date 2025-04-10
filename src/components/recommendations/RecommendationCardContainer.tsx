
import React, { useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Recommendation, Nutraceutical } from '@/types';
import CardHeader from './CardHeader';
import IngredientsSection from './IngredientsSection';
import RemovedIngredientsSection from './RemovedIngredientsSection';
import BenefitsSection from './BenefitsSection';
import ScientificEvidence from './ScientificEvidence';
import CardActions from './CardActions';
import { Badge } from "@/components/ui/badge";
import { useIngredients } from './hooks/useIngredients';
import { useScoreCalculation } from './hooks/useScoreCalculation';
import RecommendationDetails from './RecommendationDetails';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

const RecommendationCardContainer: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  const {
    ingredients,
    removeIngredient,
    restoreIngredient,
    editIngredientQuantity,
    updateIngredientQuantity,
    updateIngredientEfficacy
  } = useIngredients(nutraceutical);

  const {
    efficacyScore,
    sustainabilityScore,
    recalculateScores
  } = useScoreCalculation(nutraceutical);

  // Atualizar escores sempre que os ingredientes mudarem
  useEffect(() => {
    recalculateScores(ingredients);
  }, [ingredients]);
  
  // Calcular escores iniciais
  useEffect(() => {
    recalculateScores(ingredients);
  }, []);
  
  // Criar um objeto nutraceutical modificado com os escores atualizados
  const updatedNutraceutical: Nutraceutical = {
    ...nutraceutical,
    scientificEvidence: {
      ...nutraceutical.scientificEvidence,
      efficacyScore: efficacyScore,
      sustainabilityScore: sustainabilityScore
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
        <RecommendationDetails recommendation={recommendation} />
        
        {/* Escores de eficácia e sustentação calculados dinamicamente */}
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-slate-50">
            Eficácia calculada: {efficacyScore.toFixed(1)}/5
          </Badge>
          <Badge variant="outline" className="bg-slate-50">
            Sustentação calculada: {sustainabilityScore.toFixed(1)}/5
          </Badge>
        </div>
        
        {/* Princípios ativos como tags */}
        <IngredientsSection 
          ingredients={ingredients}
          nutraceutical={nutraceutical}
          onEdit={editIngredientQuantity}
          onRemove={removeIngredient}
          onEfficacyChange={updateIngredientEfficacy}
          onQuantityChange={updateIngredientQuantity}
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

        <ScientificEvidence nutraceutical={updatedNutraceutical} />
        
        {/* Botões de ação */}
        <CardActions 
          recommendation={recommendation}
          nutraceutical={updatedNutraceutical}
          ingredients={ingredients}
          onIngredientEfficacyChange={updateIngredientEfficacy}
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

export default RecommendationCardContainer;
