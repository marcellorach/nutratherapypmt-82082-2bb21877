
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Nutraceutical } from "@/types";
import TableHeaderComponent from './table/TableHeaderComponent';
import NutraceuticalRow from './table/NutraceuticalRow';
import EmptyState from './table/EmptyState';

interface NutraceuticosTableProps {
  nutraceuticals: Nutraceutical[];
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals,
  onOpenDetails
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeaderComponent />
        <TableBody>
          {nutraceuticals.length === 0 ? (
            <EmptyState />
          ) : (
            nutraceuticals.map((item) => (
              <NutraceuticalRow 
                key={item.id}
                nutraceutical={item}
                onOpenDetails={onOpenDetails}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
