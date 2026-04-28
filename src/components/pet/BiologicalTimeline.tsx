import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dna, Activity, Sparkles, AlertTriangle, FlaskConical, Info, TrendingUp, TrendingDown, Heart, BrainCircuit, BookOpen, Loader2 } from 'lucide-react';
import dogSilhouette from '@/assets/dog-silhouette.png';
import {
  buildBiologicalTimeline,
  type ActiveConditionInput,
  type YearProjection,
} from '@/services/biological-timeline-engine';
import { useBreedPredispositionsForPet } from '@/hooks/useBreedPredispositionsForPet';
import { usePetTrajectoryProjection } from '@/hooks/usePetTrajectoryProjection';

// Same body region map as the legacy DigitalTwinDog (kept for visual continuity)
const bodyRegionMap: Record<string, { x: number; y: number; region: string }> = {
  'osteoarthritis': { x: 30, y: 75, region: 'joints' },
  'arthritis': { x: 30, y: 75, region: 'joints' },
  'osteoartrite': { x: 30, y: 75, region: 'joints' },
  'hip dysplasia': { x: 20, y: 55, region: 'hip' },
  'displasia coxofemoral': { x: 20, y: 55, region: 'hip' },
  'elbow dysplasia': { x: 72, y: 65, region: 'elbow' },
  'intervertebral disc disease': { x: 45, y: 25, region: 'spine' },
  'spondylosis': { x: 40, y: 25, region: 'spine' },
  'canine cognitive dysfunction': { x: 85, y: 15, region: 'brain' },
  'cognitive dysfunction': { x: 85, y: 15, region: 'brain' },
  'disfunção cognitiva': { x: 85, y: 15, region: 'brain' },
  'epilepsy': { x: 85, y: 15, region: 'brain' },
  'dilated cardiomyopathy': { x: 65, y: 40, region: 'heart' },
  'mitral valve disease': { x: 65, y: 40, region: 'heart' },
  'heart disease': { x: 65, y: 40, region: 'heart' },
  'cardiomiopatia': { x: 65, y: 40, region: 'heart' },
  'hepatic lipidosis': { x: 50, y: 45, region: 'liver' },
  'liver disease': { x: 50, y: 45, region: 'liver' },
  'chronic kidney disease': { x: 35, y: 40, region: 'kidney' },
  'renal failure': { x: 35, y: 40, region: 'kidney' },
  'doença renal': { x: 35, y: 40, region: 'kidney' },
  'hypothyroidism': { x: 78, y: 35, region: 'thyroid' },
  'diabetes': { x: 48, y: 48, region: 'pancreas' },
  "cushing's disease": { x: 45, y: 35, region: 'adrenal' },
  'atopic dermatitis': { x: 50, y: 60, region: 'skin' },
  'allergies': { x: 50, y: 60, region: 'skin' },
  'cataracts': { x: 88, y: 18, region: 'eyes' },
  'progressive retinal atrophy': { x: 88, y: 18, region: 'eyes' },
  'inflammatory bowel disease': { x: 45, y: 55, region: 'gi' },
  'pancreatitis': { x: 48, y: 48, region: 'pancreas' },
  'cellular senescence': { x: 50, y: 30, region: 'systemic' },
  'oxidative stress': { x: 50, y: 30, region: 'systemic' },
  'chronic inflammation': { x: 50, y: 30, region: 'systemic' },
  'cancer': { x: 50, y: 30, region: 'systemic' },
  'brachycephalic syndrome': { x: 90, y: 22, region: 'respiratory' },
  'laryngeal paralysis': { x: 80, y: 30, region: 'respiratory' },
};

const severityPulseColors: Record<string, string> = {
  mild: 'bg-yellow-400',
  moderate: 'bg-orange-400',
  severe: 'bg-red-500',
};

const severityRingColors: Record<string, string> = {
  mild: 'ring-yellow-400/50',
  moderate: 'ring-orange-400/50',
  severe: 'ring-red-500/50',
};

function findRegion(name: string) {
  const key = name.toLowerCase();
  const match = Object.entries(bodyRegionMap).find(([k]) => key.includes(k));
  return match ? match[1] : { x: 50, y: 30, region: 'systemic' };
}

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
  const [withIntervention, setWithIntervention] = useState(false);

  // Phase 2: AI-grounded projection (Gemini 2.5 Pro + KG + breed predispositions).
  // Falls back to the heuristic engine while loading or on error.
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

  const projections = useMemo(() => {
    const heuristic = buildBiologicalTimeline({
      currentAgeYears: petAge,
      averageLifespanYears: lifespan,
      sizeCategory,
      averageWeightKg: weightKg,
      activeConditions: activeConditionInputs,
      breedPredispositions: breedCtx?.predispositions || [],
      withIntervention,
    });
    if (!aiYears || aiYears.length === 0) return heuristic;
    // Map AI years onto the YearProjection structure used by the UI.
    return aiYears.map<YearProjection>((y, idx) => ({
      year: y.year,
      ageAtYear: y.age_at_year,
      biologicalAge: y.biological_age,
      existingConditions: (y.existing_conditions || []).map(ec => ({
        id: `${ec.name}-${idx}`,
        name: ec.name,
        currentSeverity: (heuristic[0]?.existingConditions.find(h => h.name.toLowerCase() === ec.name.toLowerCase())?.currentSeverity) || 'mild',
        projectedSeverityScore: ec.projected_severity_score,
        projectedSeverityLabel: ec.projected_severity_label,
        deltaPercent: 0,
      })),
      newConditions: (y.new_conditions || []).map(nc => ({
        conditionId: nc.name,
        name: nc.name,
        probability: nc.probability,
        evidenceGrade: (nc.evidence_grade as any) || 'moderate',
        riskFactor: 1,
      })),
      expectedRemainingYears: y.expected_remaining_years,
    }));
  }, [petAge, lifespan, sizeCategory, weightKg, activeConditionInputs, breedCtx?.predispositions, withIntervention, aiYears]);

  const maxSlider = projections.length > 0 ? projections[projections.length - 1].year : 8;
  const safeIndex = Math.min(yearsAhead, projections.length - 1);
  const current = projections[safeIndex];
  const baseline = projections[0];

  // For comparison: with vs without intervention at same year (to show "years gained")
  const counterfactual = useMemo(() => {
    const opposite = buildBiologicalTimeline({
      currentAgeYears: petAge,
      averageLifespanYears: lifespan,
      sizeCategory,
      averageWeightKg: weightKg,
      activeConditions: activeConditionInputs,
      breedPredispositions: breedCtx?.predispositions || [],
      withIntervention: !withIntervention,
    });
    return opposite[Math.min(yearsAhead, opposite.length - 1)];
  }, [petAge, lifespan, sizeCategory, weightKg, activeConditionInputs, breedCtx?.predispositions, withIntervention, yearsAhead]);

  const yearsGainedLocal = withIntervention
    ? current?.expectedRemainingYears - counterfactual?.expectedRemainingYears
    : counterfactual?.expectedRemainingYears - current?.expectedRemainingYears;
  // Prefer AI's calculated years_gained when available (it's per-condition KG-grounded).
  const yearsGained = aiYearsGained != null ? aiYearsGained : yearsGainedLocal;

  // Conditions to render on the silhouette at the current slider position
  const silhouetteMarkers = useMemo(() => {
    if (!current) return [];
    const existingMarkers = current.existingConditions.map(c => ({
      key: `existing-${c.id}`,
      label: c.name,
      severity: c.projectedSeverityLabel,
      isNew: false,
      probability: 1,
      region: findRegion(c.name),
    }));
    const newMarkers = current.newConditions
      .filter(c => c.probability >= 0.25)
      .map(c => ({
        key: `new-${c.conditionId}`,
        label: c.name,
        severity: 'mild' as const,
        isNew: true,
        probability: c.probability,
        region: findRegion(c.name),
      }));
    return [...existingMarkers, ...newMarkers];
  }, [current]);

  // Group markers by region
  const groupedMarkers = useMemo(() => {
    const map = new Map<string, typeof silhouetteMarkers>();
    silhouetteMarkers.forEach(m => {
      const arr = map.get(m.region.region) || [];
      arr.push(m);
      map.set(m.region.region, arr);
    });
    return Array.from(map.entries());
  }, [silhouetteMarkers]);

  if (!current) return null;

  const hasBreedData = !!breedCtx?.breed;
  const noPredispositions = (breedCtx?.predispositions.length || 0) === 0;

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

        {/* Silhouette with markers */}
        <div className="relative w-full max-w-[420px] mx-auto">
          <img
            src={dogSilhouette}
            alt={t('petProfile.biologicalTimeline.silhouetteAlt')}
            className="w-full h-auto opacity-40 dark:opacity-25 dark:invert"
          />
          <TooltipProvider delayDuration={100}>
            {groupedMarkers.map(([region, markers]) => {
              const pos = markers[0].region;
              const worst = markers.reduce((w, m) => {
                const order = ['mild', 'moderate', 'severe'];
                return order.indexOf(m.severity) > order.indexOf(w) ? m.severity : w;
              }, 'mild');
              const hasNew = markers.some(m => m.isNew);
              return (
                <Tooltip key={region}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute cursor-pointer"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className={`absolute inset-0 rounded-full animate-ping opacity-30 ${severityPulseColors[worst]}`}
                        style={{ width: 24, height: 24, margin: '-4px' }}
                      />
                      <div
                        className={`relative w-4 h-4 rounded-full ring-2 ${severityPulseColors[worst]} ${severityRingColors[worst]} shadow-lg flex items-center justify-center`}
                      >
                        {markers.length > 1 && (
                          <span className="text-[8px] text-white font-bold">{markers.length}</span>
                        )}
                        {hasNew && markers.length === 1 && (
                          <Sparkles className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold capitalize flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {t(`petProfile.digitalTwin.regions.${region}`, region)}
                      </p>
                      {markers.map(m => (
                        <div key={m.key} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${severityPulseColors[m.severity]}`} />
                          <span className="text-xs">{m.label}</span>
                          {m.isNew ? (
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-amber-600 border-amber-300">
                              {Math.round(m.probability * 100)}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                              {t(`petProfile.severity.${m.severity}`, m.severity)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
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

          {/* Intervention toggle */}
          <div className="flex items-center justify-between rounded-md border bg-muted/20 p-2 mt-2">
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${withIntervention ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <Label className="text-xs cursor-pointer" htmlFor="intervention-toggle">
                {t('petProfile.biologicalTimeline.withInterventionLabel')}
              </Label>
            </div>
            <Switch
              id="intervention-toggle"
              checked={withIntervention}
              onCheckedChange={setWithIntervention}
            />
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
              {/* Existing conditions progression */}
              {current.existingConditions.map(c => {
                const baselineCondition = baseline.existingConditions.find(b => b.id === c.id);
                const worsened = baselineCondition && c.projectedSeverityScore > baselineCondition.projectedSeverityScore + 0.05;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityPulseColors[c.projectedSeverityLabel]}`} />
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
                    </div>
                  </div>
                );
              })}
              {/* Emergent (predisposition-driven) conditions */}
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-100 dark:bg-amber-900/40 border-amber-300">
                      {Math.round(c.probability * 100)}%
                    </Badge>
                  </div>
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

        {/* Methodology disclaimer */}
        <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 p-2 text-[10px] text-muted-foreground space-y-1">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('petProfile.biologicalTimeline.disclaimerTitle')}:</strong>{' '}
              {t('petProfile.biologicalTimeline.disclaimerBody')}
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
      </CardContent>
    </Card>
  );
};

export default BiologicalTimeline;
