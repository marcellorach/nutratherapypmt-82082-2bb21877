
import React from 'react';
import { Input } from "@/components/ui/input";
import { useTranslation } from 'react-i18next';

interface EstudoSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const EstudoSearch: React.FC<EstudoSearchProps> = ({ searchTerm, onSearchChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="mb-6">
      <Input
        placeholder={t('studies.search.placeholder')}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-lg"
      />
    </div>
  );
};

export default EstudoSearch;
