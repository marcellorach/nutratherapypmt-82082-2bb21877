
import React from 'react';
import { Link } from "lucide-react";
import { NtaiInteractionTag } from '@/types/ntai';
import InteractionTag from '../../../tags/InteractionTag';

interface NtaiInteractionsTabProps {
  interactions: NtaiInteractionTag[];
}

const NtaiInteractionsTab: React.FC<NtaiInteractionsTabProps> = ({ interactions }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Link className="h-4 w-4 text-blue-600" />
        Interações Identificadas
      </h4>
      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
        {interactions.length > 0 ? (
          interactions.map((interaction, idx) => (
            <InteractionTag
              key={idx}
              nutraceutical={interaction.nutraceutical}
              interaction={interaction.interaction}
              confidence={interaction.confidence}
              className="m-1"
              // Determinando se é positiva ou negativa com base no conteúdo
              type={interaction.interaction.toLowerCase().includes('não') ? 'negative' : 'positive'}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhuma interação significativa identificada.</p>
        )}
      </div>
    </div>
  );
};

export default NtaiInteractionsTab;
