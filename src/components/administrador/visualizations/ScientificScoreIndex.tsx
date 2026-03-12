
import React from 'react';
import { EvidenceLevels } from '@/rules/general/evidence-levels';
import { useTranslation } from 'react-i18next';

interface ScientificScoreIndexProps {
  className?: string;
}

const ScientificScoreIndex: React.FC<ScientificScoreIndexProps> = ({ className = "" }) => {
  const { t } = useTranslation();

  return (
    <div className={`bg-card p-4 rounded-lg border ${className}`}>
      <h3 className="text-sm font-semibold mb-3">{t('scientificScore.title')}</h3>
      
      <div className="space-y-2">
        {Object.entries(EvidenceLevels).map(([key, level]) => (
          <div key={key} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted/50">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: level.color }}
              />
              <span>{t(level.label)}</span>
            </div>
            <div className="text-muted-foreground font-medium">
              {level.range[0]} - {level.range[1]}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>{t('scientificScore.basedOn')}:</p>
        <ul className="list-disc list-inside mt-1">
          <li>{t('scientificScore.methodological')}</li>
          <li>{t('scientificScore.reproducibility')}</li>
          <li>{t('scientificScore.clinicalApplicability')}</li>
          <li>{t('scientificScore.scientificSupport')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ScientificScoreIndex;
