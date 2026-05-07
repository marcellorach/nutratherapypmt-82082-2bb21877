import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Sparkles, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AIProjectionResult } from '@/hooks/usePetTrajectoryProjection';

interface Props {
  trajectory: AIProjectionResult | undefined | null;
  petName: string;
  petAgeYears: number;
}

/**
 * Sprint 3 — "Without protocol vs With protocol" panel.
 * 100% real data from `project-pet-trajectory` (Digital Twin). Falls back
 * gracefully when the projection is missing or in heuristic mode.
 */
const ScenarioComparison: React.FC<Props> = ({ trajectory, petName, petAgeYears }) => {
  const { t } = useTranslation();

  if (!trajectory || !trajectory.projection) return null;

  const yearsWith = trajectory.projection.years_with_protocol || trajectory.years_with_protocol || [];
  const yearsWithout = trajectory.projection.years_without_protocol || trajectory.years_without_protocol || [];
  if (yearsWith.length === 0 || yearsWithout.length === 0) return null;

  const lastWith = yearsWith[yearsWith.length - 1];
  const lastWithout = yearsWithout[yearsWithout.length - 1];
  const yearsGained =
    trajectory.projection.years_gained_total ??
    trajectory.years_gained ??
    (lastWith.expected_remaining_years - lastWithout.expected_remaining_years);

  const expectancyWith = petAgeYears + lastWith.expected_remaining_years;
  const expectancyWithout = petAgeYears + lastWithout.expected_remaining_years;
  const bioAgeWith = lastWith.biological_age;
  const bioAgeWithout = lastWithout.biological_age;

  const isGrounded = trajectory.source === 'ai_kg_grounded';
  const confidence = trajectory.confidence || trajectory.projection.confidence || 'medium';

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('tutor.proposal.scenario.title')}
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-[11px] gap-1 cursor-help ${
                  isGrounded
                    ? 'border-emerald-300 text-emerald-800 dark:text-emerald-300 dark:border-emerald-700'
                    : 'border-amber-300 text-amber-800 dark:text-amber-300 dark:border-amber-700'
                }`}
              >
                {isGrounded ? <Sparkles className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {isGrounded
                  ? t('tutor.proposal.scenario.sourceGrounded')
                  : t('tutor.proposal.scenario.sourceFallback')}
                <span className="opacity-70">· {t(`tutor.proposal.scenario.confidence.${confidence}`)}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {isGrounded
                ? t('tutor.proposal.scenario.tooltipGrounded')
                : t('tutor.proposal.scenario.tooltipFallback')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Without protocol */}
        <div className="rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <p className="text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wide">
              {t('tutor.proposal.scenario.withoutTitle')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-200">
              {bioAgeWithout.toFixed(1)} <span className="text-sm font-normal">{t('tutor.proposal.scenario.bioYears')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{t('tutor.proposal.scenario.bioAgeAtYearN', { year: lastWithout.year })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('tutor.proposal.scenario.expectancy', { years: expectancyWithout.toFixed(1) })}
            </p>
          </div>
        </div>

        {/* With protocol */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
              {t('tutor.proposal.scenario.withTitle')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {bioAgeWith.toFixed(1)} <span className="text-sm font-normal">{t('tutor.proposal.scenario.bioYears')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{t('tutor.proposal.scenario.bioAgeAtYearN', { year: lastWith.year })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('tutor.proposal.scenario.expectancy', { years: expectancyWith.toFixed(1) })}
            </p>
          </div>
        </div>
      </div>

      {/* Years gained — honest framing */}
      <div className="mt-3 text-center bg-muted/40 rounded-lg p-3">
        {Math.abs(yearsGained) < 0.05 ? (
          <p className="text-sm text-muted-foreground">
            {t('tutor.proposal.scenario.yearsGainedZero', { petName })}
          </p>
        ) : yearsGained > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-0.5">
              {t('tutor.proposal.scenario.yearsGainedLabel', { petName })}
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              +{yearsGained.toFixed(1)} {t('tutor.proposal.scenario.years')}
            </p>
          </>
        ) : (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t('tutor.proposal.scenario.yearsGainedNegative', { value: yearsGained.toFixed(1) })}
          </p>
        )}
      </div>

      {trajectory.projection.rationale && (
        <p className="text-[11px] text-muted-foreground italic mt-2 leading-relaxed">
          {trajectory.projection.rationale}
        </p>
      )}
    </div>
  );
};

export default ScenarioComparison;
