
import React from 'react';
import RemovedIngredientTag from './RemovedIngredientTag';

interface ActiveIngredientTag {
  name: string;
  quantity: string;
  removed?: boolean;
}

interface RemovedIngredientsSectionProps {
  ingredients: ActiveIngredientTag[];
  onRestore: (index: number) => void;
}

const RemovedIngredientsSection: React.FC<RemovedIngredientsSectionProps> = ({
  ingredients,
  onRestore
}) => {
  // Filtrar apenas ingredientes removidos
  const removedIngredients = ingredients.filter(ingredient => ingredient.removed);
  
  if (removedIngredients.length === 0) {
    return null;
  }
  
  return (
    <div className="w-full mt-2 pt-2 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-400 mb-1">Princípios ativos excluídos:</p>
      <div className="flex flex-wrap gap-1.5">
        {removedIngredients.map((ingredient) => {
          const originalIndex = ingredients.findIndex(i => i.name === ingredient.name);
          return (
            <RemovedIngredientTag 
              key={originalIndex} 
              name={ingredient.name}
              originalIndex={originalIndex}
              onRestore={onRestore}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RemovedIngredientsSection;
