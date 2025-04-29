
import React from 'react';
import { Tags } from "lucide-react";
import { NtaiNutraceuticalTag } from '@/types/ntai';
import NutraceuticalTag from '../../../tags/NutraceuticalTag';

interface NtaiNutraceuticalsTabProps {
  nutraceuticals: NtaiNutraceuticalTag[];
}

const NtaiNutraceuticalsTab: React.FC<NtaiNutraceuticalsTabProps> = ({ nutraceuticals }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Tags className="h-4 w-4" />
        Nutracêuticos Identificados
      </h4>
      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
        {nutraceuticals.length > 0 ? (
          nutraceuticals.map((nutra, idx) => (
            <NutraceuticalTag 
              key={idx}
              name={nutra.name} 
              score={nutra.confidence}
              className="m-1"
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhum nutracêutico identificado.</p>
        )}
      </div>
    </div>
  );
};

export default NtaiNutraceuticalsTab;
