
import React from 'react';
import { Nutraceutical } from "@/types";

interface OverviewTabProps {
  nutraceutical: Nutraceutical;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ nutraceutical }) => {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Benefícios</h4>
        <ul className="list-disc pl-5 space-y-1">
          {nutraceutical.benefits.map((benefit, index) => (
            <li key={index} className="text-sm">{benefit}</li>
          ))}
        </ul>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">Para qual condição é indicado</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md border">
          {nutraceutical.condition}
        </p>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">Contraindicações</h4>
        <ul className="list-disc pl-5 space-y-1">
          {nutraceutical.contraindications.map((contraindication, index) => (
            <li key={index} className="text-sm">{contraindication}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
