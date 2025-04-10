
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
  
  // Preparar os ingredientes ativos como tags com eficácia base
  const [ingredients, setIngredients] = useState<ActiveIngredientTag[]>(
    nutraceutical.activeIngredients.map(ingredient => ({
      name: ingredient,
      quantity: '10mg', // Quantidade padrão para exemplo
      removed: false,
      efficacy: nutraceutical.scientificEvidence.efficacyScore / 5 // Convertendo de 0-5 para 0-1
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
    }
  };
  
  // Função para atualizar a eficácia de um ingrediente
  const updateIngredientEfficacy = (index: number, value: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      efficacy: value
    };
    setIngredients(updatedIngredients);
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
          onEfficacyChange={updateIngredientEfficacy}
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
