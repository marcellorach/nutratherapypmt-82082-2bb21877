
import React from 'react';
import { Link } from "lucide-react";
import { NtaiInteractionTag } from '@/types/ntai';
import InteractionTag from '../../../tags/InteractionTag';
import { useTranslation } from 'react-i18next';

interface NtaiInteractionsTabProps {
  interactions: NtaiInteractionTag[];
}

const NtaiInteractionsTab: React.FC<NtaiInteractionsTabProps> = ({ interactions }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Link className="h-4 w-4 text-blue-600" />
        {t('ntaiInteractions.title')}
      </h4>
      <div className="flex flex-wrap gap-2 bg-muted/30 p-3 rounded-md">
        {interactions.length > 0 ? (
          interactions.map((interaction, idx) => (
            <InteractionTag
              key={idx}
              nutraceutical={interaction.nutraceutical}
              interaction={interaction.interaction}
              confidence={interaction.confidence}
              className="m-1"
              type={interaction.interaction.toLowerCase().includes('não') ? 'negative' : 'positive'}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t('ntaiInteractions.noInteractions')}</p>
        )}
      </div>
    </div>
  );
};

export default NtaiInteractionsTab;
