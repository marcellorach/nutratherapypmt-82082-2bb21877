
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface PredispositionTagProps {
  conditionName: string;
  conditionNameEn?: string;
  riskFactor: number;
  evidenceGrade: string;
  conditionId?: string;
  alreadyDiagnosed?: boolean;
  notes?: string;
  showRisk?: boolean;
  showEvidence?: boolean;
  navigable?: boolean;
  className?: string;
}

const evidenceGradeToScore: Record<string, number> = {
  high: 4.5,
  moderate: 3.0,
  low: 1.5,
  preliminary: 0.5,
};

const riskColor = (risk: number) => {
  if (risk >= 3) return { bg: 'hsl(var(--destructive) / 0.15)', text: 'hsl(var(--destructive))', border: 'hsl(var(--destructive) / 0.3)' };
  if (risk >= 2) return { bg: 'hsl(45 93% 47% / 0.15)', text: 'hsl(45 93% 30%)', border: 'hsl(45 93% 47% / 0.3)' };
  return { bg: 'hsl(142 76% 36% / 0.15)', text: 'hsl(142 76% 25%)', border: 'hsl(142 76% 36% / 0.3)' };
};

const PredispositionTag: React.FC<PredispositionTagProps> = ({
  conditionName,
  conditionNameEn,
  riskFactor,
  evidenceGrade,
  conditionId,
  alreadyDiagnosed = false,
  notes,
  showRisk = true,
  showEvidence = true,
  navigable = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const evidenceScore = evidenceGradeToScore[evidenceGrade] ?? 1.5;
  const evidenceLevel = getEvidenceLevel(evidenceScore);
  const risk = riskColor(riskFactor);
  const isEnglish = i18n.language?.startsWith('en');

  const displayName = isEnglish && conditionNameEn ? conditionNameEn : conditionName;

  const handleClick = () => {
    if (navigable && conditionId) {
      navigate(`/administrador?tab=veterinary-targets&condition=${conditionId}`);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${navigable && conditionId ? 'cursor-pointer hover:opacity-80' : ''} ${alreadyDiagnosed ? 'opacity-60' : ''} ${className}`}
            style={{
              backgroundColor: risk.bg,
              color: risk.text,
              borderColor: risk.border,
            }}
            onClick={handleClick}
            role={navigable ? 'button' : undefined}
          >
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>{displayName}</span>
            {showRisk && (
              <Badge
                variant="outline"
                className="ml-0.5 px-1.5 py-0 text-[10px] font-semibold border-0"
                style={{ backgroundColor: risk.border, color: risk.text }}
              >
                {riskFactor}x
              </Badge>
            )}
            {showEvidence && (
              <Badge
                variant="outline"
                className="ml-0.5 px-1.5 py-0 text-[10px] font-normal"
                style={{
                  backgroundColor: evidenceLevel.backgroundColor || 'transparent',
                  color: evidenceLevel.color,
                  borderColor: `${evidenceLevel.color}50`,
                }}
              >
                {t(evidenceLevel.level)}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{displayName}</p>
            <p className="text-xs">
              {t('predispositionTag.riskFactor')}: <span className="font-semibold">{riskFactor}x</span>
            </p>
            <p className="text-xs">
              {t('predispositionTag.evidence')}: <span className="font-semibold">{t(evidenceLevel.level)}</span> ({evidenceScore.toFixed(1)}/5)
            </p>
            {alreadyDiagnosed && (
              <p className="text-xs text-muted-foreground">✓ {t('predispositionTag.alreadyDiagnosed')}</p>
            )}
            {notes && (
              <p className="text-xs text-muted-foreground">{notes}</p>
            )}
            {navigable && conditionId && (
              <p className="text-xs text-primary">{t('predispositionTag.clickToView')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PredispositionTag;
