
import React from 'react';

interface SankeyTooltipProps {
  payload: any[];
}

const SankeyTooltip: React.FC<SankeyTooltipProps> = ({ payload }) => {
  if (!payload || !payload.length) return null;
  
  const item = payload[0];
  if (!item || !item.payload) return null;

  const source = item.payload.sourceNode;
  const target = item.payload.targetNode;
  const value = item.payload.value;
  
  if (!source || !target) return null;

  return (
    <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-600">{source.name}</span>
          <span className="mx-2">→</span>
          <span className="font-medium text-green-600">{target.name}</span>
        </div>
        <div className="text-sm">
          <p className="text-gray-600">Eficácia: <span className="font-medium">{value}/100</span></p>
          {item.payload.labelText && (
            <p className="text-gray-600">{item.payload.labelText}</p>
          )}
        </div>
        {item.payload.description && (
          <p className="text-xs text-gray-500 mt-1">{item.payload.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">Clique para mais detalhes</p>
      </div>
    </div>
  );
};

export default SankeyTooltip;
