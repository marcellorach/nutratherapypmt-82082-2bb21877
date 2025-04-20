
import React from 'react';
import { Nutraceutical } from "@/types";

interface IngredientsTabProps {
  nutraceutical: Nutraceutical;
}

export const IngredientsTab: React.FC<IngredientsTabProps> = ({ nutraceutical }) => {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Princípios Ativos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nutraceutical.activeIngredients.map((ingredient, index) => (
            <div key={index} className="flex items-center p-3 border rounded-md bg-white">
              <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
              <span>{ingredient}</span>
            </div>
          ))}
        </div>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">Fórmula Química e Mecanismos de Ação</h4>
        <div className="p-4 bg-slate-50 rounded-md border text-sm">
          <p className="text-gray-500 italic">
            Informações detalhadas sobre mecanismos moleculares estarão disponíveis em breve.
          </p>
        </div>
      </section>
    </div>
  );
};
