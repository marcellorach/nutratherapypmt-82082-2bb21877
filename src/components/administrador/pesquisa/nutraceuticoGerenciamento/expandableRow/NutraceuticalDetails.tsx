
import React from 'react';
import { useTranslation } from 'react-i18next';

interface NutraceuticalDetailsProps {
  description?: string;
  chemical_compound?: string;
  source?: string;
  dosage?: string;
}

const NutraceuticalDetails: React.FC<NutraceuticalDetailsProps> = ({
  description,
  chemical_compound,
  source,
  dosage
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{t('nutraceuticals.details.title')}</h4>
      <div className="text-sm">
        <p><span className="font-medium">{t('nutraceuticals.details.description')}:</span> {description || t('nutraceuticals.details.notDefined')}</p>
        <p><span className="font-medium">{t('nutraceuticals.details.compound')}:</span> {chemical_compound || t('nutraceuticals.details.notDefined')}</p>
        <p><span className="font-medium">{t('nutraceuticals.details.source')}:</span> {source || t('nutraceuticals.details.notDefined')}</p>
        <p><span className="font-medium">{t('nutraceuticals.details.dosage')}:</span> {dosage || t('nutraceuticals.details.notDefined')}</p>
      </div>
    </div>
  );
};

export default NutraceuticalDetails;
