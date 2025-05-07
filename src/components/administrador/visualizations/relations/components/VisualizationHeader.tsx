
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface VisualizationHeaderProps {
  efficacyFilter: string;
  onEfficacyFilterChange: (value: string) => void;
}

const VisualizationHeader: React.FC<VisualizationHeaderProps> = ({
  efficacyFilter,
  onEfficacyFilterChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-lg font-medium">Mapa de Relações</div>
      </div>
      <div className="flex items-center gap-4">
        <Select value={efficacyFilter} onValueChange={onEfficacyFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Eficácia" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Eficácia</SelectLabel>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta (4-5)</SelectItem>
              <SelectItem value="medium">Média (3-4)</SelectItem>
              <SelectItem value="low">Baixa (1-3)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VisualizationHeader;
