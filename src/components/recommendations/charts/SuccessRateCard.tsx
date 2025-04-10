
import React from 'react';
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
  return (
    <div className="bg-slate-50 p-3 rounded-md">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold text-green-600">{efficacyRate}%</p>
      <div className="space-y-1 mt-1">
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <TrendingUp size={14} className="text-green-600 mr-1" /> Eficaz:
          </span>
          <span className="font-medium text-green-600">{rates.eficaz}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <Minus size={14} className="text-amber-600 mr-1" /> Baixa eficácia:
          </span>
          <span className="font-medium text-amber-600">{rates.baixaEficacia}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <TrendingDown size={14} className="text-red-600 mr-1" /> Ineficaz:
          </span>
          <span className="font-medium text-red-600">{rates.ineficaz}%</span>
        </div>
      </div>
    </div>
  );
};

export default SuccessRateCard;
