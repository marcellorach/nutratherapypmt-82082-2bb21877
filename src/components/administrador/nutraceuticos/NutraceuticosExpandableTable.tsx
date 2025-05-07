
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import NutraceuticalRow from './table/NutraceuticalRow';
import NutraceuticalExpandedRow from './table/NutraceuticalExpandedRow';

interface NutraceuticosExpandableTableProps {
  nutraceuticals: any[];
  onEditClick: (nutraceutical: any) => void;
  onConditionClick?: (
    nutraceutical: any, 
    condition: any, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => void;
}

export const NutraceuticosExpandableTable: React.FC<NutraceuticosExpandableTableProps> = ({ 
  nutraceuticals, 
  onEditClick,
  onConditionClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const toggleRowExpansion = (nutraId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [nutraId]: !prev[nutraId]
    }));
  };

  const handleConditionClick = (
    nutraceutical: any, 
    condition: any, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => {
    if (onConditionClick) {
      onConditionClick(nutraceutical, condition, conditionType);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nutracêutico</TableHead>
            <TableHead>Prevenção</TableHead>
            <TableHead>Tratamento</TableHead>
            <TableHead>Suporte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nutraceuticals.length === 0 ? (
            <TableRow>
              <td colSpan={4} className="h-24 text-center">
                Nenhum resultado encontrado.
              </td>
            </TableRow>
          ) : (
            nutraceuticals.map((item) => (
              <React.Fragment key={item.id}>
                <NutraceuticalRow 
                  nutraceutical={item}
                  expanded={!!expandedRows[item.id]}
                  onToggleExpand={() => toggleRowExpansion(item.id)}
                  onConditionClick={handleConditionClick}
                />
                {expandedRows[item.id] && (
                  <NutraceuticalExpandedRow 
                    nutraceutical={item} 
                    onEditClick={onEditClick}
                  />
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NutraceuticosExpandableTable;
