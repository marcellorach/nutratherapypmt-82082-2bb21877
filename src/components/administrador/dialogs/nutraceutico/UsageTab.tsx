
import React from 'react';
import { Nutraceutical } from "@/types";
import { useTranslation } from 'react-i18next';

interface UsageTabProps {
  nutraceutical: Nutraceutical;
}

export const UsageTab: React.FC<UsageTabProps> = ({ nutraceutical }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">{t('usageTab.recommendedDosage')}</h4>
        <p className="text-sm bg-muted/30 p-3 rounded-md border">
          {nutraceutical.dosage}
        </p>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">{t('usageTab.administrationForms')}</h4>
        <div className="p-4 bg-muted/30 rounded-md border text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('usageTab.addToFood')}</li>
            <li>{t('usageTab.oralPaste')}</li>
            <li>{t('usageTab.capsules')}</li>
            <li>{t('usageTab.powderMix')}</li>
          </ul>
        </div>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">{t('usageTab.drugInteractions')}</h4>
        <p className="text-sm bg-muted/30 p-3 rounded-md border text-muted-foreground italic">
          {t('usageTab.consultVet')}
        </p>
      </section>
    </div>
  );
};
