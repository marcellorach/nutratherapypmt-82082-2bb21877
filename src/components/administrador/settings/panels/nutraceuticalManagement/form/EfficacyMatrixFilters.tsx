
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  conditionFilter: string;
  setConditionFilter: (value: string) => void;
  efficacyFilter: string;
  setEfficacyFilter: (value: string) => void;
}

const EfficacyMatrixFilters: React.FC<Props> = ({
  conditionFilter,
  setConditionFilter,
  efficacyFilter,
  setEfficacyFilter
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 pb-2">
      <div className="w-full sm:w-1/2">
        <label htmlFor="condition-filter" className="text-sm font-medium">
          Condição
        </label>
        <Select 
          value={conditionFilter}
          onValueChange={setConditionFilter}
        >
          <SelectTrigger id="condition-filter">
            <SelectValue placeholder="Todas as condições" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as condições</SelectItem>
            <SelectItem value="cardiac">Cardíacas</SelectItem>
            <SelectItem value="joint">Articulações</SelectItem>
            <SelectItem value="renal">Renais</SelectItem>
            <SelectItem value="liver">Hepáticas</SelectItem>
            <SelectItem value="immune">Imunológicas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full sm:w-1/2">
        <label htmlFor="efficacy-filter" className="text-sm font-medium">
          Nível de Eficácia (0-5)
        </label>
        <Select 
          value={efficacyFilter}
          onValueChange={setEfficacyFilter}
        >
          <SelectTrigger id="efficacy-filter">
            <SelectValue placeholder="Todos os níveis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="high">Alta (4-5)</SelectItem>
            <SelectItem value="medium">Média (3-4)</SelectItem>
            <SelectItem value="low">Baixa (0-3)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default EfficacyMatrixFilters;
