
import React from 'react';
import StudyCard from './components/StudyCard';
import MortalityChart from './components/MortalityChart';
import { Study } from './types/oraBiomedical';
import { completedStudies } from './data/oraBiomedicalData';

// Dados completos do estudo de mortalidade
const completedMortalityData = [
  { age: 1, control: 1, treatment: 1 },
  { age: 5, control: 0.98, treatment: 1 },
  { age: 9, control: 0.85, treatment: 0.92 },
  { age: 13, control: 0.45, treatment: 0.72 },
  { age: 17, control: 0.15, treatment: 0.38 },
  { age: 21, control: 0, treatment: 0 },
];

const EstudosConcluidosTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Estudos Concluídos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MortalityChart data={completedMortalityData} isComplete={true} />
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resultados Finais</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">População Total:</span>
              <span>100 C. elegans</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Duração do Estudo:</span>
              <span>21 dias</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Extensão de Vida:</span>
              <span>+23.5% no grupo tratamento</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Significância Estatística:</span>
              <span>p &lt; 0.001</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {completedStudies.map((study: Study) => (
          <StudyCard key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
};

export default EstudosConcluidosTab;
