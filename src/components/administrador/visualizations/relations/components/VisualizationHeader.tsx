
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VisualizationHeaderProps {
  efficacyFilter: string;
  onEfficacyFilterChange: (value: string) => void;
}

const VisualizationHeader: React.FC<VisualizationHeaderProps> = ({
  efficacyFilter,
  onEfficacyFilterChange
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Visualização de Relações</h3>
        <div className="text-sm text-gray-500">
          Dados de demonstração carregados com sucesso
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Visualize relações entre nutracêuticos, condições de saúde e estudos científicos.
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filtrar por eficácia:</span>
          <Select value={efficacyFilter} onValueChange={onEfficacyFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por eficácia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas eficácias</SelectItem>
              <SelectItem value="high">Alta eficácia (≥4)</SelectItem>
              <SelectItem value="medium">Média eficácia (3-4)</SelectItem>
              <SelectItem value="low">Baixa eficácia (&lt;3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default VisualizationHeader;
