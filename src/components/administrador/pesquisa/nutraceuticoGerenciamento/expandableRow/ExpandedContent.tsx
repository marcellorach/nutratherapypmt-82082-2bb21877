
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TableRow, TableCell } from '@/components/ui/table';
import NutraceuticalDetails from './NutraceuticalDetails';
import ConditionsTable from './ConditionsTable';
import StudiesTable from './StudiesTable';

interface ExpandedContentProps {
  nutraceutical: any;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({ nutraceutical }) => {
  const { t, ready } = useTranslation();
  
  // FALLBACK: Se i18n não está pronto ou retorna chave literal
  const getText = (key: string, fallback: string): string => {
    if (!ready) return fallback;
    const translation = t(key);
    return translation === key ? fallback : translation;
  };
  
  if (!nutraceutical) return null;
  
  return (
    <TableRow className="bg-gray-50">
      <TableCell colSpan={5} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Detalhes do Nutracêutico */}
          <NutraceuticalDetails 
            description={nutraceutical.description}
            chemical_compound={nutraceutical.chemical_compound}
            source={nutraceutical.source}
            dosage={nutraceutical.dosage}
          />

          {/* Condições relacionadas */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <h4 className="font-medium text-sm">{getText('nutraceuticals.conditions.title', 'Conditions')} ({nutraceutical.conditionCount || 0})</h4>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <ConditionsTable 
                conditions={Array.isArray(nutraceutical.nutraceutical_conditions) ? nutraceutical.nutraceutical_conditions : []} 
              />
            </div>
          </div>
        </div>

        {/* Estudos Científicos */}
        <div className="mt-4">
          <div className="flex justify-between">
            <h4 className="font-medium text-sm">{getText('nutraceuticals.studies.title', 'Scientific Studies')} ({nutraceutical.studyCount || 0})</h4>
          </div>
          <div className="max-h-48 overflow-y-auto mt-2">
            <StudiesTable 
              studies={Array.isArray(nutraceutical.nutraceutical_studies) ? nutraceutical.nutraceutical_studies : []} 
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ExpandedContent;
