
import React from 'react';
import { Nutraceutical } from "@/types";

interface UsageTabProps {
  nutraceutical: Nutraceutical;
}

export const UsageTab: React.FC<UsageTabProps> = ({ nutraceutical }) => {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Dosagem Recomendada</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md border">
          {nutraceutical.dosage}
        </p>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">Formas de Administração</h4>
        <div className="p-4 bg-slate-50 rounded-md border text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Adição à ração</li>
            <li>Suplemento oral em forma de pasta</li>
            <li>Cápsulas</li>
            <li>Em pó para misturar com água</li>
          </ul>
        </div>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">Interações com Medicamentos</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md border text-gray-500 italic">
          Consulte um veterinário antes de combinar este nutracêutico com medicamentos convencionais.
        </p>
      </section>
    </div>
  );
};
