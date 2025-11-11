
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, ready } = useTranslation();
  
  // FALLBACK: Se i18n não está pronto ou retorna chave literal
  const getText = (key: string, fallback: string): string => {
    if (!ready) return fallback;
    const translation = t(key);
    return translation === key ? fallback : translation;
  };
  
  // Função auxiliar para formatar o tipo de relação
  const formatRelationshipType = (type: string) => {
    const types: Record<string, string> = {
      'prevention': getText('nutraceuticals.conditions.types.prevention', 'Prevenção'),
      'treatment': getText('nutraceuticals.conditions.types.treatment', 'Tratamento'),
      'support': getText('nutraceuticals.conditions.types.support', 'Suporte')
    };
    return types[type] || type;
  };

  if (!Array.isArray(conditions) || conditions.length === 0) {
    return <p className="text-sm text-gray-500">{getText('nutraceuticals.conditions.none', 'Nenhuma condição associada')}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-1">{getText('nutraceuticals.conditions.table.name', 'Condição')}</th>
          <th className="text-left py-1">{getText('nutraceuticals.conditions.table.type', 'Tipo')}</th>
          <th className="text-left py-1">{getText('nutraceuticals.conditions.table.efficacy', 'Eficácia')}</th>
        </tr>
      </thead>
      <tbody>
        {conditions.map((relation: ConditionRelation) => (
          <tr key={relation.id} className="border-b border-gray-100">
            <td className="py-1">{relation.condition?.name || getText('nutraceuticals.conditions.unknown', 'Condição desconhecida')}</td>
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
