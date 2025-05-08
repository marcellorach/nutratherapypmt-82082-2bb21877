
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SankeyTooltipProps {
  active?: boolean;
  payload?: any[];
  enhanced?: boolean;
}

const SankeyTooltip: React.FC<SankeyTooltipProps> = ({ active, payload, enhanced = false }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    if (data.source && data.target) {
      // É um link
      return renderLinkTooltip(data, enhanced);
    } else {
      // É um nó
      return renderNodeTooltip(data, enhanced);
    }
  }

  return null;
};

const renderLinkTooltip = (data: any, enhanced: boolean) => {
  const sourceName = data.sourceName || (typeof data.source === 'object' ? data.source.name : '');
  const targetName = data.targetName || (typeof data.target === 'object' ? data.target.name : '');
  const efficacyScore = data.efficacyScore || (data.value / 20); // Convertendo de volta para escala 0-5
  
  let relationshipType = 'Outro';
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
    case 'study':
      relationshipType = 'Estudo';
      break;
    default:
      relationshipType = 'Relação';
  }

  let badgeColor = 'bg-gray-100 text-gray-700';
  if (relationshipType === 'Prevenção') {
    badgeColor = 'bg-green-100 text-green-700';
  } else if (relationshipType === 'Tratamento') {
    badgeColor = 'bg-blue-100 text-blue-700';
  } else if (relationshipType === 'Suporte') {
    badgeColor = 'bg-amber-100 text-amber-700';
  } else if (relationshipType === 'Estudo') {
    badgeColor = 'bg-purple-100 text-purple-700';
  }

  return (
    <div className="bg-white p-3 border rounded shadow-md min-w-[200px] max-w-[300px]">
      <div className="font-medium text-base mb-1 flex items-center justify-between">
        <div className="truncate">{sourceName}</div>
        <div className="mx-2">→</div> 
        <div className="truncate">{targetName}</div>
      </div>
      
      <div className="flex items-center mb-2">
        <Badge className={`${badgeColor} text-xs`}>{relationshipType}</Badge>
        {enhanced && data.treatabilityScore && (
          <Badge className="ml-1 bg-rose-100 text-rose-700 text-xs">
            Trat: {data.treatabilityScore}/5
          </Badge>
        )}
      </div>
      
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
};

const renderNodeTooltip = (data: any, enhanced: boolean) => {
  let categoryLabel = data.category;
  let categoryColor = 'bg-gray-100 text-gray-700';
  
  switch (data.category) {
    case 'nutraceutico':
      categoryLabel = 'Nutracêutico';
      categoryColor = 'bg-blue-100 text-blue-700';
      break;
    case 'condicao':
      categoryLabel = 'Condição';
      categoryColor = 'bg-green-100 text-green-700';
      break;
    case 'outcome':
      categoryLabel = 'Outcome';
      categoryColor = 'bg-amber-100 text-amber-700';
      break;
    case 'severidade':
      categoryLabel = 'Severidade';
      categoryColor = 'bg-purple-100 text-purple-700';
      break;
    case 'tratabilidade':
      categoryLabel = 'Tratabilidade';
      categoryColor = 'bg-rose-100 text-rose-700';
      break;
  }

  return (
    <div className="bg-white p-3 border rounded shadow-md min-w-[200px] max-w-[300px]">
      <div className="font-medium text-base mb-1">{data.name}</div>
      <Badge className={`${categoryColor} mb-2`}>{categoryLabel}</Badge>
      
      {data.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-3">{data.description}</p>
      )}
      
      {enhanced && data.value && (
        <div className="text-xs flex items-center mb-1">
          <span className="text-gray-600 mr-1">Relevância:</span>
          <div className="w-24 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${data.value}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {enhanced && data.metadata && Object.keys(data.metadata).length > 0 && (
        <div className="border-t mt-2 pt-2">
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-gray-500">{key}:</span>
              <span className="font-medium">{value as string}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">Clique para ver conexões</div>
    </div>
  );
};

export default SankeyTooltip;
