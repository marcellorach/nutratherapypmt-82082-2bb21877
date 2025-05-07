
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ActionButtons from './ActionButtons';

interface MainRowProps {
  nutraceutical: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditClick?: (nutraceutical: any) => void;
  onDeleteClick?: (id: string) => void;
  onManageRelationships?: (nutraceutical: any) => void;
}

const MainRow: React.FC<MainRowProps> = ({
  nutraceutical,
  isExpanded,
  onToggleExpand,
  onEditClick,
  onDeleteClick,
  onManageRelationships
}) => {
  // Helper para obter o nome do outcome
  const getOutcomeName = () => {
    if (!nutraceutical) return "Não definido";
    
    // Primeiro, verifica se o objeto outcome completo está disponível
    if (nutraceutical.outcome && nutraceutical.outcome.name) {
      return nutraceutical.outcome.name;
    }
    
    // Depois, verifica se existe um outcome_name
    if (nutraceutical.outcome_name) {
      return nutraceutical.outcome_name;
    }
    
    // Depois verifica se existe category (nomenclatura antiga)
    if (nutraceutical.category) {
      return nutraceutical.category;
    }
    
    return "Não definido";
  };

  // Helper para obter o número de outcomes associados
  const getOutcomeCount = () => {
    if (!nutraceutical) return 0;
    
    // Verifica diferentes propriedades onde o contador pode estar
    if (nutraceutical.outcomeCount !== undefined) {
      return nutraceutical.outcomeCount;
    }
    
    if (nutraceutical.conditionCount !== undefined) {
      return nutraceutical.conditionCount;
    }
    
    if (Array.isArray(nutraceutical.nutraceutical_conditions)) {
      return nutraceutical.nutraceutical_conditions.length;
    }
    
    if (nutraceutical.outcomes_count !== undefined) {
      return nutraceutical.outcomes_count;
    }
    
    return 0;
  };

  // Helper para obter o número de estudos associados
  const getStudyCount = () => {
    if (!nutraceutical) return 0;
    
    if (nutraceutical.studyCount !== undefined) {
      return nutraceutical.studyCount;
    }
    
    if (Array.isArray(nutraceutical.nutraceutical_studies)) {
      return nutraceutical.nutraceutical_studies.length;
    }
    
    if (nutraceutical.studies_count !== undefined) {
      return nutraceutical.studies_count;
    }
    
    return 0;
  };

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span>{nutraceutical.name || "Sem nome"}</span>
        </div>
      </TableCell>
      <TableCell>
        {getOutcomeName()}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-blue-50">
          {getOutcomeCount()}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50">
          {getStudyCount()}
        </Badge>
      </TableCell>
      <TableCell>
        <ActionButtons
          onEditClick={onEditClick ? () => onEditClick(nutraceutical) : undefined}
          onManageRelationships={onManageRelationships ? () => onManageRelationships(nutraceutical) : undefined}
          onDeleteClick={onDeleteClick ? () => onDeleteClick(nutraceutical.id) : undefined}
        />
      </TableCell>
    </TableRow>
  );
};

export default MainRow;
