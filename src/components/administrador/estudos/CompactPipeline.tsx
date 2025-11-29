import React from 'react';
import { Upload, Brain, GitBranch, Network, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PipelineStep {
  icon: React.ReactNode;
  descKey: string;
}

export const CompactPipeline = () => {
  const { t } = useTranslation();

  const steps: PipelineStep[] = [
    { icon: <Upload className="h-4 w-4" />, descKey: 'studies.pipeline.step1.desc' },
    { icon: <Brain className="h-4 w-4" />, descKey: 'studies.pipeline.step2.desc' },
    { icon: <GitBranch className="h-4 w-4" />, descKey: 'studies.pipeline.step3.desc' },
    { icon: <Network className="h-4 w-4" />, descKey: 'studies.pipeline.step4.desc' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1 py-1">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary cursor-default hover:bg-primary/20 transition-colors">
                  {step.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t(step.descKey)}</p>
              </TooltipContent>
            </Tooltip>
            
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
};
