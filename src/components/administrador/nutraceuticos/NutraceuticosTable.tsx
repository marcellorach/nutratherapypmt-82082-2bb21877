
import React, { useState } from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import TableHeaderComponent from './table/TableHeaderComponent';
import NutraceuticalRow from './table/NutraceuticalRow';
import EmptyState from './table/EmptyState';
import EvidenceLegend from './table/EvidenceLegend';
import ConditionDetailDialog from '../dialogs/ConditionDetailDialog';

interface NutraceuticosTableProps {
  nutraceuticals: Nutraceutical[];
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals
}) => {
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<Nutraceutical | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<NutraceuticalCondition | null>(null);
  const [conditionType, setConditionType] = useState<'prevention' | 'treatment' | 'support' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConditionClick = (
    nutraceutical: Nutraceutical, 
    condition: NutraceuticalCondition,
    type: 'prevention' | 'treatment' | 'support'
  ) => {
    setSelectedNutraceutical(nutraceutical);
    setSelectedCondition(condition);
    setConditionType(type);
    setIsDialogOpen(true);
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
                  onConditionClick={handleConditionClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConditionDetailDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        nutraceutical={selectedNutraceutical}
        selectedCondition={selectedCondition}
        conditionType={conditionType}
      />
    </>
  );
};
