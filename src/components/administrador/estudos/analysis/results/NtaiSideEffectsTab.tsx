
import React from 'react';
import { AlertTriangle } from "lucide-react";
import { NtaiSideEffectTag } from '@/types/ntai';
import SideEffectTag from '../../../tags/SideEffectTag';

interface NtaiSideEffectsTabProps {
  sideEffects: NtaiSideEffectTag[];
}

const NtaiSideEffectsTab: React.FC<NtaiSideEffectsTabProps> = ({ sideEffects }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Efeitos Colaterais
      </h4>
      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
        {sideEffects.length > 0 ? (
          sideEffects.map((effect, idx) => (
            <SideEffectTag 
              key={idx}
              effect={effect.name} 
              score={effect.intensityScore}
              className="m-1"
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhum efeito colateral significativo identificado.</p>
        )}
      </div>
      
      {sideEffects.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          <strong>Nota:</strong> A intensidade dos efeitos colaterais é medida de 0 a 5, onde 
          5 representa efeitos muito significativos.
        </div>
      )}
    </div>
  );
};

export default NtaiSideEffectsTab;
