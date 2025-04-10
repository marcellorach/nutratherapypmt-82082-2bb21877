
import React from 'react';

interface ResponseTimeCardProps {
  tempoMedio: number;
  tempoMedioPopulacao: number;
}

const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({ tempoMedio, tempoMedioPopulacao }) => {
  return (
    <div className="bg-slate-50 p-3 rounded-md">
      <p className="text-xs text-gray-500">Tempo médio até resposta</p>
      <p className="text-xl font-bold">{tempoMedio} dias</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Reação inicial</span>
          <span>Resposta completa</span>
        </div>
        <div className="progress-bar bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full" 
            style={{ width: `${Math.min(100, 100 - tempoMedio * 2)}%` }}
          ></div>
        </div>
        <p className="text-xs text-center mt-2 text-gray-600">
          Média da população: {tempoMedioPopulacao} dias
        </p>
      </div>
    </div>
  );
};

export default ResponseTimeCard;
