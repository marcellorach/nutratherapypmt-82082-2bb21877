
import React from 'react';
import StudyCard from './components/StudyCard';
import MortalityChart from './components/MortalityChart';
import { Study } from './types/oraBiomedical';
import { ongoingStudies } from './data/oraBiomedicalData';

// Dados de exemplo para o gráfico de mortalidade (incompleto)
const ongoingMortalityData = [
  { age: 1, control: 1, treatment: 1 },
  { age: 5, control: 0.98, treatment: 1 },
  { age: 9, control: 0.85, treatment: 0.92 },
  { age: 13, control: 0.45, treatment: 0.72 },
  { age: 17, control: 0.15, treatment: 0.38 },
  // Estudo em andamento, dados incompletos
];

const EstudosAndamentoTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Estudos em Andamento</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MortalityChart data={ongoingMortalityData} isComplete={false} />
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Dados do Experimento</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">População Inicial:</span>
              <span>100 C. elegans</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Dias Decorridos:</span>
              <span>17 dias</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Sobrevivência Atual:</span>
              <span>Controle: 15% | Tratamento: 38%</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Status do Experimento:</span>
              <span className="text-blue-600 font-medium">Em andamento</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold">Estudos Ativos</h3>
        {ongoingStudies.map((study: Study) => (
          <StudyCard key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
};

export default EstudosAndamentoTab;
