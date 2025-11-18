
import React from 'react';
import { NtaiConditionTag } from '@/types/ntai';
import OutcomeTag from '../../../tags/OutcomeTag';
import { useTranslation } from 'react-i18next';

interface NtaiConditionsTabProps {
  conditions: NtaiConditionTag[];
}

const NtaiConditionsTab: React.FC<NtaiConditionsTabProps> = ({ conditions }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t('studies.ntai.conditions.title')}</h4>
      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md">
        {conditions.length > 0 ? (
          conditions.map((condition, idx) => (
            <OutcomeTag 
              key={idx}
              outcome={condition.name} 
              score={condition.efficacyScore || condition.confidence}
              className="m-1"
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">{t('studies.ntai.conditions.none')}</p>
        )}
      </div>
    </div>
  );
};

export default NtaiConditionsTab;
