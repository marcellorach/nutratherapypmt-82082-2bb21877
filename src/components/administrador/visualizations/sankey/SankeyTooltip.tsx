
import React from 'react';

interface SankeyTooltipProps {
  active?: boolean;
  payload?: any[];
}

const SankeyTooltip: React.FC<SankeyTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const efficacyScore = data.value / 20; // Convertendo de volta para escala 0-5
    
    let relationshipType = '';
    switch (data.relationshipType) {
      case 'prevention':
        relationshipType = 'Prevenção';
        break;
      case 'treatment':
        relationshipType = 'Tratamento';
        break;
      case 'support':
        relationshipType = 'Suporte';
        break;
      default:
        relationshipType = 'Outro';
    }

    return (
      <div className="bg-white p-3 border rounded shadow-md min-w-[200px]">
        <div className="font-medium text-base mb-1">{data.sourceName} → {data.targetName}</div>
        <div className="text-sm text-gray-600 mb-2">{relationshipType}</div>
        <div className="flex items-center mb-1">
          <span className="text-sm mr-2">Eficácia:</span>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${efficacyScore * 20}%`,
                backgroundColor: efficacyScore >= 4 ? '#10b981' : efficacyScore >= 3 ? '#3b82f6' : '#f59e0b'
              }}
            ></div>
          </div>
          <span className="ml-2 text-sm font-medium">{efficacyScore.toFixed(1)}/5</span>
        </div>
        {data.studyCount && (
          <div className="text-xs text-gray-500">
            Baseado em {data.studyCount} estudo{data.studyCount !== 1 ? 's' : ''}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">Clique para mais detalhes</div>
      </div>
    );
  }

  return null;
};

export default SankeyTooltip;
