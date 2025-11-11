
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface StudyRelation {
  id: string;
  relevance_score?: number | null;
  study?: {
    title?: string;
    journal?: string;
  };
}

interface StudiesTableProps {
  studies: StudyRelation[];
}

const StudiesTable: React.FC<StudiesTableProps> = ({ studies }) => {
  const { t } = useTranslation();
  
  if (!Array.isArray(studies) || studies.length === 0) {
    return <p className="text-sm text-gray-500">{t('nutraceuticals.studies.none')}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-1">{t('nutraceuticals.studies.table.title')}</th>
          <th className="text-left py-1">{t('nutraceuticals.studies.table.journal')}</th>
          <th className="text-left py-1">{t('nutraceuticals.studies.table.relevance')}</th>
        </tr>
      </thead>
      <tbody>
        {studies.map((relation: StudyRelation) => (
          <tr key={relation.id} className="border-b border-gray-100">
            <td className="py-1">{relation.study?.title || "Desconhecido"}</td>
            <td className="py-1">{relation.study?.journal || "N/A"}</td>
            <td className="py-1">
              <Badge variant="outline" className={`
                ${Number(relation.relevance_score) >= 4 ? 'bg-green-50 text-green-800' : 
                  Number(relation.relevance_score) >= 3 ? 'bg-blue-50 text-blue-800' : 
                  Number(relation.relevance_score) >= 2 ? 'bg-yellow-50 text-yellow-800' : 
                  'bg-red-50 text-red-800'}
              `}>
                {relation.relevance_score || 0}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StudiesTable;
