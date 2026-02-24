
import React from 'react';
import { useTranslation } from 'react-i18next';
import SuccessRateCard from './SuccessRateCard';
import ResponseTimeCard from './ResponseTimeCard';

interface SuccessRatesData {
  estudos: {
    eficaz: number;
    baixaEficacia: number;
    ineficaz: number;
  };
  petlove: {
    eficaz: number;
    baixaEficacia: number;
    ineficaz: number;
  };
  tempoMedio: number;
}

interface SuccessRateCardsProps {
  successRates: SuccessRatesData;
}

const SuccessRateCards: React.FC<SuccessRateCardsProps> = ({ successRates }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-3">
      <SuccessRateCard 
        title={t('recommendations.successRate.studies')}
        efficacyRate={successRates.estudos.eficaz}
        rates={successRates.estudos}
      />
      <SuccessRateCard 
        title={t('recommendations.successRate.petlove')}
        efficacyRate={successRates.petlove.eficaz}
        rates={successRates.petlove}
      />
      <ResponseTimeCard 
        tempoMedio={successRates.tempoMedio}
        tempoMedioPopulacao={Math.round(successRates.tempoMedio * 1.5)}
      />
    </div>
  );
};

export default SuccessRateCards;
