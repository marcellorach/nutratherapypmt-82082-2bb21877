
import React from 'react';

const VisualizationLegend: React.FC = () => {
  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="text-sm font-medium mb-2">Legenda</h4>
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></div>
          <span>Nutracêuticos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1 rounded-sm"></div>
          <span>Condições de Saúde</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 mr-1 rounded-sm"></div>
          <span>Efeitos</span>
        </div>
        <div className="flex items-center ml-4">
          <span className="font-medium">Largura da conexão:</span>
          <span className="ml-1">Grau de eficácia/evidência</span>
        </div>
      </div>
    </div>
  );
};

export default VisualizationLegend;
