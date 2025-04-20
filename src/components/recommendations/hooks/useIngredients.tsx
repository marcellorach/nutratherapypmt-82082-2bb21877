
import { useState, useEffect } from 'react';
import { Nutraceutical } from '@/types';
import { useToast } from "@/hooks/use-toast";

export interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

export const useIngredients = (nutraceutical: Nutraceutical | undefined) => {
  const { toast } = useToast();
  
  // Gerar quantidades variadas para cada ingrediente
  const generateVariedQuantity = (index: number) => {
    // Criar quantidades que variam entre 8mg e 22mg para parecer mais natural
    const baseQuantities = [12, 15, 8, 18, 22, 10, 14];
    const quantity = baseQuantities[index % baseQuantities.length];
    return `${quantity}mg`;
  };
  
  // Preparar os ingredientes ativos como tags com eficácia base
  const [ingredients, setIngredients] = useState<ActiveIngredientTag[]>([]);

  // Inicializar os ingredientes quando o nutraceutical mudar ou estiver disponível
  useEffect(() => {
    if (nutraceutical && nutraceutical.activeIngredients) {
      setIngredients(
        nutraceutical.activeIngredients.map((ingredient, index) => ({
          name: ingredient,
          quantity: generateVariedQuantity(index), // Quantidade variada para cada ingrediente
          removed: false,
          efficacy: 1.0 // Iniciar todos com eficácia 1.0
        }))
      );
    }
  }, [nutraceutical]);

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
    
    return updatedIngredients;
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
    
    return updatedIngredients;
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
      
      return updatedIngredients;
    }
    return ingredients;
  };
  
  // Função para atualizar a quantidade via slider
  const updateIngredientQuantity = (index: number, newQuantity: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: newQuantity
    };
    setIngredients(updatedIngredients);
    
    return updatedIngredients;
  };
  
  // Função para atualizar a eficácia de um ingrediente
  const updateIngredientEfficacy = (index: number, value: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      efficacy: value
    };
    setIngredients(updatedIngredients);
    
    return updatedIngredients;
  };
  
  return {
    ingredients,
    setIngredients,
    removeIngredient,
    restoreIngredient,
    editIngredientQuantity,
    updateIngredientQuantity,
    updateIngredientEfficacy,
  };
};
