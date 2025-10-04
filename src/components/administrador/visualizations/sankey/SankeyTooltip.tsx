
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface SankeyTooltipProps {
  active?: boolean;
  payload?: any[];
  enhanced?: boolean;
}

const SankeyTooltip: React.FC<SankeyTooltipProps> = ({ active, payload, enhanced = false }) => {
  const { t } = useTranslation();
  
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    if (data.source && data.target) {
      // É um link
      return renderLinkTooltip(data, enhanced, t);
    } else {
      // É um nó
      return renderNodeTooltip(data, enhanced, t);
    }
  }

  return null;
};

const renderLinkTooltip = (data: any, enhanced: boolean, t: any) => {
  const sourceName = data.sourceName || (typeof data.source === 'object' ? data.source.name : '');
  const targetName = data.targetName || (typeof data.target === 'object' ? data.target.name : '');
  const efficacyScore = data.efficacyScore || (data.value / 20);
  
  const getRelationshipType = (type: string) => {
    switch (type) {
      case 'prevention': return t('sankey.tooltip.prevention');
      case 'treatment': return t('sankey.tooltip.treatment');
      case 'support': return t('sankey.tooltip.support');
      case 'study': return t('sankey.tooltip.study');
      default: return t('sankey.tooltip.relation');
    }
  };

  const relationshipType = getRelationshipType(data.relationshipType);

  let badgeColor = 'bg-gray-100 text-gray-700';
  if (data.relationshipType === 'prevention') {
    badgeColor = 'bg-green-100 text-green-700';
  } else if (data.relationshipType === 'treatment') {
    badgeColor = 'bg-blue-100 text-blue-700';
  } else if (data.relationshipType === 'support') {
    badgeColor = 'bg-amber-100 text-amber-700';
  } else if (data.relationshipType === 'study') {
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
            {t('sankey.tooltip.treatability')}: {data.treatabilityScore}/5
          </Badge>
        )}
      </div>
      
      <div className="flex items-center mb-1">
        <span className="text-sm mr-2">{t('sankey.tooltip.efficacy')}:</span>
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
          {t('sankey.tooltip.basedOn')} {data.studyCount} {data.studyCount !== 1 ? t('sankey.tooltip.studyPlural') : t('sankey.tooltip.studySingular')}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">{t('sankey.tooltip.clickDetails')}</div>
    </div>
  );
};

const renderNodeTooltip = (data: any, enhanced: boolean, t: any) => {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'nutraceutico': return t('sankey.tooltip.nutraceutical');
      case 'condicao': return t('sankey.tooltip.condition');
      case 'outcome': return t('sankey.tooltip.outcome');
      case 'severidade': return t('sankey.tooltip.severity');
      case 'tratabilidade': return t('sankey.tooltip.treatability');
      default: return category;
    }
  };

  let categoryColor = 'bg-gray-100 text-gray-700';
  
  switch (data.category) {
    case 'nutraceutico':
      categoryColor = 'bg-blue-100 text-blue-700';
      break;
    case 'condicao':
      categoryColor = 'bg-green-100 text-green-700';
      break;
    case 'outcome':
      categoryColor = 'bg-amber-100 text-amber-700';
      break;
    case 'severidade':
      categoryColor = 'bg-purple-100 text-purple-700';
      break;
    case 'tratabilidade':
      categoryColor = 'bg-rose-100 text-rose-700';
      break;
  }

  return (
    <div className="bg-white p-3 border rounded shadow-md min-w-[200px] max-w-[300px]">
      <div className="font-medium text-base mb-1">{data.name}</div>
      <Badge className={`${categoryColor} mb-2`}>{getCategoryLabel(data.category)}</Badge>
      
      {data.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-3">{data.description}</p>
      )}
      
      {enhanced && data.value && (
        <div className="text-xs flex items-center mb-1">
          <span className="text-gray-600 mr-1">{t('sankey.tooltip.relevance')}:</span>
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
      
      <div className="text-xs text-gray-500 mt-1">{t('sankey.tooltip.clickConnections')}</div>
    </div>
  );
};

export default SankeyTooltip;
