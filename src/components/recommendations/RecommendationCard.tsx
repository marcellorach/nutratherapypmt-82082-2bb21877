
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Recommendation, Nutraceutical } from '@/types';
import CardHeader from './CardHeader';
import IngredientsSection from './IngredientsSection';
import RemovedIngredientsSection from './RemovedIngredientsSection';
import BenefitsSection from './BenefitsSection';
import ScientificEvidence from './ScientificEvidence';
import CardActions from './CardActions';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  nutraceutical 
}) => {
  const { toast } = useToast();
  
  // Escores de eficácia e sustentação calculados
  const [efficacyScore, setEfficacyScore] = useState(nutraceutical.scientificEvidence.efficacyScore);
  const [sustainabilityScore, setSustainabilityScore] = useState(nutraceutical.scientificEvidence.sustainabilityScore);
  
  // Gerar quantidades variadas para cada ingrediente
  const generateVariedQuantity = (index: number) => {
    // Criar quantidades que variam entre 8mg e 22mg para parecer mais natural
    const baseQuantities = [12, 15, 8, 18, 22, 10, 14];
    const quantity = baseQuantities[index % baseQuantities.length];
    return `${quantity}mg`;
  };
  
  // Preparar os ingredientes ativos como tags com eficácia base
  const [ingredients, setIngredients] = useState<ActiveIngredientTag[]>(
    nutraceutical.activeIngredients.map((ingredient, index) => ({
      name: ingredient,
      quantity: generateVariedQuantity(index), // Quantidade variada para cada ingrediente
      removed: false,
      efficacy: 1.0 // Iniciar todos com eficácia 1.0
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
    
    toast({
      title: "Ingrediente removido",
      description: `${updatedIngredients[index].name} foi removido da fórmula.`,
      variant: "default",
    });
    
    // Recalcular escores
    recalculateScores(updatedIngredients);
  };

  // Função para restaurar um ingrediente
  const restoreIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      removed: false
    };
    setIngredients(updatedIngredients);
    
    toast({
      title: "Ingrediente restaurado",
      description: `${updatedIngredients[index].name} foi adicionado novamente à fórmula.`,
      variant: "default",
    });
    
    // Recalcular escores
    recalculateScores(updatedIngredients);
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
      
      toast({
        title: "Quantidade atualizada",
        description: `${updatedIngredients[index].name} agora tem ${newQuantity}.`,
        variant: "default",
      });
      
      // Recalcular escores
      recalculateScores(updatedIngredients);
    }
  };
  
  // Função para atualizar a quantidade via slider
  const updateIngredientQuantity = (index: number, newQuantity: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: newQuantity
    };
    setIngredients(updatedIngredients);
    
    // Recalcular escores
    recalculateScores(updatedIngredients);
  };
  
  // Função para atualizar a eficácia de um ingrediente
  const updateIngredientEfficacy = (index: number, value: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      efficacy: value
    };
    setIngredients(updatedIngredients);
    
    // Recalcular escores
    recalculateScores(updatedIngredients);
  };
  
  // Recalcular escores de eficácia e sustentação com base nos ingredientes
  const recalculateScores = (updatedIngredients: ActiveIngredientTag[]) => {
    const activeIngredients = updatedIngredients.filter(i => !i.removed);
    
    if (activeIngredients.length === 0) {
      // Se todos os ingredientes foram removidos, reduzir os escores pela metade
      setEfficacyScore(nutraceutical.scientificEvidence.efficacyScore * 0.5);
      setSustainabilityScore(nutraceutical.scientificEvidence.sustainabilityScore * 0.5);
      return;
    }
    
    // Calcular média ponderada de eficácia dos ingredientes ativos
    // Dar mais peso aos ingredientes com maior eficácia
    let totalEfficacyWeight = 0;
    let weightedEfficacySum = 0;
    
    activeIngredients.forEach(ing => {
      const weight = ing.efficacy * ing.efficacy; // Peso quadrático para efeito não linear
      weightedEfficacySum += ing.efficacy * weight;
      totalEfficacyWeight += weight;
    });
    
    const ingredientEfficacyAvg = weightedEfficacySum / totalEfficacyWeight;
    
    // Calcular média de quantidade relativa com efeito não linear
    const getQuantityEffect = (quantityStr: string) => {
      const match = quantityStr.match(/(\d+)/);
      if (!match) return 1;
      
      const quantity = parseInt(match[1]);
      // Efeito não linear da quantidade: incremento maior em doses maiores
      return Math.pow(quantity / 25, 1.5);
    };
    
    const quantityAvg = activeIngredients.reduce((sum, ing) => {
      return sum + getQuantityEffect(ing.quantity);
    }, 0) / activeIngredients.length;
    
    // Calculo de eficácia final com ponderação não linear
    const baseEfficacy = nutraceutical.scientificEvidence.efficacyScore;
    const ingredientFactor = Math.pow(ingredientEfficacyAvg, 1.2);
    const quantityFactor = Math.pow(quantityAvg, 1.1);
    
    // Eficácia final é uma mistura não linear de fatores
    const finalEfficacy = (baseEfficacy * 0.3) + 
                         (ingredientFactor * 0.5) + 
                         (quantityFactor * 0.2 * 3);
    
    // Sustentação usa fórmula similar mas com menos peso na quantidade
    const finalSustainability = (nutraceutical.scientificEvidence.sustainabilityScore * 0.4) + 
                               (ingredientFactor * 0.4) + 
                               (quantityFactor * 0.2 * 2);
    
    // Limitar entre 1 e 5
    setEfficacyScore(Math.min(5, Math.max(1, finalEfficacy)));
    setSustainabilityScore(Math.min(5, Math.max(1, finalSustainability)));
  };
  
  // Recalcular escores quando os ingredientes mudarem
  useEffect(() => {
    recalculateScores(ingredients);
  }, []);
  
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

        <ScientificEvidence nutraceutical={{ 
          ...nutraceutical, 
          scientificEvidence: {
            ...nutraceutical.scientificEvidence,
            efficacyScore: efficacyScore,
            sustainabilityScore: sustainabilityScore
          }
        }} />
        
        {/* Botões de ação */}
        <CardActions 
          recommendation={recommendation}
          nutraceutical={{
            ...nutraceutical,
            scientificEvidence: {
              ...nutraceutical.scientificEvidence,
              efficacyScore: efficacyScore,
              sustainabilityScore: sustainabilityScore
            }
          }}
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

export default RecommendationCard;
