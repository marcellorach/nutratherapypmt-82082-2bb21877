
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from 'react-i18next';

type StudyPhase = 'recruitment' | 'baseline' | 'intervention' | 'evaluation' | 'analysis';

interface StudyPhaseProps {
  phase: StudyPhase;
  isActive?: boolean;
}

const StudyPhaseIndicator: React.FC<StudyPhaseProps> = ({ phase, isActive = true }) => {
  const { t } = useTranslation();
  
  const phaseInfo = {
    recruitment: {
      label: t('admin.studies.phases.recruitment'),
      color: 'bg-purple-100 text-purple-800',
      description: t('admin.studies.phases.recruitmentDesc')
    },
    baseline: {
      label: t('admin.studies.phases.baseline'),
      color: 'bg-blue-100 text-blue-800',
      description: t('admin.studies.phases.baselineDesc')
    },
    intervention: {
      label: t('admin.studies.phases.intervention'),
      color: 'bg-green-100 text-green-800',
      description: t('admin.studies.phases.interventionDesc')
    },
    evaluation: {
      label: t('admin.studies.phases.evaluation'),
      color: 'bg-yellow-100 text-yellow-800',
      description: t('admin.studies.phases.evaluationDesc')
    },
    analysis: {
      label: t('admin.studies.phases.analysis'),
      color: 'bg-orange-100 text-orange-800',
      description: t('admin.studies.phases.analysisDesc')
    }
  };
  
  const { label, color, description } = phaseInfo[phase];
  
  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        className={`${color} ${isActive ? 'border border-current' : 'opacity-60'}`}
      >
        {label}
        {isActive && <span className="ml-1 animate-pulse">•</span>}
      </Badge>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default StudyPhaseIndicator;
