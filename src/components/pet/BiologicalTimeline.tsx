import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dna, Sparkles, AlertTriangle, FlaskConical, Info, TrendingUp, TrendingDown,
  Heart, BrainCircuit, BookOpen, Loader2, ShieldCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  buildBiologicalTimeline,
  type ActiveConditionInput,
  type YearProjection,
  type ProjectedExistingCondition,
  type ProjectedNewCondition,
} from '@/services/biological-timeline-engine';
import { useBreedPredispositionsForPet } from '@/hooks/useBreedPredispositionsForPet';
import { usePetTrajectoryProjection } from '@/hooks/usePetTrajectoryProjection';
import { usePetCompoundCoverage } from '@/hooks/usePetCompoundCoverage';
import { mapConditionToRegions, type AnatomyRegionId } from '@/services/anatomy-region-map';
import DogAnatomySVG, { type RegionState, type Severity } from './DogAnatomySVG';

interface BiologicalTimelineProps {
  conditions: Array<{
    id: string;
    condition_name: string;
    severity?: string;
    status?: string;
  }>;
  petName: string;
  petBreed: string;
  petAge: number;
  petId?: string | null;
}

function buildRegionStates(
  existing: ProjectedExistingCondition[],
  emergent: ProjectedNewCondition[],
  protectionActive: boolean,
): { states: Partial<Record<AnatomyRegionId, RegionState>>; systemic: Severity | null } {
  const states: Partial<Record<AnatomyRegionId, RegionState>> = {};
  let systemic: Severity | null = null;

  const upgrade = (cur: Severity | null, next: Severity): Severity => {
    const order: Severity[] = ['mild', 'moderate', 'severe'];
    if (!cur) return next;
    return order.indexOf(next) > order.indexOf(cur) ? next : cur;
  };

  const apply = (
    name: string,
    severity: Severity,
    isNew: boolean,
    probability: number | undefined,
    protectedBy: string[],
  ) => {
    const mapping = mapConditionToRegions(name);
    if (mapping.systemic) systemic = upgrade(systemic, severity);
    for (const region of mapping.regions) {
      if (region === 'systemic') continue;
      const prev = states[region];
      const conditions = prev?.conditions || [];
      conditions.push({ name, severity, isNew, probability, protectedBy });
      states[region] = {
        severity: upgrade(prev?.severity ?? null, severity),
        isNew: prev?.isNew || isNew,
        protected: (prev?.protected || (protectionActive && protectedBy.length > 0)),
        conditions,
      };
    }
  };

  for (const c of existing) {
    apply(c.name, c.projectedSeverityLabel as Severity, false, undefined, c.anchorCompounds || []);
  }
  for (const c of emergent) {
    if (c.probability < 0.2) continue;
    const sev: Severity = c.probability >= 0.6 ? 'moderate' : 'mild';
    apply(c.name, sev, true, c.probability, c.anchorCompounds || []);
  }

  return { states, systemic };
}

const BiologicalTimeline: React.FC<BiologicalTimelineProps> = ({
  conditions,
  petName,
  petBreed,
  petAge,
  petId,
}) => {
  const { t } = useTranslation();
  const { data: breedCtx, isLoading: breedLoading } = useBreedPredispositionsForPet(petBreed);

  const [yearsAhead, setYearsAhead] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  // The compare view always shows BOTH scenarios side-by-side. The "active" one
  // (used for the AI projection toggle and for the projected-conditions list)
  // is always the with-protocol scenario, since that is the recommended path.
  const withIntervention = true;

  // AI projection (Gemini 3.1 Pro Preview)
  const aiQuery = usePetTrajectoryProjection(petId || null, withIntervention, !!petId);
  const aiYears = aiQuery.data?.projection?.years || null;
  const aiCitations = aiQuery.data?.citations || [];
  const aiConfidence = aiQuery.data?.projection?.confidence || null;
  const aiYearsGained = aiQuery.data?.years_gained ?? null;
  const aiSource: 'ai' | 'heuristic' = aiYears && aiYears.length > 0 ? 'ai' : 'heuristic';

  const activeConditionInputs: ActiveConditionInput[] = useMemo(
    () => conditions.map(c => ({
      id: c.id,
      condition_name: c.condition_name,
      severity: c.severity,
      status: c.status,
    })),
    [conditions]
  );

  const lifespan = breedCtx?.breed?.average_lifespan_years || 12;
  const sizeCategory = breedCtx?.breed?.size_category || null;
  const weightKg = breedCtx?.breed?.average_weight_kg || null;

  // KG coverage for honest protection logic
  const conditionNames = useMemo(() => {
    const names = activeConditionInputs.map(c => c.condition_name);
    (breedCtx?.predispositions || []).forEach(p => {
      names.push(p.condition_name);
      if (p.condition_name_en) names.push(p.condition_name_en);
    });
    return Array.from(new Set(names));
  }, [activeConditionInputs, breedCtx?.predispositions]);

  const coverageQuery = usePetCompoundCoverage(petId || null, conditionNames, !!petId);
  const kgCoverage = coverageQuery.data || [];

  const protocolCompoundCount = useMemo(() => {
    const set = new Set<string>();
    kgCoverage.forEach(c => c.compounds.forEach(comp => set.add(comp.name)));
    return Math.min(set.size, 8); // cap at 8 per project memory
  }, [kgCoverage]);

  const buildLocal = (intervention: boolean) => buildBiologicalTimeline({
    currentAgeYears: petAge,
    averageLifespanYears: lifespan,
    sizeCategory,
    averageWeightKg: weightKg,
    activeConditions: activeConditionInputs,
    breedPredispositions: breedCtx?.predispositions || [],
    withIntervention: intervention,
    kgCoverage,
    protocolCompoundCount,
  });

  // Always compute both scenarios for the side-by-side compare
  const projectionsWith = useMemo(() => buildLocal(true), [petAge, lifespan, sizeCategory, weightKg, activeConditionInputs, breedCtx?.predispositions, kgCoverage, protocolCompoundCount]);
  const projectionsWithout = useMemo(() => buildLocal(false), [petAge, lifespan, sizeCategory, weightKg, activeConditionInputs, breedCtx?.predispositions, kgCoverage, protocolCompoundCount]);

  // Choose primary projection (AI overrides heuristic for the active toggle)
  const projections = useMemo(() => {
    const heuristic = withIntervention ? projectionsWith : projectionsWithout;
    if (!aiYears || aiYears.length === 0) return heuristic;
    return aiYears.map<YearProjection>((y, idx) => ({
      year: y.year,
      ageAtYear: y.age_at_year,
      biologicalAge: y.biological_age,
      existingConditions: (y.existing_conditions || []).map(ec => {
        const h = heuristic[Math.min(idx, heuristic.length - 1)]?.existingConditions
          .find(he => he.name.toLowerCase() === ec.name.toLowerCase());
        return {
          id: `${ec.name}-${idx}`,
          name: ec.name,
          currentSeverity: h?.currentSeverity || 'mild',
          projectedSeverityScore: ec.projected_severity_score,
          projectedSeverityLabel: ec.projected_severity_label as Severity,
          deltaPercent: 0,
          kgCovered: h?.kgCovered ?? false,
          protectionApplied: h?.protectionApplied ?? 0,
          anchorCompounds: h?.anchorCompounds ?? [],
        };
      }),
      newConditions: (y.new_conditions || []).map(nc => ({
        conditionId: nc.name,
        name: nc.name,
        probability: nc.probability,
        evidenceGrade: (nc.evidence_grade as any) || 'moderate',
        riskFactor: 1,
        kgCovered: false,
        protectionApplied: 0,
        anchorCompounds: [],
      })),
      expectedRemainingYears: y.expected_remaining_years,
      protocolCaveats: heuristic[Math.min(idx, heuristic.length - 1)]?.protocolCaveats || [],
      coverageRatio: heuristic[Math.min(idx, heuristic.length - 1)]?.coverageRatio || 0,
    }));
  }, [aiYears, withIntervention, projectionsWith, projectionsWithout]);

  const maxSlider = projections.length > 0 ? projections[projections.length - 1].year : 8;
  const safeIndex = Math.min(yearsAhead, projections.length - 1);
  const current = projections[safeIndex];

  // Counterpart for compare view
  const oppositeProjections = withIntervention ? projectionsWithout : projectionsWith;
  const opposite = oppositeProjections[Math.min(yearsAhead, oppositeProjections.length - 1)];

  const yearsGainedLocal = (projectionsWith[safeIndex]?.expectedRemainingYears || 0)
    - (projectionsWithout[safeIndex]?.expectedRemainingYears || 0);
  const yearsGained = aiYearsGained != null ? aiYearsGained : yearsGainedLocal;

  // Region states for the two side-by-side dogs
  const regionsWith = useMemo(() => {
    const p = projectionsWith[safeIndex];
    if (!p) return { states: {}, systemic: null as Severity | null };
    return buildRegionStates(p.existingConditions, p.newConditions, true);
  }, [projectionsWith, safeIndex]);

  const regionsWithout = useMemo(() => {
    const p = projectionsWithout[safeIndex];
    if (!p) return { states: {}, systemic: null as Severity | null };
    return buildRegionStates(p.existingConditions, p.newConditions, false);
  }, [projectionsWithout, safeIndex]);

  if (!current) return null;

  const hasBreedData = !!breedCtx?.breed;
  const noPredispositions = (breedCtx?.predispositions.length || 0) === 0;
  const caveats = (withIntervention ? projectionsWith : projectionsWithout)[0]?.protocolCaveats || [];
  const coverageRatio = projectionsWith[0]?.coverageRatio || 0;
  const coveredCount = Math.round(coverageRatio * conditionNames.length);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="h-4 w-4 text-primary" />
              {t('petProfile.biologicalTimeline.title')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t('petProfile.biologicalTimeline.subtitle', { name: petName, breed: petBreed, age: petAge })}
            </p>
          </div>
          {aiQuery.isLoading ? (
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 text-blue-700 dark:text-blue-400 text-[10px] whitespace-nowrap">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t('petProfile.biologicalTimeline.aiLoading')}
            </Badge>
          ) : aiSource === 'ai' ? (
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400 text-[10px] whitespace-nowrap">
              <BrainCircuit className="h-3 w-3 mr-1" />
              {t('petProfile.biologicalTimeline.aiBadge', { confidence: aiConfidence ? t(`petProfile.biologicalTimeline.confidence.${aiConfidence}`) : '' })}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-700 dark:text-amber-400 text-[10px] whitespace-nowrap">
              <FlaskConical className="h-3 w-3 mr-1" />
              {t('petProfile.biologicalTimeline.heuristicBadge')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Vital stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border bg-muted/30 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('petProfile.biologicalTimeline.biologicalAge')}
            </p>
            <p className="text-lg font-semibold">
              {current.biologicalAge.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {current.biologicalAge > current.ageAtYear ? (
                <span className="text-orange-600 dark:text-orange-400 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +{(current.biologicalAge - current.ageAtYear).toFixed(1)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                  <TrendingDown className="h-2.5 w-2.5" />
                  {(current.biologicalAge - current.ageAtYear).toFixed(1)}
                </span>
              )}
              {' '}{t('petProfile.biologicalTimeline.vsChrono')}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('petProfile.biologicalTimeline.chronologicalAge')}
            </p>
            <p className="text-lg font-semibold">
              {current.ageAtYear.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('petProfile.biologicalTimeline.breedLifespan', { years: lifespan })}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Heart className="h-2.5 w-2.5" />
              {t('petProfile.biologicalTimeline.remainingYears')}
            </p>
            <p className="text-lg font-semibold">
              {current.expectedRemainingYears.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            {Math.abs(yearsGained) >= 0.1 && (
              <p className={`text-[10px] ${yearsGained > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {yearsGained > 0 ? '+' : ''}{yearsGained.toFixed(1)} {t('petProfile.biologicalTimeline.withProtocol')}
              </p>
            )}
          </div>
        </div>

        {/* Side-by-side anatomical compare */}
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t('petProfile.biologicalTimeline.compareTitle')}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] bg-muted/40">
                  {t('petProfile.biologicalTimeline.withoutProtocol')}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {projectionsWithout[safeIndex]?.expectedRemainingYears.toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort')}
                </span>
              </div>
              <div className="rounded-md bg-background border border-border/50 p-2 aspect-[8/5]">
                <DogAnatomySVG
                  regionStates={regionsWithout.states}
                  systemicSeverity={regionsWithout.systemic}
                  showProtectionAura={false}
                  className="w-full h-full"
                />
              </div>
              <ConditionsMiniList
                projection={projectionsWithout[safeIndex]}
                tone="neutral"
                emptyLabel={t('petProfile.biologicalTimeline.noProjectedRisks')}
                t={t}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {t('petProfile.biologicalTimeline.withProtocolLabel')}
                </Badge>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {projectionsWith[safeIndex]?.expectedRemainingYears.toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort')}
                </span>
              </div>
              <div className="rounded-md bg-background border border-emerald-200 dark:border-emerald-900/50 p-2 aspect-[8/5]">
                <DogAnatomySVG
                  regionStates={regionsWith.states}
                  systemicSeverity={regionsWith.systemic}
                  showProtectionAura={true}
                  className="w-full h-full"
                />
              </div>
              <ConditionsMiniList
                projection={projectionsWith[safeIndex]}
                tone="protected"
                emptyLabel={t('petProfile.biologicalTimeline.noProjectedRisks')}
                t={t}
              />
            </div>
          </div>
          {/* Visual legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(48, 95%, 55%)' }} />
              {t('petProfile.severity.mild')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(25, 95%, 52%)' }} />
              {t('petProfile.severity.moderate')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(0, 80%, 52%)' }} />
              {t('petProfile.severity.severe')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border border-dashed border-amber-500" />
              {t('petProfile.biologicalTimeline.legend.futureRisk', 'risco futuro')}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              ★ {t('petProfile.biologicalTimeline.legend.protected', 'protegido')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'hsl(0, 80%, 52%)', opacity: 0.3 }} />
              {t('petProfile.biologicalTimeline.legend.systemic', 'carga sistêmica')}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {t('petProfile.biologicalTimeline.coverage', { covered: coveredCount, total: conditionNames.length })}
          </p>
        </div>

        {/* Time slider */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <Label className="font-medium">{t('petProfile.biologicalTimeline.projectionLabel')}</Label>
            <span className="font-semibold text-primary">
              {yearsAhead === 0
                ? t('petProfile.biologicalTimeline.today')
                : t('petProfile.biologicalTimeline.yearsFromNow', { years: yearsAhead })}
            </span>
          </div>
          <Slider
            value={[yearsAhead]}
            onValueChange={(v) => setYearsAhead(v[0])}
            min={0}
            max={maxSlider}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{t('petProfile.biologicalTimeline.today')}</span>
            <span>{petAge + Math.floor(maxSlider / 2)}{t('petProfile.biologicalTimeline.yearsShort')}</span>
            <span>{petAge + maxSlider}{t('petProfile.biologicalTimeline.yearsShort')}</span>
          </div>
        </div>

        {/* Projected conditions list */}
        {yearsAhead > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Info className="h-3 w-3 text-primary" />
              {t('petProfile.biologicalTimeline.atAgeProjection', { age: current.ageAtYear.toFixed(0) })}
            </p>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {current.existingConditions.map(c => {
                const baselineCondition = projections[0].existingConditions.find(b => b.id === c.id);
                const worsened = baselineCondition && c.projectedSeverityScore > baselineCondition.projectedSeverityScore + 0.05;
                return (
                  <div key={c.id} className="rounded-md border bg-card px-2 py-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          c.projectedSeverityLabel === 'severe' ? 'bg-red-500' :
                          c.projectedSeverityLabel === 'moderate' ? 'bg-orange-400' : 'bg-yellow-400'
                        }`} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {t(`petProfile.severity.${c.projectedSeverityLabel}`, c.projectedSeverityLabel)}
                        </Badge>
                        {worsened && (
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 inline-flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                            +{c.deltaPercent}%
                          </span>
                        )}
                        {withIntervention && c.kgCovered && c.anchorCompounds.length > 0 && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                            ★ −{Math.round(c.protectionApplied * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {withIntervention && c.kgCovered && c.anchorCompounds.length > 0 && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 ml-4">
                        {c.anchorCompounds.join(' • ')}
                      </p>
                    )}
                    {withIntervention && !c.kgCovered && (
                      <p className="text-[10px] text-muted-foreground italic mt-0.5 ml-4">
                        {t('petProfile.biologicalTimeline.noProtection')}
                      </p>
                    )}
                  </div>
                );
              })}
              {current.newConditions.slice(0, 6).map(c => (
                <div
                  key={c.conditionId}
                  className="flex items-center justify-between rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-300">
                      {t('petProfile.biologicalTimeline.newRisk')}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-100 dark:bg-amber-900/40 border-amber-300">
                    {Math.round(c.probability * 100)}%
                  </Badge>
                </div>
              ))}
              {current.existingConditions.length === 0 && current.newConditions.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  {t('petProfile.biologicalTimeline.noProjectedRisks')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Caveats panel */}
        {caveats.length > 0 && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 p-2 space-y-1">
            <p className="text-[11px] font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {t('petProfile.biologicalTimeline.caveatsTitle')}
            </p>
            <ul className="space-y-0.5">
              {caveats.map((cv, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  <span>{cv.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Methodology disclaimer */}
        <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 p-2 text-[10px] text-muted-foreground space-y-1">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('petProfile.biologicalTimeline.disclaimerTitle')}:</strong>{' '}
              {aiSource === 'ai'
                ? t('petProfile.biologicalTimeline.disclaimerBodyAi')
                : t('petProfile.biologicalTimeline.disclaimerBody')}
            </span>
          </p>
          {!hasBreedData && !breedLoading && (
            <p className="text-amber-700 dark:text-amber-400">
              {t('petProfile.biologicalTimeline.noBreedData', { breed: petBreed })}
            </p>
          )}
          {hasBreedData && noPredispositions && (
            <p className="text-amber-700 dark:text-amber-400">
              {t('petProfile.biologicalTimeline.noPredispositionsForBreed')}
            </p>
          )}
        </div>

        {/* AI evidence citations */}
        {aiSource === 'ai' && aiCitations.length > 0 && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 p-2 space-y-1.5">
            <p className="text-[11px] font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <BookOpen className="h-3 w-3" />
              {t('petProfile.biologicalTimeline.evidenceUsed', { count: aiCitations.length })}
            </p>
            <ul className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {aiCitations.slice(0, 6).map((c, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 flex-shrink-0 bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-300"
                  >
                    {t(`petProfile.biologicalTimeline.citationType.${c.type}`, c.type)}
                  </Badge>
                  <span className="leading-tight">{c.summary}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clinical debug panel */}
        <div className="border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-6 w-full justify-between"
            onClick={() => setShowDebug(s => !s)}
          >
            <span className="flex items-center gap-1">
              <FlaskConical className="h-3 w-3" />
              {showDebug ? t('petProfile.biologicalTimeline.hideDebug') : t('petProfile.biologicalTimeline.showDebug')}
            </span>
            {showDebug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {showDebug && (
            <div className="rounded-md border bg-muted/20 p-2 mt-1 space-y-1 text-[10px] font-mono">
              <p>KG entries: {kgCoverage.length} / Compounds: {protocolCompoundCount}</p>
              <p>Coverage ratio: {(coverageRatio * 100).toFixed(0)}%</p>
              <p>Years gained (heuristic): {yearsGainedLocal.toFixed(2)}</p>
              {aiYearsGained != null && <p>Years gained (AI): {aiYearsGained.toFixed(2)}</p>}
              <p>Source: {aiSource}</p>
              <p>Lifespan: {lifespan}y / Size: {sizeCategory || 'unknown'}</p>
              {kgCoverage.slice(0, 5).map((c, i) => (
                <p key={i} className="truncate">
                  {c.conditionKey}: {c.compounds.map(co => `${co.name}(${co.efficacy_0_5})`).join(', ')}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BiologicalTimeline;
