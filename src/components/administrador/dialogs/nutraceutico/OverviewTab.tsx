
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Nutraceutical } from "@/types";

interface OverviewTabProps {
  nutraceutical: Nutraceutical;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ nutraceutical }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">{t('overviewTab.benefits')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          {nutraceutical.benefits.map((benefit, index) => (
            <li key={index} className="text-sm">{benefit}</li>
          ))}
        </ul>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">{t('overviewTab.conditionLabel')}</h4>
        <p className="text-sm bg-slate-50 p-3 rounded-md border">
          {nutraceutical.condition}
        </p>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">{t('overviewTab.contraindications')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          {nutraceutical.contraindications.map((contraindication, index) => (
            <li key={index} className="text-sm">{contraindication}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
