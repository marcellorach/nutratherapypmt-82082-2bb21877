
import { useState, useEffect } from 'react';
import { Recommendation, Nutraceutical } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ActiveIngredientTag } from './useIngredients';

export interface SavedChanges {
  ingredientsModified: boolean;
  approved: boolean;
  efficacyScore: number;
  sustainabilityScore: number;
  lastSaved?: Date;
}

export const usePersistence = (
  recommendation: Recommendation,
  nutraceutical: Nutraceutical,
  ingredients: ActiveIngredientTag[],
  efficacyScore: number,
  sustainabilityScore: number
) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedState, setSavedState] = useState<SavedChanges>({
    ingredientsModified: false,
    approved: false,
    efficacyScore: nutraceutical.scientificEvidence.efficacyScore,
    sustainabilityScore: nutraceutical.scientificEvidence.sustainabilityScore,
    lastSaved: undefined
  });

  // Verificar se há mudanças não salvas comparando com o estado salvo
  const checkForChanges = (currentIngredients: ActiveIngredientTag[]) => {
    const ingredientsChanged = currentIngredients.some(ing => ing.removed) || 
      currentIngredients.some(ing => ing.efficacy !== 1.0);
    
    const scoreChanged = 
      efficacyScore !== savedState.efficacyScore || 
      sustainabilityScore !== savedState.sustainabilityScore;
    
    const approvalChanged = isApproved !== savedState.approved;
    
    const hasAnyChanges = ingredientsChanged || scoreChanged || approvalChanged;
    setHasChanges(hasAnyChanges);
    return hasAnyChanges;
  };

  // Salvar alterações
  const saveChanges = () => {
    setIsSaving(true);
    
    // Simular uma chamada de API com setTimeout
    setTimeout(() => {
      // Atualizar o estado salvo
      setSavedState({
        ingredientsModified: ingredients.some(ing => ing.removed) || ingredients.some(ing => ing.efficacy !== 1.0),
        approved: isApproved,
        efficacyScore,
        sustainabilityScore,
        lastSaved: new Date()
      });
      
      setHasChanges(false);
      setIsSaving(false);
      
      // Exibir toast de sucesso
      toast({
        title: "Alterações salvas",
        description: `Modificações na recomendação de ${nutraceutical.name} foram salvas com sucesso.`,
        variant: "default",
      });
    }, 800);
  };
  
  // Aprovar recomendação
  const approveRecommendation = () => {
    setIsApproved(true);
    setHasChanges(true);
    
    toast({
      title: "Recomendação aprovada",
      description: `${nutraceutical.name} foi aprovado para o tratamento.`,
      variant: "default",
    });
  };
  
  // Salvar automaticamente quando houver mudanças
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        saveChanges();
      }, 1500); // Aguarda 1.5 segundos após a última alteração para salvar
      
      return () => clearTimeout(timer);
    }
  }, [ingredients, efficacyScore, sustainabilityScore, isApproved]);
  
  return {
    isSaving,
    isApproved,
    hasChanges,
    savedState,
    setIsApproved,
    saveChanges,
    approveRecommendation,
    checkForChanges
  };
};
