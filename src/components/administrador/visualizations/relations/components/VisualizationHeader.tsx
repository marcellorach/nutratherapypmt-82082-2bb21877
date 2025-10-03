
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VisualizationHeaderProps {
  efficacyFilter: string;
  onEfficacyFilterChange: (value: string) => void;
}

const VisualizationHeader: React.FC<VisualizationHeaderProps> = ({
  efficacyFilter,
  onEfficacyFilterChange
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('relations.visualization.title')}</h3>
        <div className="text-sm text-gray-500">
          {t('relations.visualization.demoDataLoaded')}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {t('relations.visualization.description')}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{t('relations.visualization.filterByEfficacy')}</span>
          <Select value={efficacyFilter} onValueChange={onEfficacyFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('relations.visualization.filterByEfficacy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('relations.visualization.allEfficacies')}</SelectItem>
              <SelectItem value="high">{t('relations.visualization.highEfficacy')}</SelectItem>
              <SelectItem value="medium">{t('relations.visualization.mediumEfficacy')}</SelectItem>
              <SelectItem value="low">{t('relations.visualization.lowEfficacy')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default VisualizationHeader;
