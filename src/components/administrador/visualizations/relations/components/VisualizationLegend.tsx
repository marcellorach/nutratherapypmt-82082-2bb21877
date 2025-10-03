
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const VisualizationLegend: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">{t('relations.legend.title')}</div>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          <span>{t('relations.legend.nutraceutical')}</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>{t('relations.legend.healthCondition')}</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
          <span>{t('relations.legend.scientificStudy')}</span>
        </div>
        <div className="flex items-center ml-2">
          <span className="inline-block w-8 h-px bg-gray-400 mr-2" style={{ backgroundImage: 'linear-gradient(to right, #9ca3af 50%, transparent 50%)', backgroundSize: '6px 1px' }}></span>
          <span>{t('relations.legend.potentialConnection')}</span>
        </div>
        <div className="flex items-center ml-2">
          <span className="inline-block w-8 h-px bg-purple-400 mr-2" style={{ backgroundImage: 'linear-gradient(to right, #8b5cf6 2px, transparent 2px, transparent 4px)', backgroundSize: '4px 1px' }}></span>
          <span>{t('relations.legend.synergy')}</span>
        </div>
      </div>
      <div className="flex flex-wrap mt-2 gap-3 text-xs">
        <div className="flex items-center">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">{t('relations.legend.high')}</Badge>
          <span className="mx-1">→</span>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">{t('relations.legend.low')}</Badge>
          <span className="ml-1">{t('relations.legend.efficacyLevel')}</span>
        </div>
      </div>
      <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
        <p className="font-medium mb-1">{t('relations.legend.aboutData')}</p>
        <p>{t('relations.legend.dataDescription')}</p>
        <p className="mt-1">{t('relations.legend.colorDescription')}</p>
      </div>
    </div>
  );
};

export default VisualizationLegend;
