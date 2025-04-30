
import React from 'react';
import { AlertTriangle } from "lucide-react";
import { NtaiSideEffectTag } from '@/types/ntai';
import SideEffectTag from '@/components/administrador/tags/SideEffectTag';

interface NtaiSideEffectsTabProps {
  sideEffects: NtaiSideEffectTag[];
}

const NtaiSideEffectsTab: React.FC<NtaiSideEffectsTabProps> = ({ sideEffects }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Efeitos Colaterais e Contraindicações
      </h4>
      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
        {sideEffects.length > 0 ? (
          sideEffects.map((effect, idx) => (
            <SideEffectTag 
              key={idx}
              effect={effect.name || effect.description || ""} 
              score={effect.intensityScore || 3}
              description={effect.description || ""}
              className="m-1"
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhum efeito colateral significativo identificado.</p>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Escala de intensidade: 1-2 (Leve), 3-4 (Moderado), 4-5 (Severo)</p>
      </div>
    </div>
  );
};

export default NtaiSideEffectsTab;
