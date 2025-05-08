
import React from 'react';
import { Paw } from 'lucide-react';

interface DogGroupVisualizationProps {
  treatmentCount: number;
  controlCount: number;
  treatmentIcon?: React.ReactNode;
  controlIcon?: React.ReactNode;
  maxIconsToShow?: number;
}

const DogGroupVisualization: React.FC<DogGroupVisualizationProps> = ({
  treatmentCount,
  controlCount,
  treatmentIcon = <Paw className="h-4 w-4 text-blue-500" />,
  controlIcon = <Paw className="h-4 w-4 text-gray-500" />,
  maxIconsToShow = 10
}) => {
  // Determinar quantos ícones mostrar para cada grupo
  const treatmentIconsToShow = Math.min(treatmentCount, maxIconsToShow);
  const controlIconsToShow = Math.min(controlCount, maxIconsToShow);
  
  // Se temos mais cães do que o máximo de ícones, exibir contador extra
  const treatmentExtraCount = treatmentCount > maxIconsToShow ? treatmentCount - maxIconsToShow : 0;
  const controlExtraCount = controlCount > maxIconsToShow ? controlCount - maxIconsToShow : 0;
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">Grupo Tratamento</span>
          <span className="text-sm font-semibold">{treatmentCount} cães</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: treatmentIconsToShow }).map((_, index) => (
            <div key={`treatment-${index}`} className="animate-pulse">
              {treatmentIcon}
            </div>
          ))}
          {treatmentExtraCount > 0 && (
            <span className="text-xs text-blue-500">+{treatmentExtraCount}</span>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Grupo Controle</span>
          <span className="text-sm font-semibold">{controlCount} cães</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: controlIconsToShow }).map((_, index) => (
            <div key={`control-${index}`}>
              {controlIcon}
            </div>
          ))}
          {controlExtraCount > 0 && (
            <span className="text-xs text-gray-500">+{controlExtraCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DogGroupVisualization;
