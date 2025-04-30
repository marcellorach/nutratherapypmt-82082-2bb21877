
import React from 'react';
import { NtaiSideEffectTag } from '@/types/ntai';
import SideEffectTag from '@/components/administrador/tags/SideEffectTag';
import { AlertTriangle } from 'lucide-react';

interface NtaiSideEffectsProcessorProps {
  sideEffects: NtaiSideEffectTag[];
}

const NtaiSideEffectsProcessor: React.FC<NtaiSideEffectsProcessorProps> = ({ sideEffects }) => {
  // Agrupar efeitos colaterais por severidade
  const groupedBySeverity = sideEffects.reduce<Record<string, NtaiSideEffectTag[]>>((acc, effect) => {
    const severity = effect.severity.toLowerCase();
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(effect);
    return acc;
  }, {});

  // Ordenar grupos de severidade: grave -> moderado -> leve
  const orderedSeverities = ['grave', 'alta', 'moderada', 'leve', 'baixa'];
  
  if (sideEffects.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Nenhum efeito colateral significativo identificado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderedSeverities.filter(severity => groupedBySeverity[severity]?.length > 0).map(severity => (
        <div key={severity} className="space-y-2">
          <h4 className="text-xs font-medium flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="capitalize">{severity}</span>
          </h4>
          <div className="flex flex-wrap gap-1">
            {groupedBySeverity[severity].map((effect, idx) => (
              <SideEffectTag
                key={`${effect.name}-${idx}`}
                effect={effect.name}
                score={effect.confidence}
                description={effect.description || ''}
                className="m-0.5"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NtaiSideEffectsProcessor;
