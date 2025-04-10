
import { useState, useEffect } from 'react';
import { Nutraceutical } from '@/types';
import { ActiveIngredientTag } from './useIngredients';

export const useScoreCalculation = (nutraceutical: Nutraceutical) => {
  // Escores de eficácia e sustentação calculados
  const [efficacyScore, setEfficacyScore] = useState(nutraceutical.scientificEvidence.efficacyScore);
  const [sustainabilityScore, setSustainabilityScore] = useState(nutraceutical.scientificEvidence.sustainabilityScore);
  
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

  return {
    efficacyScore,
    sustainabilityScore,
    recalculateScores
  };
};
