import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOutcomeFamilies } from '@/hooks/nutraceuticals/useOutcomeFamilies';

interface FamilySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const FamilySelector: React.FC<FamilySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Selecione uma família"
}) => {
  const { families, isLoading } = useOutcomeFamilies();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando famílias..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sem família</SelectItem>
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