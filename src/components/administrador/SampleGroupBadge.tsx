import React from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENT_SAMPLE_GROUP } from '@/data/sampleGroups';
import { Badge } from '@/components/ui/badge';

const SampleGroupBadge: React.FC = () => {
  const { t } = useTranslation();
  
  const eligiblePetsFormatted = CURRENT_SAMPLE_GROUP.eligiblePets.toLocaleString();
  
  return (
    <Badge 
      variant="outline" 
      className="text-xs font-medium bg-primary/5 text-primary border-primary/20 px-3 py-1"
    >
      📊 {t('sampleGroup.badge', { id: CURRENT_SAMPLE_GROUP.id })} • {eligiblePetsFormatted} {t('visualization.conditions.stats.eligiblePetsLabel')}
    </Badge>
  );
};

export default SampleGroupBadge;
