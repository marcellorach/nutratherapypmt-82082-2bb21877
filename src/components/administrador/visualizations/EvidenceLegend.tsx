
import React from 'react';

interface EvidenceLegendProps {
  compact?: boolean;
}

export const EvidenceLegend: React.FC<EvidenceLegendProps> = ({ compact = false }) => {
  const evidenceLevels = [
    { score: 0, label: 'Sem evidência', color: '#e5e7eb' },
    { score: 1, label: 'Anedótica', color: '#fde68a' },
    { score: 2, label: 'Pouca evidência', color: '#fcd34d' },
    { score: 3, label: 'Moderada', color: '#60a5fa' },
    { score: 4, label: 'Boa evidência', color: '#34d399' },
    { score: 5, label: 'Excelente', color: '#10b981' },
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
            {level.label} ({level.score}/5)
          </span>
        </div>
      ))}
    </div>
  );
};

export default EvidenceLegend;
