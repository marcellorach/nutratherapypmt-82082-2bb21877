
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Nutraceutical } from "@/types";
import { toast } from "sonner";
import TableHeaderComponent from './table/TableHeaderComponent';
import NutraceuticalRow from './table/NutraceuticalRow';
import EmptyState from './table/EmptyState';
import EvidenceLegend from './table/EvidenceLegend';

interface NutraceuticosTableProps {
  nutraceuticals: Nutraceutical[];
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals,
  onOpenDetails
}) => {
  const handleConditionClick = (condition: string) => {
    // Por enquanto apenas mostra um toast, mas poderia navegar para uma página de detalhes
    toast.info(`Detalhes da condição: ${condition}`, {
      description: "Funcionalidade em desenvolvimento"
    });
  };

  return (
    <>
      <EvidenceLegend />
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
                  onConditionClick={handleConditionClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
