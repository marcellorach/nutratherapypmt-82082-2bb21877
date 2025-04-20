
import React from 'react';

const EvidenceLegend: React.FC = () => {
  return (
    <div className="flex items-center gap-4 text-sm mb-4 ml-4">
      <span className="font-medium">Nível de Evidência:</span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-200"></div>
          <span>Sem evidência</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-200"></div>
          <span>Anedótica</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-200"></div>
          <span>Moderada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-200"></div>
          <span>Alta</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceLegend;
