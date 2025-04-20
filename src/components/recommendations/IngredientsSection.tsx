
import React from 'react';
import ActiveIngredientTag from './ActiveIngredientTag';
import { Nutraceutical } from '@/types';

interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

interface IngredientsSectionProps {
  ingredients: ActiveIngredientTag[];
  nutraceutical: Nutraceutical;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onEfficacyChange: (index: number, value: number) => void;
  onQuantityChange: (index: number, quantity: string) => void;
}

const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  ingredients,
  nutraceutical,
  onEdit,
  onRemove,
  onEfficacyChange,
  onQuantityChange
}) => {
  // Se não houver ingredientes, não renderizar nada
  if (!ingredients || ingredients.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium mb-2">Princípios ativos:</p>
        <div className="bg-slate-50 p-3 rounded-md text-sm text-gray-500">Carregando ingredientes...</div>
      </div>
    );
  }

  // Filtrar apenas ingredientes ativos (não removidos)
  const activeIngredients = ingredients.filter(ingredient => !ingredient.removed);
  
  return (
    <div>
      <p className="text-sm font-medium mb-2">Princípios ativos:</p>
      <div className="flex flex-wrap gap-2">
        {activeIngredients.map((ingredient) => {
          const originalIndex = ingredients.findIndex(i => i.name === ingredient.name);
          return (
            <ActiveIngredientTag 
              key={originalIndex} 
              name={ingredient.name}
              quantity={ingredient.quantity}
              originalIndex={originalIndex}
              nutraceutical={nutraceutical}
              onEdit={onEdit}
              onRemove={onRemove}
              efficacy={ingredient.efficacy || nutraceutical.scientificEvidence.efficacyScore / 5}
              onEfficacyChange={onEfficacyChange}
              onQuantityChange={onQuantityChange}
            />
          );
        })}
      </div>
    </div>
  );
};

export default IngredientsSection;
