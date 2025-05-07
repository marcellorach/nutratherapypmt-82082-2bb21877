
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ConditionRelation {
  id: string;
  relationship_type?: string;
  efficacy_score?: number | null;
  condition?: {
    name: string;
  };
}

interface ConditionsTableProps {
  conditions: ConditionRelation[];
}

const ConditionsTable: React.FC<ConditionsTableProps> = ({ conditions }) => {
  // Função auxiliar para formatar o tipo de relação
  const formatRelationshipType = (type: string) => {
    switch (type) {
      case 'prevention': return 'Prevenção';
      case 'treatment': return 'Tratamento';
      case 'support': return 'Suporte';
      default: return type;
    }
  };

  if (!Array.isArray(conditions) || conditions.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma condição associada</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-1">Condição</th>
          <th className="text-left py-1">Relação</th>
          <th className="text-left py-1">Eficácia</th>
        </tr>
      </thead>
      <tbody>
        {conditions.map((relation: ConditionRelation) => (
          <tr key={relation.id} className="border-b border-gray-100">
            <td className="py-1">{relation.condition?.name || "Desconhecida"}</td>
            <td className="py-1">{formatRelationshipType(relation.relationship_type || "")}</td>
            <td className="py-1">
              <Badge variant="outline" className={`
                ${Number(relation.efficacy_score) >= 4 ? 'bg-green-50 text-green-800' : 
                  Number(relation.efficacy_score) >= 3 ? 'bg-blue-50 text-blue-800' : 
                  Number(relation.efficacy_score) >= 2 ? 'bg-yellow-50 text-yellow-800' : 
                  'bg-red-50 text-red-800'}
              `}>
                {relation.efficacy_score || 0}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ConditionsTable;
