
import React from 'react';
import { Heart, Dog, PawPrint } from 'lucide-react';
import { ongoingStudiesData } from './data/ongoingStudiesData';
import DetailedStudyPanel from './components/DetailedStudyPanel';
import StatsCard from './components/StatsCard';

const EstudosAndamentoTab: React.FC = () => {
  const totalDogs = ongoingStudiesData.reduce((sum, study) => sum + study.treatmentCount + study.controlCount, 0);
  const totalStudies = ongoingStudiesData.length;
  const averageProgress = Math.round(ongoingStudiesData.reduce((sum, study) => sum + study.progress, 0) / totalStudies);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Estudos em Andamento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Total de Cães" 
          description="Participantes ativos em estudos" 
          value={totalDogs}
          icon={<Dog className="h-5 w-5" />}
          color="text-blue-600"
        />
        
        <StatsCard 
          title="Estudos Ativos" 
          description="Pesquisas em andamento" 
          value={totalStudies}
          icon={<PawPrint className="h-5 w-5" />}
          color="text-amber-600"
        />
        
        <StatsCard 
          title="Progresso Médio" 
          description="Percentual de conclusão" 
          value={`${averageProgress}%`}
          icon={<Heart className="h-5 w-5" />}
          color="text-rose-600"
          footer="Atualizado diariamente"
        />
      </div>

      <div className="space-y-6 mt-8">
        {ongoingStudiesData.map((study) => (
          <DetailedStudyPanel key={study.id} study={study} />
        ))}
      </div>
    </div>
  );
};

export default EstudosAndamentoTab;
