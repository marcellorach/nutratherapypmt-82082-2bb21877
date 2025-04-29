import React, { useState } from 'react';
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import TableHeaderComponent from './table/TableHeaderComponent';
import NutraceuticalRow from './table/NutraceuticalRow';
import EmptyState from './table/EmptyState';
import EvidenceLegend from './table/EvidenceLegend';
import ConditionDetailDialog from '../dialogs/ConditionDetailDialog';
import NutraceuticoDetailDialog from '../dialogs/NutraceuticoDetailDialog';
import StarRating from './table/StarRating';

interface NutraceuticosTableProps {
  nutraceuticals: Nutraceutical[];
}

export const NutraceuticosTable: React.FC<NutraceuticosTableProps> = ({ 
  nutraceuticals
}) => {
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<Nutraceutical | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<NutraceuticalCondition | null>(null);
  const [conditionType, setConditionType] = useState<'prevention' | 'treatment' | 'support' | null>(null);
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false);
  const [isNutraceuticalDialogOpen, setIsNutraceuticalDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const handleConditionClick = (
    nutraceutical: Nutraceutical, 
    condition: NutraceuticalCondition,
    type: 'prevention' | 'treatment' | 'support'
  ) => {
    setSelectedNutraceutical(nutraceutical);
    setSelectedCondition(condition);
    setConditionType(type);
    setIsConditionDialogOpen(true);
  };
  
  const handleNutraceuticalClick = (nutraceutical: Nutraceutical) => {
    setSelectedNutraceutical(nutraceutical);
    setIsNutraceuticalDialogOpen(true);
  };
  
  const toggleRowExpand = (nutraceuticalId: string) => {
    setExpandedRows(prev => 
      prev.includes(nutraceuticalId) 
        ? prev.filter(id => id !== nutraceuticalId)
        : [...prev, nutraceuticalId]
    );
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
              <>
                {nutraceuticals.map((item) => (
                  <React.Fragment key={item.id}>
                    <NutraceuticalRow 
                      nutraceutical={item}
                      expanded={expandedRows.includes(item.id)}
                      onToggleExpand={() => toggleRowExpand(item.id)}
                      onConditionClick={handleConditionClick}
                    />
                    
                    {expandedRows.includes(item.id) && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={4}>
                          <div className="p-4 space-y-4">
                            <p className="text-sm">{item.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Origem</h4>
                                <p className="text-sm bg-white p-2 rounded-md border">{item.source}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Evidência Científica</h4>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border">
                                  <StarRating score={item.scientificEvidence.efficacyScore} />
                                  <span className="text-sm font-medium">{item.scientificEvidence.efficacyScore.toFixed(1)}/5</span>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Composto Químico</h4>
                                <p className="text-sm bg-white p-2 rounded-md border">
                                  {item.chemicalCompound}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Button
                                variant="link"
                                onClick={() => handleNutraceuticalClick(item)}
                                className="p-0"
                              >
                                Ver mais detalhes
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <ConditionDetailDialog 
        open={isConditionDialogOpen}
        onOpenChange={setIsConditionDialogOpen}
        nutraceutical={selectedNutraceutical}
        selectedCondition={selectedCondition}
        conditionType={conditionType}
      />
      
      <NutraceuticoDetailDialog
        open={isNutraceuticalDialogOpen}
        onOpenChange={setIsNutraceuticalDialogOpen}
        nutraceutical={selectedNutraceutical}
      />
    </>
  );
};
