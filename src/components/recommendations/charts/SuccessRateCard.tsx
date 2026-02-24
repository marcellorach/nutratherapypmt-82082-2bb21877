
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SuccessRateProps {
  title: string;
  efficacyRate: number;
  rates: {
    eficaz: number;
    baixaEficacia: number;
    ineficaz: number;
  };
}

const SuccessRateCard: React.FC<SuccessRateProps> = ({ title, efficacyRate, rates }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-muted/50 p-3 rounded-md">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-bold text-green-600">{efficacyRate}%</p>
      <div className="space-y-1 mt-1">
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <TrendingUp size={14} className="text-green-600 mr-1" /> {t('recommendations.successRate.efficacious')}:
          </span>
          <span className="font-medium text-green-600">{rates.eficaz}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <Minus size={14} className="text-amber-600 mr-1" /> {t('recommendations.successRate.lowEfficacy')}:
          </span>
          <span className="font-medium text-amber-600">{rates.baixaEficacia}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <TrendingDown size={14} className="text-destructive mr-1" /> {t('recommendations.successRate.inefficacious')}:
          </span>
          <span className="font-medium text-destructive">{rates.ineficaz}%</span>
        </div>
      </div>
    </div>
  );
};

export default SuccessRateCard;
