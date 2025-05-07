
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2, Link } from 'lucide-react';

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
  // Função auxiliar para formatar o tipo de relação
  const formatRelationshipType = (type: string) => {
    switch (type) {
      case 'prevention': return 'Prevenção';
      case 'treatment': return 'Tratamento';
      case 'support': return 'Suporte';
      default: return type;
    }
  };

  // Helper para obter o nome do outcome
  const getOutcomeName = () => {
    if (nutraceutical.outcome && nutraceutical.outcome[0]) {
      return nutraceutical.outcome[0].name;
    }
    return "Não definido";
  };

  // Estado expandido para mostrar detalhes
  const renderExpandedContent = () => (
    <TableRow className="bg-gray-50">
      <TableCell colSpan={5} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Detalhes do Nutracêutico */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Detalhes</h4>
            <div className="text-sm">
              <p><span className="font-medium">Descrição:</span> {nutraceutical.description || "Não definida"}</p>
              <p><span className="font-medium">Composto Químico:</span> {nutraceutical.chemical_compound || "Não definido"}</p>
              <p><span className="font-medium">Origem:</span> {nutraceutical.source || "Não definida"}</p>
              <p><span className="font-medium">Dosagem:</span> {nutraceutical.dosage || "Não definida"}</p>
            </div>
          </div>

          {/* Condições relacionadas */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <h4 className="font-medium text-sm">Condições ({nutraceutical.nutraceutical_conditions?.length || 0})</h4>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {nutraceutical.nutraceutical_conditions && nutraceutical.nutraceutical_conditions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Condição</th>
                      <th className="text-left py-1">Relação</th>
                      <th className="text-left py-1">Eficácia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nutraceutical.nutraceutical_conditions.map((relation: any) => (
                      <tr key={relation.id} className="border-b border-gray-100">
                        <td className="py-1">{relation.condition?.name || "Desconhecida"}</td>
                        <td className="py-1">{formatRelationshipType(relation.relationship_type)}</td>
                        <td className="py-1">
                          <Badge variant="outline" className={`
                            ${relation.efficacy_score >= 4 ? 'bg-green-50 text-green-800' : 
                              relation.efficacy_score >= 3 ? 'bg-blue-50 text-blue-800' : 
                              relation.efficacy_score >= 2 ? 'bg-yellow-50 text-yellow-800' : 
                              'bg-red-50 text-red-800'}
                          `}>
                            {relation.efficacy_score || 0}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma condição associada</p>
              )}
            </div>
          </div>
        </div>

        {/* Estudos Científicos */}
        <div className="mt-4">
          <div className="flex justify-between">
            <h4 className="font-medium text-sm">Estudos ({nutraceutical.nutraceutical_studies?.length || 0})</h4>
          </div>
          <div className="max-h-48 overflow-y-auto mt-2">
            {nutraceutical.nutraceutical_studies && nutraceutical.nutraceutical_studies.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Título</th>
                    <th className="text-left py-1">Journal</th>
                    <th className="text-left py-1">Relevância</th>
                  </tr>
                </thead>
                <tbody>
                  {nutraceutical.nutraceutical_studies.map((relation: any) => (
                    <tr key={relation.id} className="border-b border-gray-100">
                      <td className="py-1">{relation.study?.title || "Desconhecido"}</td>
                      <td className="py-1">{relation.study?.journal || "N/A"}</td>
                      <td className="py-1">
                        <Badge variant="outline" className={`
                          ${relation.relevance_score >= 4 ? 'bg-green-50 text-green-800' : 
                            relation.relevance_score >= 3 ? 'bg-blue-50 text-blue-800' : 
                            relation.relevance_score >= 2 ? 'bg-yellow-50 text-yellow-800' : 
                            'bg-red-50 text-red-800'}
                        `}>
                          {relation.relevance_score || 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">Nenhum estudo associado</p>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {/* Linha principal */}
      <TableRow className="hover:bg-muted/40">
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <span>{nutraceutical.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {getOutcomeName()}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-blue-50">
            {nutraceutical.conditionCount || nutraceutical.nutraceutical_conditions?.length || 0}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-green-50">
            {nutraceutical.studyCount || nutraceutical.nutraceutical_studies?.length || 0}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-1">
            {onEditClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditClick(nutraceutical)}
                title="Editar nutracêutico"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onManageRelationships && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onManageRelationships(nutraceutical)}
                title="Gerenciar relações"
              >
                <Link className="h-4 w-4" />
              </Button>
            )}
            {onDeleteClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteClick(nutraceutical.id)}
                title="Excluir nutracêutico"
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      
      {/* Conteúdo expandido */}
      {isExpanded && renderExpandedContent()}
    </>
  );
};

export default NutraceuticalExpandableRow;
