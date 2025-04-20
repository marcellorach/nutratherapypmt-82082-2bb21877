
import React from 'react';
import { Input } from "@/components/ui/input";

interface EstudoSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const EstudoSearch: React.FC<EstudoSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="mb-6">
      <Input
        placeholder="Buscar estudos por título, descrição ou journal..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-lg"
      />
    </div>
  );
};

export default EstudoSearch;
