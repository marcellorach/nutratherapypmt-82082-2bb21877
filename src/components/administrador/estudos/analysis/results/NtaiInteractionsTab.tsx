
import React from 'react';
import { ArrowDown, ArrowUp } from "lucide-react";
import { NtaiInteractionTag } from '@/types/ntai';
import InteractionTag from '../../../tags/InteractionTag';

interface NtaiInteractionsTabProps {
  interactions: NtaiInteractionTag[];
}

const NtaiInteractionsTab: React.FC<NtaiInteractionsTabProps> = ({ interactions }) => {
  const positiveInteractions = interactions.filter(i => i.type === 'positive');
  const negativeInteractions = interactions.filter(i => i.type === 'negative');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ArrowUp className="h-4 w-4 text-green-600" />
          Interações Positivas
        </h4>
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
          {positiveInteractions.length > 0 ? (
            positiveInteractions.map((interaction, idx) => (
              <InteractionTag 
                key={idx}
                name={interaction.name} 
                score={interaction.score}
                type="positive"
                className="m-1"
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhuma interação positiva identificada.</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ArrowDown className="h-4 w-4 text-red-600" />
          Interações Negativas
        </h4>
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
          {negativeInteractions.length > 0 ? (
            negativeInteractions.map((interaction, idx) => (
              <InteractionTag 
                key={idx}
                name={interaction.name} 
                score={interaction.score}
                type="negative"
                className="m-1"
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhuma interação negativa identificada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NtaiInteractionsTab;
