
import React from 'react';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
import EmptyState from './EmptyState';
import TableHeaderComponent from './TableHeader';
import NutraceuticalExpandableRow from '../NutraceuticalExpandableRow';

interface TableContentProps {
  filteredNutraceuticals: any[];
  expandedRows: Record<string, boolean>;
  toggleRowExpansion: (nutraId: string) => void;
  onEditClick?: (nutraceutical: any) => void;
  onDeleteClick?: (id: string) => void;
  onManageRelationships?: (nutraceutical: any) => void;
}

const TableContent: React.FC<TableContentProps> = ({
  filteredNutraceuticals,
  expandedRows,
  toggleRowExpansion,
  onEditClick,
  onDeleteClick,
  onManageRelationships
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderComponent />
        <TableBody>
          {filteredNutraceuticals.length === 0 ? (
            <EmptyState />
          ) : (
            filteredNutraceuticals.map((nutra) => (
              <NutraceuticalExpandableRow
                key={nutra.id}
                nutraceutical={nutra}
                isExpanded={!!expandedRows[nutra.id]}
                onToggleExpand={() => toggleRowExpansion(nutra.id)}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onManageRelationships={onManageRelationships}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableContent;
