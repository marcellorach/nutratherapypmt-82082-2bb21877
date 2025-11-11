
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface StudyProgressCardProps {
  currentDay: number;
  totalDays: number;
  phases?: { 
    name?: string;
    name_pt?: string;
    name_en?: string;
    day: number;
  }[];
}

const StudyProgressCard: React.FC<StudyProgressCardProps> = ({ 
  currentDay, 
  totalDays,
  phases = [] 
}) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const progressPercentage = Math.min(Math.round((currentDay / totalDays) * 100), 100);
  
  // Helper para obter nome localizado da fase
  const getPhaseName = (phase: StudyProgressCardProps['phases'][number]) => {
    if (isEnglish && phase.name_en) return phase.name_en;
    if (phase.name_pt) return phase.name_pt;
    return phase.name || '';
  };
  
  // Helper para abreviar labels das fases (evita sobreposição)
  const getPhaseLabel = (phase: StudyProgressCardProps['phases'][number]) => {
    const monthMatch = phase.day.toString();
    const months = Math.round(phase.day / 30);
    
    // Se for o dia 0, é baseline
    if (phase.day === 0) return 'M0';
    
    // Para outros, usar formato M{número}
    return `M${months}`;
  };
  
  // Determinar a fase atual
  const currentPhase = phases
    .slice()
    .reverse()
    .find(phase => currentDay >= phase.day) || { name_pt: "Inicial", name_en: "Initial", day: 0 };
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t('admin.studies.progress.title')}</h4>
            <span className="text-sm font-semibold">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.studies.progress.currentDay')}</span>
            <span className="font-medium">{currentDay} {t('admin.studies.progress.of')} {totalDays}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.studies.progress.currentPhase')}</span>
            <span className="font-medium">{getPhaseName(currentPhase)}</span>
          </div>
        </div>
        
        {phases.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">{t('admin.studies.progress.schedule')}</h4>
            <div className="relative h-5">
              {/* Linha de tempo */}
              <div className="absolute top-2 left-0 w-full h-0.5 bg-gray-200"></div>
              
              {/* Marcadores de fases */}
              <TooltipProvider>
                {phases.map((phase, index) => {
                  const position = `${(phase.day / totalDays) * 100}%`;
                  const isPast = currentDay >= phase.day;
                  
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div 
                          className="absolute flex flex-col items-center cursor-help" 
                          style={{ left: position, transform: 'translateX(-50%)' }}
                        >
                          <div 
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${isPast ? 'bg-blue-500' : 'bg-gray-300'}`}
                          ></div>
                          <span className={`text-[10px] mt-1 font-medium ${isPast ? 'text-blue-600' : 'text-gray-500'}`}>
                            {getPhaseLabel(phase)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs font-medium">{getPhaseName(phase)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('admin.studies.progress.day')} {phase.day}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyProgressCard;
