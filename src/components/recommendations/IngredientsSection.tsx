
import React from 'react';
import ActiveIngredientTag from './ActiveIngredientTag';
import { Nutraceutical } from '@/types';

interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
}

interface IngredientsSectionProps {
  ingredients: ActiveIngredientTag[];
  nutraceutical: Nutraceutical;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  ingredients,
  nutraceutical,
  onEdit,
  onRemove
}) => {
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
            />
          );
        })}
      </div>
    </div>
  );
};

export default IngredientsSection;
