
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface NutraceuticalExpandedRowProps {
  nutraceutical: any;
  onEditClick: (nutraceutical: any) => void;
}

const NutraceuticalExpandedRow: React.FC<NutraceuticalExpandedRowProps> = ({ 
  nutraceutical, 
  onEditClick 
}) => {
  return (
    <TableRow className="bg-slate-50 hover:bg-slate-100">
      <TableCell colSpan={4} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Detalhes do Nutracêutico</h4>
            <div className="space-y-2">
              {nutraceutical.description && (
                <div>
                  <span className="font-medium text-sm text-slate-600">Descrição:</span>
                  <p className="text-sm">{nutraceutical.description}</p>
                </div>
              )}
              {nutraceutical.chemical_compound && (
                <div>
                  <span className="font-medium text-sm text-slate-600">Composto Químico:</span>
                  <p className="text-sm">{nutraceutical.chemical_compound}</p>
                </div>
              )}
              {nutraceutical.source && (
                <div>
                  <span className="font-medium text-sm text-slate-600">Fonte:</span>
                  <p className="text-sm">{nutraceutical.source}</p>
                </div>
              )}
              {nutraceutical.dosage && (
                <div>
                  <span className="font-medium text-sm text-slate-600">Dosagem:</span>
                  <p className="text-sm">{nutraceutical.dosage}</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Evidência Científica</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEditClick(nutraceutical)}
                title="Editar nutracêutico, condições e estudos"
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span>Editar</span>
              </Button>
            </div>
            {nutraceutical.scientificEvidence && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded border">
                  <span className="font-medium text-sm text-slate-600">Eficácia:</span>
                  <p className="text-lg font-medium">
                    {nutraceutical.scientificEvidence.efficacyScore?.toFixed(1) || "N/A"}/5
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="font-medium text-sm text-slate-600">Sustentação:</span>
                  <p className="text-lg font-medium">
                    {nutraceutical.scientificEvidence.sustainabilityScore?.toFixed(1) || "N/A"}/5
                  </p>
                </div>
              </div>
            )}
            {nutraceutical.scientificEvidence?.studies?.length > 0 && (
              <div>
                <span className="font-medium text-sm text-slate-600">Estudos Relacionados:</span>
                <p className="text-sm">{nutraceutical.scientificEvidence.studies.length} estudos</p>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default NutraceuticalExpandedRow;
