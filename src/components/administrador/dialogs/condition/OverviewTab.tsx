
import React from 'react';
import { NutraceuticalCondition, Nutraceutical } from "@/types";

interface OverviewTabProps {
  nutraceutical: Nutraceutical;
  selectedCondition: NutraceuticalCondition;
  conditionType: 'prevention' | 'treatment' | 'support';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  nutraceutical, 
  selectedCondition,
  conditionType
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Detalhes da Condição</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md">
          {selectedCondition.name} é uma condição que pode ser {conditionType === 'prevention' ? 'prevenida' : conditionType === 'treatment' ? 'tratada' : 'apoiada'} com 
          {' '}{nutraceutical.name}, através dos seguintes mecanismos de ação:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-3">
          {nutraceutical.benefits.map((benefit, index) => (
            <li key={index} className="text-sm">{benefit}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Princípios Ativos Relevantes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nutraceutical.activeIngredients.map((ingredient, index) => (
            <div key={index} className="flex items-center p-3 border rounded-md bg-white">
              <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
              <span>{ingredient}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Dosagem Recomendada para {selectedCondition.name}</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md border">
          {nutraceutical.dosage}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
