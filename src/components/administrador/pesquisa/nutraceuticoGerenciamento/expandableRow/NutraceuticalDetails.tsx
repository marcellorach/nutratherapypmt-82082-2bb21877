
import React from 'react';
import { useTranslation } from 'react-i18next';

interface NutraceuticalDetailsProps {
  description?: string;
  chemical_compound?: string;
  source?: string;
  dosage?: string;
}

const NutraceuticalDetails: React.FC<NutraceuticalDetailsProps> = ({
  description,
  chemical_compound,
  source,
  dosage
}) => {
  const { t, ready } = useTranslation();
  
  // FALLBACK: Se i18n não está pronto ou retorna chave literal
  const getText = (key: string, fallback: string): string => {
    if (!ready) return fallback;
    const translation = t(key);
    // Se retornou a própria chave, usar fallback
    return translation === key ? fallback : translation;
  };
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{getText('nutraceuticals.details.title', 'Detalhes')}</h4>
      <div className="text-sm">
        <p><span className="font-medium">{getText('nutraceuticals.details.description', 'Descrição')}:</span> {description || getText('nutraceuticals.details.notDefined', 'Não definida')}</p>
        <p><span className="font-medium">{getText('nutraceuticals.details.compound', 'Composto Químico')}:</span> {chemical_compound || getText('nutraceuticals.details.notDefined', 'Não definida')}</p>
        <p><span className="font-medium">{getText('nutraceuticals.details.source', 'Origem')}:</span> {source || getText('nutraceuticals.details.notDefined', 'Não definida')}</p>
        <p><span className="font-medium">{getText('nutraceuticals.details.dosage', 'Dosagem')}:</span> {dosage || getText('nutraceuticals.details.notDefined', 'Não definida')}</p>
      </div>
    </div>
  );
};

export default NutraceuticalDetails;
