import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOutcomeFamilies } from '@/hooks/nutraceuticals/useOutcomeFamilies';
import { useTranslation } from 'react-i18next';

interface FamilySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const FamilySelector: React.FC<FamilySelectorProps> = ({
  value,
  onValueChange,
  placeholder
}) => {
  const { families, isLoading } = useOutcomeFamilies();
  const { t } = useTranslation();
  
  const displayPlaceholder = placeholder || t('outcomeManagement.familySelector.placeholder');

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={t('outcomeManagement.familySelector.loading')} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={displayPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('outcomeManagement.familySelector.noFamily')}</SelectItem>
        {families.map((family) => (
          <SelectItem key={family.id} value={family.id}>
            <div className="flex items-center gap-2">
              <span>{family.icon}</span>
              <span>{family.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FamilySelector;