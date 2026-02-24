
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NodeCategory } from './types';

interface SankeyLegendProps {
  compact?: boolean;
}

interface LegendItem {
  category: string;
  titleKey: string;
  descriptionKey: string;
  color: string;
  textColor: string;
}

const SankeyLegend: React.FC<SankeyLegendProps> = ({ compact = false }) => {
  const { t } = useTranslation();

  const legendItems: LegendItem[] = [
    {
      category: 'nutraceutico',
      titleKey: 'sankeyLegend.items.nutraceuticals',
      descriptionKey: 'sankeyLegend.items.nutraceuticalsDesc',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      category: 'condicao',
      titleKey: 'sankeyLegend.items.healthConditions',
      descriptionKey: 'sankeyLegend.items.healthConditionsDesc',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      category: 'outcome',
      titleKey: 'sankeyLegend.items.outcomes',
      descriptionKey: 'sankeyLegend.items.outcomesDesc',
      color: 'bg-amber-500',
      textColor: 'text-amber-700'
    },
    {
      category: 'severidade',
      titleKey: 'sankeyLegend.items.severity',
      descriptionKey: 'sankeyLegend.items.severityDesc',
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    },
    {
      category: 'tratabilidade',
      titleKey: 'sankeyLegend.items.treatability',
      descriptionKey: 'sankeyLegend.items.treatabilityDesc',
      color: 'bg-rose-500',
      textColor: 'text-rose-700'
    }
  ];

  const relationshipTypes = [
    { type: 'prevention', titleKey: 'sankeyLegend.relations.prevention', color: 'bg-green-500' },
    { type: 'treatment', titleKey: 'sankeyLegend.relations.treatment', color: 'bg-blue-500' },
    { type: 'support', titleKey: 'sankeyLegend.relations.support', color: 'bg-amber-500' },
    { type: 'study', titleKey: 'sankeyLegend.relations.study', color: 'bg-purple-500' }
  ];

  if (compact) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-4">
          {legendItems.map(item => (
            <div key={item.category} className="flex items-center">
              <div className={`h-3 w-3 rounded-sm ${item.color} mr-1`}></div>
              <span className="text-xs">{t(item.titleKey)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-sm font-medium mb-2">{t('sankeyLegend.title')}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-xs font-medium mb-2">{t('sankeyLegend.categories')}</h5>
          <div className="grid grid-cols-2 gap-2">
            {legendItems.map(item => (
              <div key={item.category} className="flex items-center">
                <div className={`h-3 w-3 rounded-sm ${item.color} mr-2`}></div>
                <span className={`text-xs ${item.textColor}`}>{t(item.titleKey)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h5 className="text-xs font-medium mb-2">{t('sankeyLegend.relationTypes')}</h5>
          <div className="grid grid-cols-2 gap-2">
            {relationshipTypes.map(rel => (
              <div key={rel.type} className="flex items-center">
                <div className={`h-1 w-6 rounded-sm ${rel.color} mr-2`}></div>
                <span className="text-xs">{t(rel.titleKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <h5 className="text-xs font-medium mb-1">{t('sankeyLegend.connectionThickness')}</h5>
        <div className="flex items-center gap-2">
          <div className="h-1 w-10 bg-gray-300 rounded-sm"></div>
          <span className="text-xs">{t('sankeyLegend.lowEfficacy')}</span>
          <div className="h-2 w-10 bg-gray-400 rounded-sm"></div>
          <span className="text-xs">{t('sankeyLegend.mediumEfficacy')}</span>
          <div className="h-3 w-10 bg-gray-500 rounded-sm"></div>
          <span className="text-xs">{t('sankeyLegend.highEfficacy')}</span>
        </div>
      </div>
    </div>
  );
};

export default SankeyLegend;
