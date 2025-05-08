
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StudyProgressCardProps {
  currentDay: number;
  totalDays: number;
  phases?: { name: string; day: number }[];
}

const StudyProgressCard: React.FC<StudyProgressCardProps> = ({ 
  currentDay, 
  totalDays,
  phases = [] 
}) => {
  const progressPercentage = Math.min(Math.round((currentDay / totalDays) * 100), 100);
  
  // Determinar a fase atual
  const currentPhase = phases
    .slice()
    .reverse()
    .find(phase => currentDay >= phase.day) || { name: "Inicial", day: 0 };
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Progresso do Estudo</h4>
            <span className="text-sm font-semibold">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dia Atual:</span>
            <span className="font-medium">{currentDay} de {totalDays}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fase Atual:</span>
            <span className="font-medium">{currentPhase.name}</span>
          </div>
        </div>
        
        {phases.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Cronograma</h4>
            <div className="relative h-5">
              {/* Linha de tempo */}
              <div className="absolute top-2 left-0 w-full h-0.5 bg-gray-200"></div>
              
              {/* Marcadores de fases */}
              {phases.map((phase, index) => {
                const position = `${(phase.day / totalDays) * 100}%`;
                const isPast = currentDay >= phase.day;
                
                return (
                  <div 
                    key={index} 
                    className="absolute flex flex-col items-center" 
                    style={{ left: position, transform: 'translateX(-50%)' }}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full ${isPast ? 'bg-blue-500' : 'bg-gray-300'}`}
                    ></div>
                    <span className="text-xs mt-1 whitespace-nowrap">
                      {phase.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyProgressCard;
