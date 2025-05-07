
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NutraceuticalExpandableRowProps {
  nutraceutical: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditClick?: (nutraceutical: any) => void;
  onDeleteClick?: (id: string) => void;
  onManageRelationships?: (nutraceutical: any) => void;
}

const NutraceuticalExpandableRow: React.FC<NutraceuticalExpandableRowProps> = ({
  nutraceutical,
  isExpanded,
  onToggleExpand,
  onEditClick,
  onDeleteClick,
  onManageRelationships
}) => {
  // Função para obter a cor de um badge de eficácia
  const getEfficacyBadgeColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Função para obter a cor de um badge de tipo de relacionamento
  const getRelationshipBadgeColor = (type: string) => {
    switch (type) {
      case 'prevention':
        return "bg-blue-100 text-blue-800";
      case 'treatment':
        return "bg-green-100 text-green-800";
      case 'support':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Conta outcomes e estudos relacionados
  const countOutcomes = nutraceutical.nutraceutical_conditions?.length || 0;
  const countStudies = nutraceutical.nutraceutical_studies?.length || 0;

  // Agrupa outcomes por tipo de relacionamento
  const groupedOutcomes = (nutraceutical.nutraceutical_conditions || []).reduce((acc: any, relation: any) => {
    const type = relation.relationship_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(relation);
    return acc;
  }, {});

  return (
    <>
      <TableRow 
        key={nutraceutical.id} 
        className="cursor-pointer hover:bg-slate-50"
        onClick={onToggleExpand}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {nutraceutical.name}
          </div>
        </TableCell>
        <TableCell>
          {nutraceutical.outcome?.name ? (
            <Badge variant="outline">{nutraceutical.outcome.name}</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sem outcome</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-blue-50">
            {countOutcomes}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-green-50">
            {countStudies}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            {onEditClick && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(nutraceutical);
                }}
                title="Editar nutracêutico"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </Button>
            )}
            {onManageRelationships && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageRelationships(nutraceutical);
                }}
                title="Gerenciar estudos e outcomes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </Button>
            )}
            {onDeleteClick && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(nutraceutical.id);
                }}
                title="Excluir nutracêutico"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50">
          <TableCell colSpan={5} className="p-4">
            <div className="space-y-4">
              {/* Informações do nutracêutico */}
              <div>
                <h4 className="text-sm font-medium mb-1">Informações:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {nutraceutical.description && (
                    <div>
                      <span className="font-medium">Descrição:</span> {nutraceutical.description}
                    </div>
                  )}
                  {nutraceutical.source && (
                    <div>
                      <span className="font-medium">Fonte:</span> {nutraceutical.source}
                    </div>
                  )}
                  {nutraceutical.chemical_compound && (
                    <div>
                      <span className="font-medium">Composto químico:</span> {nutraceutical.chemical_compound}
                    </div>
                  )}
                  {nutraceutical.dosage && (
                    <div>
                      <span className="font-medium">Dosagem:</span> {nutraceutical.dosage}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Outcomes relacionados */}
              {countOutcomes > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Outcomes relacionados:</h4>
                    <div className="space-y-3">
                      {Object.entries(groupedOutcomes).map(([type, relations]: [string, any]) => (
                        <div key={type} className="space-y-2">
                          <h5 className="text-xs font-medium capitalize">{type === 'prevention' 
                            ? 'Prevenção' 
                            : type === 'treatment' 
                              ? 'Tratamento' 
                              : type === 'support' 
                                ? 'Suporte' 
                                : type}</h5>
                          <div className="space-y-2">
                            {relations.map((relation: any) => (
                              <div key={relation.id} className="bg-white p-2 rounded-md border text-sm">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{relation.condition?.name || 'Condição não especificada'}</div>
                                  <div className="flex gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={getRelationshipBadgeColor(relation.relationship_type)}
                                    >
                                      {relation.relationship_type}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={getEfficacyBadgeColor(relation.efficacy_score)}
                                    >
                                      Eficácia: {relation.efficacy_score}
                                    </Badge>
                                  </div>
                                </div>
                                {relation.notes && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    <span className="font-medium">Notas:</span> {relation.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Estudos científicos relacionados */}
              {countStudies > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Estudos científicos relacionados:</h4>
                    <div className="space-y-2">
                      {nutraceutical.nutraceutical_studies.map((relation: any) => (
                        <div key={relation.id} className="bg-white p-2 rounded-md border text-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{relation.study?.title || 'Estudo sem título'}</div>
                            <Badge 
                              variant="outline" 
                              className="bg-blue-50 text-blue-800"
                            >
                              Relevância: {relation.relevance_score}
                            </Badge>
                          </div>
                          {relation.study?.journal && (
                            <div className="mt-1 text-xs text-gray-600">
                              <span className="font-medium">Publicado em:</span> {relation.study.journal}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default NutraceuticalExpandableRow;
