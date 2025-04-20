
import React from 'react';

const EvidenceLegend: React.FC = () => {
  return (
    <div className="flex flex-col space-y-2">
      <span className="font-medium">Nível de Sustentação:</span>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-200"></div>
          <span>Sem evidência (0/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-200"></div>
          <span>Anedótica (1/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-200"></div>
          <span>Leve (2/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-200"></div>
          <span>Moderada (3/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-200"></div>
          <span>Alta (4-5/5)</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceLegend;
