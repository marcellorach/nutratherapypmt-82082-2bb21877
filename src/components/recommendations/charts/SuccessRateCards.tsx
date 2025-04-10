
import React from 'react';
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
  return (
    <div className="grid grid-cols-3 gap-3">
      <SuccessRateCard 
        title="Taxa de sucesso - Estudos" 
        efficacyRate={successRates.estudos.eficaz}
        rates={successRates.estudos}
      />
      <SuccessRateCard 
        title="Taxa de sucesso - PetLove" 
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
