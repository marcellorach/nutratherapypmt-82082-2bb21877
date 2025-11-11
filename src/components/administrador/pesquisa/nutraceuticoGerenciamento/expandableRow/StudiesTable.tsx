
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface StudyRelation {
  id: string;
  relevance_score?: number | null;
  study?: {
    id?: string;
    title?: string;
    title_en?: string;
    journal?: string;
    journal_en?: string;
    doi?: string;
    link?: string;
    year?: number;
    authors?: string[];
  };
}

interface StudiesTableProps {
  studies: StudyRelation[];
}

const StudiesTable: React.FC<StudiesTableProps> = ({ studies }) => {
  const { t, i18n } = useTranslation();
  
  if (!Array.isArray(studies) || studies.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('nutraceuticals.studies.none')}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 font-semibold">{t('nutraceuticals.studies.table.title')}</th>
          <th className="text-left py-2 font-semibold">{t('nutraceuticals.studies.table.journal')}</th>
          <th className="text-left py-2 font-semibold">{t('nutraceuticals.studies.table.relevance')}</th>
        </tr>
      </thead>
      <tbody>
        {studies.map((relation: StudyRelation) => {
          const study = relation.study;
          
          // Lógica i18n para título e journal
          const title = i18n.language === 'pt' 
            ? (study?.title || study?.title_en) 
            : (study?.title_en || study?.title);
            
          const journal = i18n.language === 'pt'
            ? (study?.journal || study?.journal_en)
            : (study?.journal_en || study?.journal);
          
          return (
            <tr key={relation.id} className="border-b border-border/50">
              <td className="py-2">
                {study?.doi ? (
                  <a 
                    href={`https://doi.org/${study.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 group"
                    title={t('nutraceuticals.studies.viewFull')}
                  >
                    <span>{title || t('nutraceuticals.studies.unknown')}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <span className="text-foreground">{title || t('nutraceuticals.studies.unknown')}</span>
                )}
                {study?.year && (
                  <span className="text-muted-foreground text-xs ml-2">({study.year})</span>
                )}
              </td>
              <td className="py-2">
                <span className="text-sm text-foreground">{journal || "N/A"}</span>
              </td>
              <td className="py-2">
                <Badge variant="outline" className={`
                  ${Number(relation.relevance_score) >= 4 ? 'bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800' : 
                    Number(relation.relevance_score) >= 3 ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800' : 
                    Number(relation.relevance_score) >= 2 ? 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800' : 
                    'bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800'}
                `}>
                  {relation.relevance_score || 0}
                </Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default StudiesTable;
