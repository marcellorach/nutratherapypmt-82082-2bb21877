import React from 'react';
import { Upload, Brain, GitBranch, Network, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PipelineStep {
  icon: React.ReactNode;
  nameKey: string;
  descKey: string;
}

export const PipelineSteps = () => {
  const { t } = useTranslation();

  const steps: PipelineStep[] = [
    {
      icon: <Upload className="h-5 w-5" />,
      nameKey: 'studies.pipeline.step1.name',
      descKey: 'studies.pipeline.step1.desc',
    },
    {
      icon: <Brain className="h-5 w-5" />,
      nameKey: 'studies.pipeline.step2.name',
      descKey: 'studies.pipeline.step2.desc',
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      nameKey: 'studies.pipeline.step3.name',
      descKey: 'studies.pipeline.step3.desc',
    },
    {
      icon: <Network className="h-5 w-5" />,
      nameKey: 'studies.pipeline.step4.name',
      descKey: 'studies.pipeline.step4.desc',
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-2 py-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1.5 min-w-[80px] cursor-default">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {t(step.nameKey)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{t(step.descKey)}</p>
              </TooltipContent>
            </Tooltip>
            
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
};
