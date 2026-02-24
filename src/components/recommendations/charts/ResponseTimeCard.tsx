
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ResponseTimeCardProps {
  tempoMedio: number;
  tempoMedioPopulacao: number;
}

const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({ tempoMedio, tempoMedioPopulacao }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-muted/50 p-3 rounded-md">
      <p className="text-xs text-muted-foreground">{t('recommendations.successRate.avgResponseTime')}</p>
      <p className="text-xl font-bold">{tempoMedio} {t('recommendations.successRate.days')}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>{t('recommendations.successRate.initialReaction')}</span>
          <span>{t('recommendations.successRate.fullResponse')}</span>
        </div>
        <div className="progress-bar bg-muted h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full" 
            style={{ width: `${Math.min(100, 100 - tempoMedio * 2)}%` }}
          ></div>
        </div>
        <p className="text-xs text-center mt-2 text-muted-foreground">
          {t('recommendations.successRate.populationAvg', { days: tempoMedioPopulacao })}
        </p>
      </div>
    </div>
  );
};

export default ResponseTimeCard;
