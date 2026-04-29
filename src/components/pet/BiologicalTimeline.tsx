import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dna, Sparkles, AlertTriangle, FlaskConical, Info, TrendingUp, TrendingDown,
  Heart, BrainCircuit, BookOpen, Loader2, ShieldCheck, ChevronDown, ChevronUp, Lock,
} from 'lucide-react';
import { useBreedPredispositionsForPet } from '@/hooks/useBreedPredispositionsForPet';
import { usePetTrajectoryProjection, type AIProjectionYear } from '@/hooks/usePetTrajectoryProjection';
import { usePetClinicalAnalysisSnapshot } from '@/hooks/usePetClinicalAnalysisSnapshot';
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
  onRequestAnalysis?: () => void;
  isAnalyzing?: boolean;
}

interface CompactProj {
  year: number;
  ageAtYear: number;
  biologicalAge: number;
  expectedRemainingYears: number;
  existing: Array<{ name: string; severity: Severity; protectedHere: boolean }>;
  emerging: Array<{ name: string; probability: number }>;
}

function buildRegionStates(
  proj: CompactProj | undefined,
  protectionActive: boolean,
): { states: Partial<Record<AnatomyRegionId, RegionState>>; systemic: Severity | null } {
  const states: Partial<Record<AnatomyRegionId, RegionState>> = {};
  let systemic: Severity | null = null;
  if (!proj) return { states, systemic };

  const order: Severity[] = ['mild', 'moderate', 'severe'];
  const upgrade = (cur: Severity | null, next: Severity): Severity =>
    !cur ? next : (order.indexOf(next) > order.indexOf(cur) ? next : cur);

  const apply = (name: string, severity: Severity, isNew: boolean, prob: number | undefined, protectedHere: boolean) => {
    const mapping = mapConditionToRegions(name);
    if (mapping.systemic) systemic = upgrade(systemic, severity);
    for (const region of mapping.regions) {
      if (region === 'systemic') continue;
      const prev = states[region];
      const conditions = prev?.conditions || [];
      conditions.push({ name, severity, isNew, probability: prob, protectedBy: protectedHere ? ['protocol'] : [] });
      states[region] = {
        severity: upgrade(prev?.severity ?? null, severity),
        isNew: prev?.isNew || isNew,
        protected: prev?.protected || (protectionActive && protectedHere),
        conditions,
      };
    }
  };

  for (const c of proj.existing) apply(c.name, c.severity, false, undefined, c.protectedHere);
  for (const c of proj.emerging) {
    if (c.probability < 0.2) continue;
    const sev: Severity = c.probability >= 0.6 ? 'moderate' : 'mild';
    apply(c.name, sev, true, c.probability, false);
  }
  return { states, systemic };
}

const SEV_DOT: Record<Severity, string> = {
  mild: 'bg-yellow-400',
  moderate: 'bg-orange-400',
  severe: 'bg-red-500',
};

function scoreToSeverity(score: number): Severity {
  if (score >= 0.75) return 'severe';
  if (score >= 0.4) return 'moderate';
  return 'mild';
}

function compactYear(
  y: AIProjectionYear,
  coveredNames: Set<string>,
): CompactProj {
  const lowerCovered = new Set(Array.from(coveredNames).map(n => n.toLowerCase()));
  return {
    year: y.year,
    ageAtYear: y.age_at_year,
    biologicalAge: y.biological_age,
    expectedRemainingYears: y.expected_remaining_years,
    existing: (y.existing_conditions || []).map(ec => ({
      name: ec.name,
      severity: (ec.projected_severity_label as Severity) || scoreToSeverity(ec.projected_severity_score || 0),
      protectedHere: lowerCovered.has(ec.name.toLowerCase()),
    })),
    emerging: (y.new_conditions || []).map(nc => ({ name: nc.name, probability: nc.probability })),
  };
}

const ConditionsMiniList: React.FC<{
  proj: CompactProj | undefined;
  tone: 'neutral' | 'protected';
  emptyLabel: string;
  t: (k: string, opts?: any) => string;
}> = ({ proj, tone, emptyLabel, t }) => {
  if (!proj) return null;
  const items: Array<{ key: string; name: string; kind: 'existing' | 'new'; severity?: Severity; probability?: number; protectedHere?: boolean }> = [];
  for (const c of proj.existing) items.push({ key: `e-${c.name}`, name: c.name, kind: 'existing', severity: c.severity, protectedHere: tone === 'protected' && c.protectedHere });
  for (const c of proj.emerging) {
    if (c.probability < 0.25) continue;
    items.push({ key: `n-${c.name}`, name: c.name, kind: 'new', probability: c.probability });
  }
  if (items.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-1">{emptyLabel}</p>;
  const visible = items.slice(0, 8);
  const extra = items.length - visible.length;
  return (
    <ul className="space-y-1 mt-1">
      {visible.map(it => (
        <li key={it.key} className="flex items-center gap-2 text-xs leading-tight">
          {it.kind === 'existing' && it.severity ? (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[it.severity]}`} />
          ) : (
            <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
          )}
          <span className="flex-1 truncate text-foreground/90">{it.name}</span>
          {it.kind === 'existing' && it.severity && (
            <span className="text-[10px] text-muted-foreground">{t(`petProfile.severity.${it.severity}`, it.severity)}</span>
          )}
          {it.kind === 'new' && it.probability != null && (
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">{Math.round(it.probability * 100)}%</span>
          )}
          {it.protectedHere && <span className="text-emerald-600 dark:text-emerald-400 text-xs">★</span>}
        </li>
      ))}
      {extra > 0 && <li className="text-[10px] text-muted-foreground italic text-center pt-1">+{extra} {t('petProfile.biologicalTimeline.moreConditions', 'mais')}</li>}
    </ul>
  );
};

const BiologicalTimeline: React.FC<BiologicalTimelineProps> = ({
  conditions, petName, petBreed, petAge, petId, onRequestAnalysis, isAnalyzing,
}) => {
  const { t } = useTranslation();
  const { data: breedCtx, isLoading: breedLoading } = useBreedPredispositionsForPet(petBreed);
  const { data: snapshot, isLoading: snapshotLoading } = usePetClinicalAnalysisSnapshot(petId || null);

  const [yearsAhead, setYearsAhead] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const recommendedCompoundNames = useMemo(() => {
    if (!snapshot || snapshot.status !== 'complete') return null;
    return (snapshot.recommendation_compounds || [])
      .map((c: any) => c?.name)
      .filter((n: any) => typeof n === 'string' && n.trim().length > 0);
  }, [snapshot]);

  const hasSnapshot = !!snapshot && snapshot.status === 'complete';

  // Only call the AI projection when we have a real analysis snapshot.
  const aiQuery = usePetTrajectoryProjection(
    petId || null,
    recommendedCompoundNames,
    !!petId && hasSnapshot,
  );
  const projection = aiQuery.data?.projection;
  const aiCitations = aiQuery.data?.citations || [];
  const aiConfidence = projection?.confidence || aiQuery.data?.confidence || null;
  const aiYearsGained = aiQuery.data?.years_gained ?? null;
  const coverage = projection?.coverage_by_condition || aiQuery.data?.coverage_by_condition || [];
  const coveredCount = coverage.filter((c: any) => c?.kg_covered).length;
  const totalCovered = coverage.length || 0;
  const caveats = projection?.protocol_caveats || aiQuery.data?.protocol_caveats || [];

  const yearsWith = (projection?.years_with_protocol || aiQuery.data?.years_with_protocol || projection?.years || []) as AIProjectionYear[];
  const yearsWithout = (projection?.years_without_protocol || aiQuery.data?.years_without_protocol || projection?.years || []) as AIProjectionYear[];

  const coveredNames = useMemo(
    () => new Set(coverage.filter((c: any) => c?.kg_covered).map((c: any) => String(c.condition || ''))),
    [coverage],
  );

  const maxSlider = yearsWith.length > 0 ? yearsWith[yearsWith.length - 1].year : 8;
  const safeIndex = Math.min(yearsAhead, Math.max(yearsWith.length, yearsWithout.length) - 1);

  const projWith = yearsWith[safeIndex] ? compactYear(yearsWith[safeIndex], coveredNames) : undefined;
  const projWithout = yearsWithout[safeIndex] ? compactYear(yearsWithout[safeIndex], new Set()) : undefined;

  const lifespan = breedCtx?.breed?.average_lifespan_years || 12;
  const current = projWith || projWithout;

  const yearsGainedLocal = (projWith?.expectedRemainingYears || 0) - (projWithout?.expectedRemainingYears || 0);
  const yearsGained = aiYearsGained != null ? aiYearsGained : yearsGainedLocal;

  const regionsWith = useMemo(() => buildRegionStates(projWith, true), [projWith]);
  const regionsWithout = useMemo(() => buildRegionStates(projWithout, false), [projWithout]);

  const noKgBenefit = hasSnapshot && totalCovered > 0 && coveredCount === 0;

  // ──────────────────────────────────────────────────────────────────────────
  // Locked state: no snapshot yet
  // ──────────────────────────────────────────────────────────────────────────
  if (!hasSnapshot) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            {t('petProfile.biologicalTimeline.title')}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t('petProfile.biologicalTimeline.subtitle', { name: petName, breed: petBreed, age: petAge })}
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t('petProfile.biologicalTimeline.lockedTitle', 'Aguardando análise VetGraphRAG')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('petProfile.biologicalTimeline.lockedBody', 'A projeção de trajetória biológica só é gerada após a análise VetGraphRAG, para que o cenário "com protocolo" reflita o stack realmente recomendado para este pet.')}
              </p>
              {onRequestAnalysis && (
                <Button
                  size="sm"
                  onClick={onRequestAnalysis}
                  disabled={!!isAnalyzing}
                  className="mt-2 h-7 text-xs"
                >
                  {isAnalyzing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                  {isAnalyzing
                    ? t('petRegistration.profile.analyzing', 'Analisando...')
                    : t('petRegistration.profile.analyzeWithKG', 'Executar análise VetGraphRAG')}
                </Button>
              )}
            </div>
          </div>
          {snapshotLoading && (
            <p className="text-[10px] text-muted-foreground italic text-center">
              {t('common.loading', 'Carregando...')}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Loading the projection from the AI
  // ──────────────────────────────────────────────────────────────────────────
  if (aiQuery.isLoading || !current) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            {t('petProfile.biologicalTimeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('petProfile.biologicalTimeline.aiLoading', 'Calculando trajetória...')}
        </CardContent>
      </Card>
    );
  }

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
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400 text-[10px] whitespace-nowrap">
            <BrainCircuit className="h-3 w-3 mr-1" />
            {snapshot?.completed_at
              ? t('petProfile.biologicalTimeline.basedOnAnalysis', { when: new Date(snapshot.completed_at).toLocaleString() })
              : t('petProfile.biologicalTimeline.aiBadge', { confidence: aiConfidence ? t(`petProfile.biologicalTimeline.confidence.${aiConfidence}`) : '' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 lg:p-6 space-y-5">
        {/* Vital stats row — 4 columns on lg, prominent typography */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('petProfile.biologicalTimeline.biologicalAge')}</p>
            <p className="text-2xl font-semibold mt-1">
              {current.biologicalAge.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {current.biologicalAge > current.ageAtYear ? (
                <span className="text-orange-600 dark:text-orange-400 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />+{(current.biologicalAge - current.ageAtYear).toFixed(1)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" />{(current.biologicalAge - current.ageAtYear).toFixed(1)}
                </span>
              )} {t('petProfile.biologicalTimeline.vsChrono')}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('petProfile.biologicalTimeline.chronologicalAge')}</p>
            <p className="text-2xl font-semibold mt-1">
              {current.ageAtYear.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{t('petProfile.biologicalTimeline.breedLifespan', { years: lifespan })}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />{t('petProfile.biologicalTimeline.remainingYears')}
            </p>
            <p className="text-2xl font-semibold mt-1">
              {current.expectedRemainingYears.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            {Math.abs(yearsGained) >= 0.1 && (
              <p className={`text-[11px] mt-1 ${yearsGained > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {yearsGained > 0 ? '+' : ''}{yearsGained.toFixed(1)} {t('petProfile.biologicalTimeline.withProtocol')}
              </p>
            )}
          </div>
          <div className="rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />{t('petProfile.biologicalTimeline.kpiGain', 'Ganho com protocolo')}
            </p>
            <p className="text-2xl font-semibold mt-1 text-emerald-700 dark:text-emerald-400">
              {yearsGained > 0 ? '+' : ''}{yearsGained.toFixed(1)}
              <span className="text-sm text-emerald-700/70 dark:text-emerald-400/70 ml-1">{t('petProfile.biologicalTimeline.yearsShort')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalCovered > 0
                ? t('petProfile.biologicalTimeline.coverage', { covered: coveredCount, total: totalCovered })
                : t('petProfile.biologicalTimeline.kpiGainHint', 'baseado na cobertura KG')}
            </p>
          </div>
        </div>

        {noKgBenefit && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {t('petProfile.biologicalTimeline.noBenefitBanner', 'Para este pet, o protocolo geroprotetor NÃO altera a trajetória: nenhuma das condições/predisposições tem evidência KG suficiente no estado atual da base.')}
            </p>
          </div>
        )}

        {/* Main grid: dogs comparison (left) + clinical evidence panel (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT: Side-by-side anatomical compare (3/5) */}
          <div className="lg:col-span-3 rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t('petProfile.biologicalTimeline.compareTitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs bg-muted/40">{t('petProfile.biologicalTimeline.scenarioWithout', 'Sem protocolo')}</Badge>
                  <span className="text-xs text-muted-foreground">{projWithout?.expectedRemainingYears.toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort')}</span>
                </div>
                <div className="rounded-md bg-background border border-border/50 p-2 aspect-[4/3]">
                  <DogAnatomySVG regionStates={regionsWithout.states} systemicSeverity={regionsWithout.systemic} showProtectionAura={false} className="w-full h-full" />
                </div>
                <ConditionsMiniList proj={projWithout} tone="neutral" emptyLabel={t('petProfile.biologicalTimeline.noProjectedRisks')} t={t} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="h-3 w-3 mr-0.5" />{t('petProfile.biologicalTimeline.scenarioWith', 'Com protocolo')}
                  </Badge>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{projWith?.expectedRemainingYears.toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort')}</span>
                </div>
                <div className={`rounded-md bg-background border p-2 aspect-[4/3] ${noKgBenefit ? 'border-border/50' : 'border-emerald-200 dark:border-emerald-900/50'}`}>
                  <DogAnatomySVG regionStates={regionsWith.states} systemicSeverity={regionsWith.systemic} showProtectionAura={!noKgBenefit} className="w-full h-full" />
                </div>
                <ConditionsMiniList proj={projWith} tone="protected" emptyLabel={t('petProfile.biologicalTimeline.noProjectedRisks')} t={t} />
              </div>
            </div>
          </div>

          {/* RIGHT: Clinical evidence panel (2/5) */}
          <div className="lg:col-span-2 rounded-lg border bg-card p-4 space-y-4">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('petProfile.biologicalTimeline.evidencePanelTitle', 'Evidência clínica')}
            </p>

            {/* Coverage block */}
            {totalCovered > 0 && (
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('petProfile.biologicalTimeline.coverageTitle', 'Cobertura KG')}</p>
                <p className="text-lg font-semibold mt-0.5">{coveredCount}<span className="text-sm text-muted-foreground">/{totalCovered}</span></p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('petProfile.biologicalTimeline.coverageHint', 'condições com evidência específica para o stack proposto')}
                </p>
              </div>
            )}

            {/* Caveats */}
            {caveats.length > 0 && (
              <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 p-3 space-y-1.5">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />{t('petProfile.biologicalTimeline.caveatsTitle')}
                </p>
                <ul className="space-y-1">
                  {caveats.map((cv: any, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                      <span>{cv.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations */}
            {aiCitations.length > 0 && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 p-3 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="h-3.5 w-3.5" />{t('petProfile.biologicalTimeline.evidenceUsed', { count: aiCitations.length })}
                </p>
                <ul className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {aiCitations.slice(0, 12).map((c: any, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0 bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-300">
                        {t(`petProfile.biologicalTimeline.citationType.${c.type}`, { defaultValue: c.type })}
                      </Badge>
                      <span className="leading-snug">{c.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legend */}
            <div className="rounded-md border bg-muted/10 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{t('petProfile.biologicalTimeline.legendTitle', 'Legenda')}</p>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(48, 95%, 55%)' }} />{t('petProfile.severity.mild')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(25, 95%, 52%)' }} />{t('petProfile.severity.moderate')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(0, 80%, 52%)' }} />{t('petProfile.severity.severe')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full border border-dashed border-amber-500" />{t('petProfile.biologicalTimeline.legend.futureRisk', 'risco futuro')}</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">★ {t('petProfile.biologicalTimeline.legend.protected', 'protegido')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'hsl(0, 80%, 52%)', opacity: 0.3 }} />{t('petProfile.biologicalTimeline.legend.systemic', 'carga sistêmica')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time slider — full width */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <Label className="font-medium">{t('petProfile.biologicalTimeline.projectionLabel')}</Label>
            <span className="font-semibold text-primary text-base">
              {yearsAhead === 0 ? t('petProfile.biologicalTimeline.today') : t('petProfile.biologicalTimeline.yearsFromNow', { years: yearsAhead })}
            </span>
          </div>
          <Slider value={[yearsAhead]} onValueChange={(v) => setYearsAhead(v[0])} min={0} max={maxSlider} step={1} className="w-full" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            {Array.from({ length: 5 }).map((_, i) => {
              const step = Math.round((maxSlider * i) / 4);
              return (
                <span key={i} className={i === 0 ? 'font-medium text-foreground/70' : ''}>
                  {i === 0 ? t('petProfile.biologicalTimeline.today') : `${petAge + step}${t('petProfile.biologicalTimeline.yearsShort')}`}
                </span>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 p-3 text-[11px] text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('petProfile.biologicalTimeline.disclaimerTitle')}:</strong>{' '}
              {t('petProfile.biologicalTimeline.disclaimerBodyAi')}
            </span>
          </p>
        </div>

        {/* Debug */}
        <div className="border-t pt-2">
          <Button variant="ghost" size="sm" className="text-[10px] h-6 w-full justify-between" onClick={() => setShowDebug(s => !s)}>
            <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" />{showDebug ? t('petProfile.biologicalTimeline.hideDebug') : t('petProfile.biologicalTimeline.showDebug')}</span>
            {showDebug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {showDebug && (
            <div className="rounded-md border bg-muted/20 p-2 mt-1 space-y-1 text-[10px] font-mono">
              <p>Snapshot: {snapshot?.id?.slice(0, 8)} • compounds: {recommendedCompoundNames?.length || 0}</p>
              <p>Coverage: {coveredCount}/{totalCovered}</p>
              <p>Years gained (AI): {aiYearsGained ?? 'n/a'}</p>
              <p>Confidence: {aiConfidence || 'n/a'}</p>
              <p>Lifespan: {lifespan}y</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BiologicalTimeline;
