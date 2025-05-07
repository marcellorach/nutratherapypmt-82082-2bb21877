
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
  // Helper para obter o nome do outcome (adaptado para funcionar quando outcome não existir)
  const getOutcomeName = () => {
    if (!nutraceutical) return "Não definido";
    return "Categoria não definida";
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
          {nutraceutical.conditionCount || 0}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50">
          {nutraceutical.studyCount || 0}
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
