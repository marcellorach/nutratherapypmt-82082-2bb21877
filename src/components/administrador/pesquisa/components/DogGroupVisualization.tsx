
import React from 'react';
import { PawPrint } from 'lucide-react';

interface DogGroupVisualizationProps {
  count: number;
  type: 'treatment' | 'control';
  groupLabel?: string;
  // Adicionando propriedades alternativas para compatibilidade
  treatmentCount?: number;
  controlCount?: number;
}

const DogGroupVisualization: React.FC<DogGroupVisualizationProps> = ({ 
  count, 
  type, 
  groupLabel,
  treatmentCount,
  controlCount 
}) => {
  const iconColor = type === 'treatment' ? 'text-blue-600' : 'text-gray-600';
  const bgColor = type === 'treatment' ? 'bg-blue-50' : 'bg-gray-50';
  const groupName = groupLabel || (type === 'treatment' ? 'Grupo de Tratamento' : 'Grupo de Controle');
  
  // Se o componente for chamado com treatmentCount e controlCount, renderiza os dois grupos
  if (treatmentCount !== undefined && controlCount !== undefined) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="mb-2 text-sm font-medium flex justify-between">
            <span>Grupo de Tratamento</span>
            <span className="font-semibold">{treatmentCount} cães</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(treatmentCount, 20) }).map((_, i) => (
              <PawPrint 
                key={i} 
                className={`h-4 w-4 text-blue-600 ${i >= 20 ? 'opacity-50' : ''}`} 
              />
            ))}
            
            {treatmentCount > 20 && (
              <span className="text-xs text-gray-500 ml-1 mt-0.5">+{treatmentCount - 20}</span>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="mb-2 text-sm font-medium flex justify-between">
            <span>Grupo de Controle</span>
            <span className="font-semibold">{controlCount} cães</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(controlCount, 20) }).map((_, i) => (
              <PawPrint 
                key={i} 
                className={`h-4 w-4 text-gray-600 ${i >= 20 ? 'opacity-50' : ''}`} 
              />
            ))}
            
            {controlCount > 20 && (
              <span className="text-xs text-gray-500 ml-1 mt-0.5">+{controlCount - 20}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Caso contrário, renderiza apenas um grupo conforme a chamada original
  return (
    <div className={`${bgColor} p-3 rounded-lg`}>
      <div className="mb-2 text-sm font-medium flex justify-between">
        <span>{groupName}</span>
        <span className="font-semibold">{count} cães</span>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
          <PawPrint 
            key={i} 
            className={`h-4 w-4 ${iconColor} ${i >= 20 ? 'opacity-50' : ''}`} 
          />
        ))}
        
        {count > 20 && (
          <span className="text-xs text-gray-500 ml-1 mt-0.5">+{count - 20}</span>
        )}
      </div>
    </div>
  );
};

export default DogGroupVisualization;
