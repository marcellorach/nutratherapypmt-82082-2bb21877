
import React from 'react';
import { EvidenceLevels } from '@/rules/general/evidence-levels';

interface ScientificScoreIndexProps {
  className?: string;
}

const ScientificScoreIndex: React.FC<ScientificScoreIndexProps> = ({ className = "" }) => {
  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <h3 className="text-sm font-semibold mb-3">Índice de Pontuação Científica</h3>
      
      <div className="space-y-2">
        {Object.entries(EvidenceLevels).map(([key, level]) => (
          <div key={key} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-gray-50">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: level.color }}
              />
              <span>{level.label}</span>
            </div>
            <div className="text-gray-600 font-medium">
              {level.range[0]} - {level.range[1]}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Pontuação baseada em:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Qualidade metodológica</li>
          <li>Reprodutibilidade</li>
          <li>Aplicabilidade clínica</li>
          <li>Sustentação científica</li>
        </ul>
      </div>
    </div>
  );
};

export default ScientificScoreIndex;
