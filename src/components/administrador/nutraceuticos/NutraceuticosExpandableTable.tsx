
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit, Eye } from "lucide-react";
import { Nutraceutical } from "@/types";
import HealthConditionTags from './table/HealthConditionTags';

interface NutraceuticosExpandableTableProps {
  nutraceuticals: Nutraceutical[];
  onEditClick: (nutraceutical: Nutraceutical) => void;
  onConditionClick: (nutraceutical: Nutraceutical, condition: any, conditionType: 'prevention' | 'treatment' | 'support') => void;
}

const NutraceuticosExpandableTable = ({
  nutraceuticals,
  onEditClick,
  onConditionClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEfficacyBadgeColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  console.log('📊 [TABLE] Total de nutracêuticos:', nutraceuticals.length);

  return (
    <div className="w-full">
      {/* Container com scroll horizontal controlado apenas para a tabela */}
      <div className="w-full overflow-x-auto border rounded-md bg-white">
        <div className="min-w-[800px]"> {/* Largura mínima para garantir que a tabela não fique muito comprimida */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                <TableHead className="w-[200px] min-w-[150px]">Nome</TableHead>
                <TableHead className="w-[250px] min-w-[200px]">Prevenção</TableHead>
                <TableHead className="w-[250px] min-w-[200px]">Tratamento</TableHead>
                <TableHead className="w-[250px] min-w-[200px]">Suporte</TableHead>
                <TableHead className="w-[80px] min-w-[80px] text-center">Eficácia</TableHead>
                <TableHead className="w-[90px] min-w-[90px] text-center">Sustentação</TableHead>
                <TableHead className="w-[80px] min-w-[80px] text-center">Estudos</TableHead>
                <TableHead className="w-[100px] min-w-[100px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nutraceuticals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum nutracêutico encontrado
                  </TableCell>
                </TableRow>
              ) : (
                nutraceuticals.map((nutraceutical) => {
                  console.log(`📊 [TABLE] Renderizando ${nutraceutical.name}:`, {
                    preventionConditions: nutraceutical.preventionConditions?.length || 0,
                    treatmentConditions: nutraceutical.treatmentConditions?.length || 0,
                    supportConditions: nutraceutical.supportConditions?.length || 0,
                  });

                  return (
                    <React.Fragment key={nutraceutical.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="w-[50px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(nutraceutical.id)}
                            className="p-1 h-8 w-8"
                          >
                            {expandedRows.has(nutraceutical.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="truncate" title={nutraceutical.name}>
                            {nutraceutical.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[230px]">
                            <HealthConditionTags 
                              conditions={nutraceutical.preventionConditions || []}
                              onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'prevention')}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[230px]">
                            <HealthConditionTags 
                              conditions={nutraceutical.treatmentConditions || []}
                              onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'treatment')}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[230px]">
                            <HealthConditionTags 
                              conditions={nutraceutical.supportConditions || []}
                              onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'support')}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={getEfficacyBadgeColor(nutraceutical.scientificEvidence?.efficacyScore || 0)}
                          >
                            {(nutraceutical.scientificEvidence?.efficacyScore || 0).toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={getEfficacyBadgeColor(nutraceutical.scientificEvidence?.sustainabilityScore || 0)}
                          >
                            {(nutraceutical.scientificEvidence?.sustainabilityScore || 0).toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {nutraceutical.studyCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditClick(nutraceutical)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {expandedRows.has(nutraceutical.id) && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={9}>
                            <div className="p-4 space-y-4 max-w-full">
                              <div>
                                <h4 className="font-medium mb-2">Descrição:</h4>
                                <p className="text-sm text-muted-foreground break-words">
                                  {nutraceutical.description || 'Sem descrição disponível'}
                                </p>
                              </div>
                              
                              {nutraceutical.chemicalCompound && (
                                <div>
                                  <h4 className="font-medium mb-2">Composto Químico:</h4>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {nutraceutical.chemicalCompound}
                                  </p>
                                </div>
                              )}
                              
                              {nutraceutical.dosage && (
                                <div>
                                  <h4 className="font-medium mb-2">Dosagem:</h4>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {nutraceutical.dosage}
                                  </p>
                                </div>
                              )}
                              
                              {nutraceutical.contraindications && nutraceutical.contraindications.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Contraindicações:</h4>
                                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                                    {nutraceutical.contraindications.map((contraindication, index) => (
                                      <li key={index} className="break-words">{contraindication}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default NutraceuticosExpandableTable;
