
import React from 'react';

interface StatisticsHeaderProps {
  totalCases: number;
}

const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({ totalCases }) => {
  return (
    <div>
      <h3 className="text-base font-medium mb-2">Estatísticas relevantes em relação aos pacientes segurados</h3>
      <p className="text-xs text-gray-500 mb-2">Baseado em {totalCases.toLocaleString()} casos analisados</p>
    </div>
  );
};

export default StatisticsHeader;
