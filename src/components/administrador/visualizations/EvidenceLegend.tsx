
import React from 'react';
import { useTranslation } from 'react-i18next';

interface EvidenceLegendProps {
  compact?: boolean;
}

export const EvidenceLegend: React.FC<EvidenceLegendProps> = ({ compact = false }) => {
  const { t } = useTranslation();
  
  const evidenceLevels = [
    { score: 0, labelKey: 'evidenceLegend.noEvidence', color: '#e5e7eb' },
    { score: 1, labelKey: 'evidenceLegend.anecdotal', color: '#fde68a' },
    { score: 2, labelKey: 'evidenceLegend.limited', color: '#fcd34d' },
    { score: 3, labelKey: 'evidenceLegend.moderate', color: '#60a5fa' },
    { score: 4, labelKey: 'evidenceLegend.good', color: '#34d399' },
    { score: 5, labelKey: 'evidenceLegend.excellent', color: '#10b981' },
  ];

  return (
    <div className={`flex ${compact ? 'flex-col gap-1' : 'flex-wrap gap-3'}`}>
      {evidenceLevels.map((level) => (
        <div key={level.score} className="flex items-center">
          <div 
            className={`rounded-full mr-1.5 ${compact ? 'w-2 h-2' : 'w-3 h-3'}`}
            style={{ backgroundColor: level.color }}
          />
          <span className={compact ? 'text-xs' : 'text-sm'}>
            {t(level.labelKey)} ({level.score}/5)
          </span>
        </div>
      ))}
    </div>
  );
};

export default EvidenceLegend;
