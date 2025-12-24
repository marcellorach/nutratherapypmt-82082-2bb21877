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
import { Loader2 } from 'lucide-react';
import { useIngredients } from './hooks/useIngredients';
import { useScoreCalculation } from './hooks/useScoreCalculation';
import { usePersistence } from './hooks/usePersistence';
import RecommendationDetails from './RecommendationDetails';
import ConfidenceIndicator from './ConfidenceIndicator';
import RecommendationDisclaimer from './RecommendationDisclaimer';
import { RecommendationConfidence, DisclaimerType } from '@/types/recommendation-confidence';

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical?: Nutraceutical;
  confidence?: RecommendationConfidence;
  disclaimer?: DisclaimerType;
}

const RecommendationCardContainer: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical,
  confidence,
  disclaimer
}) => {
  // Se o nutraceutical não estiver definido, exibir uma mensagem de erro
  if (!nutraceutical) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500 relative">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 font-medium mb-2">Erro: Dados do nutraceutical não encontrados</div>
          <div className="text-sm text-gray-500">ID: {recommendation.nutraceuticalId}</div>
        </CardContent>
      </Card>
    );
  }

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
  
  const {
    isSaving,
    isApproved,
    hasChanges,
    savedState,
    approveRecommendation,
    checkForChanges
  } = usePersistence(recommendation, nutraceutical, ingredients, efficacyScore, sustainabilityScore);

  // Atualizar escores sempre que os ingredientes mudarem
  useEffect(() => {
    if (ingredients.length > 0) {
      recalculateScores(ingredients);
    }
  }, [ingredients]);
  
  // Calcular escores iniciais
  useEffect(() => {
    if (ingredients.length > 0) {
      recalculateScores(ingredients);
    }
  }, [ingredients.length]);
  
  // Verificar por mudanças quando ingredientes ou escores mudarem
  useEffect(() => {
    if (ingredients.length > 0) {
      checkForChanges(ingredients);
    }
  }, [ingredients, efficacyScore, sustainabilityScore, isApproved]);
  
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
    <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary relative">
      {isSaving && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-green-100 text-green-700 py-1 px-3 rounded-md text-sm">
          <Loader2 size={16} className="animate-spin" />
          Salvando...
        </div>
      )}
      
      <CardHeader 
        title={nutraceutical.name}
        description={nutraceutical.description}
        condition={nutraceutical.condition}
        priority={recommendation.priority}
      />
      
      <CardContent className="space-y-3">
        {/* Disclaimer de confiança (se aplicável) */}
        <RecommendationDisclaimer 
          disclaimerType={disclaimer || 'none'} 
          rationale={confidence?.rationale}
        />
        
        <RecommendationDetails recommendation={recommendation} />
        
        {/* Escores de eficácia e sustentação calculados dinamicamente */}
        <div className="flex flex-wrap gap-2 text-xs">
          {confidence && (
            <ConfidenceIndicator confidence={confidence} showDetails size="sm" />
          )}
          <Badge variant="outline" className="bg-slate-50">
            Eficácia calculada: {efficacyScore.toFixed(1)}/5
          </Badge>
          <Badge variant="outline" className="bg-slate-50">
            Sustentação calculada: {sustainabilityScore.toFixed(1)}/5
          </Badge>
        </div>
        
        {savedState.lastSaved && (
          <div className="text-xs text-gray-500">
            Última alteração: {savedState.lastSaved.toLocaleString('pt-BR')}
          </div>
        )}
        
        {/* Princípios ativos como tags */}
        {ingredients.length > 0 && (
          <IngredientsSection 
            ingredients={ingredients}
            nutraceutical={nutraceutical}
            onEdit={editIngredientQuantity}
            onRemove={removeIngredient}
            onEfficacyChange={updateIngredientEfficacy}
            onQuantityChange={updateIngredientQuantity}
          />
        )}
        
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
          isApproved={isApproved}
          onApprove={approveRecommendation}
        />
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col text-xs text-gray-500 border-t">
        <div className="w-full flex justify-between mb-2">
          <div>Início: {recommendation.startDate}</div>
        </div>
        
        {/* Área de ingredientes excluídos */}
        {ingredients.length > 0 && (
          <RemovedIngredientsSection 
            ingredients={ingredients}
            onRestore={restoreIngredient}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default RecommendationCardContainer;
