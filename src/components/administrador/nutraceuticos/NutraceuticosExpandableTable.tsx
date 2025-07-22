
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Prevenção</TableHead>
            <TableHead>Tratamento</TableHead>
            <TableHead>Suporte</TableHead>
            <TableHead>Eficácia</TableHead>
            <TableHead>Sustentação</TableHead>
            <TableHead>Estudos</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(nutraceutical.id)}
                        className="p-1"
                      >
                        {expandedRows.has(nutraceutical.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {nutraceutical.name}
                    </TableCell>
                    <TableCell>
                      <HealthConditionTags 
                        conditions={nutraceutical.preventionConditions || []}
                        onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'prevention')}
                      />
                    </TableCell>
                    <TableCell>
                      <HealthConditionTags 
                        conditions={nutraceutical.treatmentConditions || []}
                        onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'treatment')}
                      />
                    </TableCell>
                    <TableCell>
                      <HealthConditionTags 
                        conditions={nutraceutical.supportConditions || []}
                        onConditionClick={(condition) => onConditionClick(nutraceutical, condition, 'support')}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={getEfficacyBadgeColor(nutraceutical.scientificEvidence?.efficacyScore || 0)}
                      >
                        {(nutraceutical.scientificEvidence?.efficacyScore || 0).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={getEfficacyBadgeColor(nutraceutical.scientificEvidence?.sustainabilityScore || 0)}
                      >
                        {(nutraceutical.scientificEvidence?.sustainabilityScore || 0).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {nutraceutical.studyCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(nutraceutical)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedRows.has(nutraceutical.id) && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={9}>
                        <div className="p-4 space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Descrição:</h4>
                            <p className="text-sm text-muted-foreground">
                              {nutraceutical.description || 'Sem descrição disponível'}
                            </p>
                          </div>
                          
                          {nutraceutical.chemicalCompound && (
                            <div>
                              <h4 className="font-medium mb-2">Composto Químico:</h4>
                              <p className="text-sm text-muted-foreground">
                                {nutraceutical.chemicalCompound}
                              </p>
                            </div>
                          )}
                          
                          {nutraceutical.dosage && (
                            <div>
                              <h4 className="font-medium mb-2">Dosagem:</h4>
                              <p className="text-sm text-muted-foreground">
                                {nutraceutical.dosage}
                              </p>
                            </div>
                          )}
                          
                          {nutraceutical.contraindications && nutraceutical.contraindications.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Contraindicações:</h4>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {nutraceutical.contraindications.map((contraindication, index) => (
                                  <li key={index}>{contraindication}</li>
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
  );
};

export default NutraceuticosExpandableTable;
