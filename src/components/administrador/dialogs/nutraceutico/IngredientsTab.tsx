
import React from 'react';
import { Nutraceutical } from "@/types";
import { useTranslation } from 'react-i18next';

interface IngredientsTabProps {
  nutraceutical: Nutraceutical;
}

export const IngredientsTab: React.FC<IngredientsTabProps> = ({ nutraceutical }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">{t('ingredientsTab.activeIngredients')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nutraceutical.activeIngredients.map((ingredient, index) => (
            <div key={index} className="flex items-center p-3 border rounded-md bg-card">
              <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
              <span>{ingredient}</span>
            </div>
          ))}
        </div>
      </section>
      
      <section>
        <h4 className="text-sm font-medium mb-2">{t('ingredientsTab.chemicalFormula')}</h4>
        <div className="p-4 bg-muted/30 rounded-md border text-sm">
          <p className="text-muted-foreground italic">
            {t('ingredientsTab.comingSoon')}
          </p>
        </div>
      </section>
    </div>
  );
};
