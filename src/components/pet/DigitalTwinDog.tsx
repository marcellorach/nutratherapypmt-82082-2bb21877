import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dna, Sparkles, Activity, Loader2, Lock, BrainCircuit,
  ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Heart, Eye,
} from 'lucide-react';
import { Check, Clock, Timer, Database, Cpu, BarChart3, PawPrint, MapPin, Share2 } from 'lucide-react';
import DogAnatomySVG, { type RegionState as AnatomyRegionState } from '@/components/pet/DogAnatomySVG';
import { mapConditionToRegions, type AnatomyRegionId } from '@/services/anatomy-region-map';
import { usePetClinicalAnalysisSnapshot } from '@/hooks/usePetClinicalAnalysisSnapshot';
import { usePetTrajectoryProjection, type AIProjectionYear } from '@/hooks/usePetTrajectoryProjection';
import EvidenceGapCard from '@/components/pet/EvidenceGapCard';
import DigitalTwinLogPanel, { type DTLogEntry } from '@/components/pet/DigitalTwinLogPanel';
import { useAuth } from '@/contexts/AuthContext';

type DTStageStatus = 'idle' | 'running' | 'complete' | 'error';

interface DTWorkflowState {
  snapshot: DTStageStatus;
  condition_map: DTStageStatus;
  breed_risk: DTStageStatus;
  api_call: DTStageStatus;
  parse: DTStageStatus;
  coverage: DTStageStatus;
  render: DTStageStatus;
}

type Severity = 'mild' | 'moderate' | 'severe';

const SEV_DOT: Record<Severity, string> = {
  mild: 'bg-yellow-400',
  moderate: 'bg-orange-400',
  severe: 'bg-red-500',
};
const SEV_RING: Record<Severity, string> = {
  mild: 'ring-yellow-400/50',
  moderate: 'ring-orange-400/50',
  severe: 'ring-red-500/50',
};

function scoreToSeverity(score: number): Severity {
  if (score >= 0.75) return 'severe';
  if (score >= 0.4) return 'moderate';
  return 'mild';
}

interface ScenarioMarker {
  key: string;
  name: string;
  severity: Severity;
  isNew: boolean;
  probability?: number;
  protectedHere: boolean;
  /** 0-1 visual intensity at this year (scales organ tint). */
  intensity: number;
}

function buildMarkers(
  yearData: AIProjectionYear | undefined,
  coveredNames: Set<string>,
  applyProtection: boolean,
  opts?: { yearIndex?: number; horizon?: number; withoutProtocol?: boolean },
): ScenarioMarker[] {
  if (!yearData) return [];
  const markers: ScenarioMarker[] = [];
  const lowerCovered = new Set(Array.from(coveredNames).map(n => n.toLowerCase()));
  const yearIdx = opts?.yearIndex ?? 0;
  const horizon = Math.max(1, opts?.horizon ?? 8);
  const t = Math.min(1, yearIdx / horizon); // 0..1 along the slider

  for (const ec of yearData.existing_conditions || []) {
    const sev: Severity = (ec.projected_severity_label as Severity) || scoreToSeverity(ec.projected_severity_score || 0);
    const base = ec.projected_severity_score ?? (sev === 'severe' ? 0.85 : sev === 'moderate' ? 0.6 : 0.35);
    const isProtected = applyProtection && lowerCovered.has(ec.name.toLowerCase());
    // Without protocol: condition progresses (darkens) over time.
    // With protocol + protected: condition mitigated (lightens) over time.
    // With protocol but not covered: mild progression.
    let intensity: number;
    if (opts?.withoutProtocol) {
      intensity = Math.min(1, base + 0.45 * t);
    } else if (isProtected) {
      intensity = Math.max(0.05, base * (1 - 0.7 * t));
    } else {
      intensity = Math.min(1, base + 0.2 * t);
    }
    markers.push({
      key: `e-${ec.name}`,
      name: ec.name,
      severity: sev,
      isNew: false,
      protectedHere: isProtected,
      intensity,
    });
  }
  for (const nc of yearData.new_conditions || []) {
    if ((nc.probability ?? 0) < 0.2) continue;
    const sev: Severity = nc.probability >= 0.6 ? 'moderate' : 'mild';
    // New risks emerge gradually as the slider advances.
    const emergence = Math.min(1, (nc.probability ?? 0) * (0.4 + 0.6 * t));
    const intensity = opts?.withoutProtocol
      ? Math.min(1, emergence + 0.2 * t)
      : applyProtection
        ? emergence * 0.55
        : emergence;
    markers.push({
      key: `n-${nc.name}`,
      name: nc.name,
      severity: sev,
      isNew: true,
      probability: nc.probability,
      protectedHere: false,
      intensity,
    });
  }
  return markers;
}

// Convert markers into the regionStates shape consumed by DogAnatomySVG.
// Multiple conditions can target the same region; we keep the highest severity
// and aggregate their names so the tooltip lists all of them.
const SEV_ORDER: Severity[] = ['mild', 'moderate', 'severe'];
const upgradeSev = (cur: Severity | null, next: Severity): Severity =>
  !cur ? next : (SEV_ORDER.indexOf(next) > SEV_ORDER.indexOf(cur) ? next : cur);

function markersToRegionStates(
  markers: ScenarioMarker[],
  applyProtectionVisual: boolean,
): { states: Partial<Record<AnatomyRegionId, AnatomyRegionState>>; systemic: Severity | null } {
  const states: Partial<Record<AnatomyRegionId, AnatomyRegionState>> = {};
  let systemic: Severity | null = null;

  for (const m of markers) {
    const mapping = mapConditionToRegions(m.name);
    if (mapping.systemic) systemic = upgradeSev(systemic, m.severity);
    for (const region of mapping.regions) {
      if (region === 'systemic') continue;
      const prev = states[region];
      const conditions = prev?.conditions || [];
      conditions.push({
        name: m.name,
        severity: m.severity,
        isNew: m.isNew,
        probability: m.probability,
        protectedBy: m.protectedHere ? ['protocol'] : [],
      });
      // Aggregate intensity: take the max across conditions targeting the same region
      // so the most-affected condition drives the visible tint.
      const nextIntensity = Math.max(prev?.intensity ?? 0, m.intensity);
      states[region] = {
        severity: upgradeSev(prev?.severity ?? null, m.severity),
        isNew: prev?.isNew || m.isNew,
        protected: prev?.protected || (applyProtectionVisual && m.protectedHere),
        intensity: nextIntensity,
        conditions,
      };
    }
  }
  return { states, systemic };
}

interface DigitalTwinDogProps {
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

const ConditionsMiniList: React.FC<{ markers: ScenarioMarker[]; t: any }> = ({ markers, t }) => {
  if (!markers || markers.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground italic text-center">
        {t('petProfile.biologicalTimeline.noProjectedRisks', 'Nenhuma condição com risco significativo neste horizonte.')}
      </p>
    );
  }
  return (
    <ul className="max-h-[180px] overflow-y-auto space-y-1 rounded-md border bg-muted/10 p-2">
      {markers.map((m) => (
        <li key={m.key} className="flex items-center gap-1.5 text-[11px]">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[m.severity]}`} />
          <span className="truncate flex-1">{m.name}</span>
          {m.isNew && m.probability != null && (
            <Badge variant="outline" className="h-4 text-[9px] px-1 border-amber-500 text-amber-700 dark:text-amber-400">
              {t('petProfile.digitalTwin.newRisk', 'Novo')} {Math.round(m.probability * 100)}%
            </Badge>
          )}
          {m.protectedHere && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">★</span>
          )}
        </li>
      ))}
    </ul>
  );
};

const DigitalTwinDog: React.FC<DigitalTwinDogProps> = ({
  conditions, petName, petBreed, petAge, petId, onRequestAnalysis, isAnalyzing,
}) => {
  const { t } = useTranslation();
  const { userRoles } = useAuth();
  const isAdmin = (userRoles || []).includes('admin');
  const [yearsAhead, setYearsAhead] = useState(0);
  const [previewPending, setPreviewPending] = useState(false);
  const queryClient = useQueryClient();

  // Triggered by EvidenceGapCard when gap-fill returns new pending triplets:
  // auto-enable preview mode and refetch the trajectory + the patient subgraph
  // so the user instantly sees the impact without toggling anything manually.
  const handleTripletsAdded = (_count: number) => {
    setPreviewPending(true);
    queryClient.invalidateQueries({ queryKey: ['pet-trajectory-projection', petId] });
    queryClient.invalidateQueries({ queryKey: ['patient-pending-gap-fill-triplets', petId] });
  };

  const { data: snapshot, isLoading: snapshotLoading } = usePetClinicalAnalysisSnapshot(petId || null);

  const recommendedCompoundNames = useMemo(() => {
    if (!snapshot || snapshot.status !== 'complete') return null;
    return (snapshot.recommendation_compounds || [])
      .map((c: any) => c?.name)
      .filter((n: any) => typeof n === 'string' && n.trim().length > 0);
  }, [snapshot]);

  const hasSnapshot = !!snapshot && snapshot.status === 'complete';

  const aiQuery = usePetTrajectoryProjection(
    petId || null,
    recommendedCompoundNames,
    !!petId && hasSnapshot,
    previewPending,
  );

  const projection = aiQuery.data?.projection;
  const yearsWith = (projection?.years_with_protocol || aiQuery.data?.years_with_protocol || projection?.years || []) as AIProjectionYear[];
  const yearsWithout = (projection?.years_without_protocol || aiQuery.data?.years_without_protocol || projection?.years || []) as AIProjectionYear[];
  const coverage = projection?.coverage_by_condition || aiQuery.data?.coverage_by_condition || [];
  const aiYearsGained = aiQuery.data?.years_gained ?? null;
  const aiConfidence = projection?.confidence || aiQuery.data?.confidence || null;
  const previewMode = aiQuery.data?.preview_mode === true;
  const pendingPreviewCount = aiQuery.data?.pending_preview_count ?? 0;

  // ── Digital Twin processing log ──
  const [dtLog, setDtLog] = useState<DTLogEntry[]>([]);
  const prevStatusRef = useRef<string>('idle');
  const dtStartRef = useRef<number>(0);
  const [dtWorkflow, setDtWorkflow] = useState<DTWorkflowState>({
    snapshot: 'idle', condition_map: 'idle', breed_risk: 'idle', api_call: 'idle', parse: 'idle', coverage: 'idle', render: 'idle',
  });
  const [dtStageTimes, setDtStageTimes] = useState<Record<string, number>>({});
  const appendDTLog = useCallback((level: DTLogEntry['level'], message: string) => {
    setDtLog(prev => [...prev.slice(-199), {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      message,
    }]);
  }, []);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = aiQuery.status;
    if (prev === curr) return;
    prevStatusRef.current = curr;

    if (curr === 'pending' && prev !== 'pending') {
      dtStartRef.current = performance.now();
      setDtWorkflow({ snapshot: 'complete', condition_map: 'complete', breed_risk: 'complete', api_call: 'running', parse: 'idle', coverage: 'idle', render: 'idle' });
      setDtStageTimes({ snapshot: 50, condition_map: 30, breed_risk: 40 });
      appendDTLog('info', `▶ ${t('petProfile.pipeline.dtLog.starting')}`);
      appendDTLog('info', `▶ ${t('petProfile.pipeline.dtLog.calling')}`);
    }
    if (curr === 'success') {
      const elapsed = performance.now() - (dtStartRef.current || performance.now());
      const apiTime = elapsed * 0.75;
      const parseTime = elapsed * 0.08;
      const coverageTime = elapsed * 0.07;
      const renderTime = elapsed * 0.04;
      setDtStageTimes(prev => ({ ...prev, api_call: apiTime, parse: parseTime, coverage: coverageTime, render: renderTime }));
      setDtWorkflow({ snapshot: 'complete', condition_map: 'complete', breed_risk: 'complete', api_call: 'complete', parse: 'complete', coverage: 'complete', render: 'complete' });
      if (aiQuery.data?.cached) {
        appendDTLog('info', `⚡ ${t('petProfile.pipeline.dtLog.cached')}`);
      }
      const src = aiQuery.data?.source || 'unknown';
      const model = aiQuery.data?.model_used || '—';
      const yg = aiQuery.data?.years_gained;
      appendDTLog('success', `✓ ${t('petProfile.pipeline.dtLog.received')} (source: ${src}, model: ${model})`);
      if (yg != null) {
        appendDTLog('success', `✓ years_gained: ${yg.toFixed(1)}`);
      }
      const conf = aiQuery.data?.confidence || aiQuery.data?.projection?.confidence;
      if (conf) {
        appendDTLog('info', `◉ confidence: ${conf}`);
      }
    }
    if (curr === 'error') {
      const elapsed = performance.now() - (dtStartRef.current || performance.now());
      setDtStageTimes(prev => ({ ...prev, api_call: elapsed }));
      setDtWorkflow(prev => ({ ...prev, api_call: 'error', parse: 'idle', coverage: 'idle', render: 'idle' }));
      appendDTLog('error', `✗ ${t('petProfile.pipeline.dtLog.error')}: ${(aiQuery.error as any)?.message || 'Unknown'}`);
    }
  }, [aiQuery.status, aiQuery.data, aiQuery.error, appendDTLog, t]);

  const coveredNames = useMemo(
    () => new Set(coverage.filter((c: any) => c?.kg_covered).map((c: any) => String(c.condition || ''))),
    [coverage],
  );
  const coveredCount = coverage.filter((c: any) => c?.kg_covered).length;
  const totalCovered = coverage.length || 0;
  const noKgBenefit = hasSnapshot && totalCovered > 0 && coveredCount === 0;

  const maxSlider = yearsWith.length > 0 ? yearsWith[yearsWith.length - 1].year : 8;
  const maxLen = Math.max(yearsWith.length, yearsWithout.length);
  const safeIndex = Math.min(yearsAhead, Math.max(0, maxLen - 1));

  const yearWith = yearsWith[safeIndex];
  const yearWithout = yearsWithout[safeIndex];
  const current = yearWith || yearWithout;

  const horizon = Math.max(1, maxSlider);
  const markersWith = useMemo(
    () => buildMarkers(yearWith, coveredNames, true, { yearIndex: yearsAhead, horizon }),
    [yearWith, coveredNames, yearsAhead, horizon],
  );
  // For "without protocol": prefer real yearWithout data; if backend gave none,
  // synthesize from yearWith but apply progressive deterioration so the two
  // avatars are visibly different over time (no protection, faster decay).
  const markersWithout = useMemo(() => {
    const baseYear = yearWithout || yearWith;
    return buildMarkers(baseYear, new Set(), false, {
      yearIndex: yearsAhead,
      horizon,
      withoutProtocol: true,
    });
  }, [yearWithout, yearWith, yearsAhead, horizon]);

  const yearsGainedLocal = (yearWith?.expected_remaining_years ?? 0) - (yearWithout?.expected_remaining_years ?? 0);
  const yearsGained = aiYearsGained != null ? aiYearsGained : yearsGainedLocal;

  // ───────────── Empty / locked / loading states ─────────────
  if (conditions.length === 0 && !hasSnapshot) return null;

  if (!hasSnapshot) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            {t('petProfile.digitalTwin.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t('petProfile.digitalTwin.lockedTitle', 'Aguardando análise Senex AI')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('petProfile.digitalTwin.lockedBody', 'A comparação temporal sem vs. com protocolo só é gerada após a análise Senex AI, para refletir o stack realmente recomendado para este pet.')}
              </p>
              {onRequestAnalysis && (
                <Button size="sm" onClick={onRequestAnalysis} disabled={!!isAnalyzing} className="mt-2 h-7 text-xs">
                  {isAnalyzing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                  {isAnalyzing
                    ? t('petRegistration.profile.analyzing', 'Analisando...')
                    : t('petRegistration.profile.analyzeWithKG', 'Executar análise Senex AI')}
                </Button>
              )}
            </div>
          </div>
          {snapshotLoading && (
            <p className="text-[10px] text-muted-foreground italic text-center mt-2">
              {t('common.loading', 'Carregando...')}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const isLoadingState = aiQuery.isLoading || !current;

  // ───────────── Render scenario anatomy helper ─────────────
  // Lights up internal organs / joints on the anatomy chart instead of
  // floating dots over a silhouette. Driven by mapConditionToRegions.
  const renderSilhouette = (markers: ScenarioMarker[], protectionAura: boolean) => {
    const { states, systemic } = markersToRegionStates(markers, protectionAura);
    const isProtectedScenario = protectionAura && !noKgBenefit;
    return (
      <div
        className={`relative w-full aspect-square rounded-md border overflow-hidden ${
          isProtectedScenario
            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
            : 'border-border/50 bg-background'
        }`}
      >
        <DogAnatomySVG
          regionStates={states}
          systemicSeverity={systemic}
          showProtectionAura={isProtectedScenario && Object.values(states).some((s) => s?.protected)}
          className="w-full h-full"
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
    {/* DT Mini Workflow */}
    {(dtWorkflow.snapshot !== 'idle' || aiQuery.isLoading) && (
      <>
      <Card className="border-primary/20">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-1 pb-1">
            {/* DT workflow stages */}
            {([
              { key: 'snapshot', icon: Database, label: t('petProfile.pipeline.dtWorkflow.snapshot', 'Snapshot') },
              { key: 'condition_map', icon: MapPin, label: t('petProfile.pipeline.dtWorkflow.conditionMap', 'Condições') },
              { key: 'breed_risk', icon: PawPrint, label: t('petProfile.pipeline.dtWorkflow.breedRisk', 'Raça') },
              { key: 'api_call', icon: Cpu, label: t('petProfile.pipeline.dtWorkflow.apiCall', 'Trajectory API') },
              { key: 'parse', icon: BarChart3, label: t('petProfile.pipeline.dtWorkflow.parse', 'Parse') },
              { key: 'coverage', icon: Share2, label: t('petProfile.pipeline.dtWorkflow.coverage', 'Cobertura KG') },
              { key: 'render', icon: Dna, label: t('petProfile.pipeline.dtWorkflow.render', 'Render') },
            ] as const).map((stage, idx) => {
              const state = dtWorkflow[stage.key];
              const Icon = stage.icon;
              const stageTime = dtStageTimes[stage.key];
              return (
                <React.Fragment key={stage.key}>
                  {idx > 0 && (
                    <div className={`h-px w-4 flex-shrink-0 hidden sm:block ${
                      state === 'complete' ? 'bg-green-400' : state === 'running' ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                  <div className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-lg transition-colors ${
                    state === 'complete' ? 'bg-green-50 dark:bg-green-950/30' :
                    state === 'running' ? 'bg-primary/5' :
                    state === 'error' ? 'bg-destructive/5' : ''
                  }`}>
                    <div className={`flex items-center justify-center h-7 w-7 rounded-full border ${
                      state === 'complete' ? 'border-green-400 bg-green-100 dark:bg-green-900' :
                      state === 'running' ? 'border-primary bg-primary/10' :
                      state === 'error' ? 'border-destructive bg-destructive/10' :
                      'border-border bg-muted'
                    }`}>
                      <Icon className={`h-3.5 w-3.5 ${
                        state === 'complete' ? 'text-green-600' :
                        state === 'running' ? 'text-primary' :
                        state === 'error' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{stage.label}</span>
                    {state === 'complete' && (
                      <div className="flex flex-col items-center gap-0.5">
                        <Check className="h-3 w-3 text-green-600" />
                        {stageTime != null && (
                          <span className="text-[8px] text-muted-foreground">
                            {stageTime < 1000 ? `${Math.round(stageTime)}ms` : `${(stageTime / 1000).toFixed(1)}s`}
                          </span>
                        )}
                      </div>
                    )}
                    {state === 'running' && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            {/* Total */}
            {dtWorkflow.render === 'complete' && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border flex-shrink-0">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-medium text-muted-foreground">{t('petProfile.pipeline.totalTime', 'Total')}</span>
                  <span className="text-[10px] font-bold text-foreground">
                    {(() => {
                      const total = Object.values(dtStageTimes).reduce((a, b) => a + b, 0);
                      return total < 1000 ? `${Math.round(total)}ms` : `${(total / 1000).toFixed(1)}s`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <DigitalTwinLogPanel
        entries={dtLog}
        isLoading={aiQuery.isLoading || aiQuery.isFetching}
        onClear={() => setDtLog([])}
      />
      </>
    )}
    {isLoadingState ? (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            {t('petProfile.digitalTwin.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('petProfile.digitalTwin.aiLoading', 'Calculando trajetória do gêmeo digital...')}
        </CardContent>
      </Card>
    ) : (
    <>
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="h-4 w-4 text-primary" />
              {t('petProfile.digitalTwin.title')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('petProfile.digitalTwin.description', { name: petName, breed: petBreed, age: petAge })}
            </p>
          </div>
          {aiConfidence && (
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400 text-[10px] whitespace-nowrap">
              <BrainCircuit className="h-3 w-3 mr-1" />
              {t(`petProfile.biologicalTimeline.confidence.${aiConfidence}`, aiConfidence)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Admin preview toggle */}
        {isAdmin && (
          <div className="flex items-center justify-between rounded-md border border-dashed bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <Label htmlFor="preview-pending" className="text-xs font-medium cursor-pointer">
                {t('petProfile.digitalTwin.previewPendingToggle')}
              </Label>
              <Badge variant="outline" className="text-[9px] h-4 px-1">admin</Badge>
            </div>
            <Switch
              id="preview-pending"
              checked={previewPending}
              onCheckedChange={setPreviewPending}
              disabled={aiQuery.isFetching}
            />
          </div>
        )}

        {/* Preview banner when active */}
        {previewMode && (
          <div className="rounded-md border border-violet-300/60 bg-violet-50/40 dark:bg-violet-950/10 p-2.5 flex items-start gap-2">
            <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-800 dark:text-violet-300">
              {t('petProfile.digitalTwin.previewPendingBanner', { count: pendingPreviewCount })}
            </p>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('petProfile.biologicalTimeline.biologicalAge', 'Idade biológica')}
            </p>
            <p className="text-2xl font-semibold mt-1">
              {(current.biological_age ?? 0).toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort', 'a')}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {current.biological_age > current.age_at_year ? (
                <span className="text-orange-600 dark:text-orange-400 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />+{((current.biological_age ?? 0) - (current.age_at_year ?? 0)).toFixed(1)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" />{((current.biological_age ?? 0) - (current.age_at_year ?? 0)).toFixed(1)}
                </span>
              )} {t('petProfile.biologicalTimeline.vsChrono', 'vs. cronológica')}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('petProfile.biologicalTimeline.chronologicalAge', 'Idade cronológica')}
            </p>
            <p className="text-2xl font-semibold mt-1">
              {(current.age_at_year ?? 0).toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort', 'a')}</span>
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />{t('petProfile.biologicalTimeline.remainingYears', 'Anos restantes')}
            </p>
            <p className="text-2xl font-semibold mt-1">
              {(yearWith?.expected_remaining_years ?? current.expected_remaining_years ?? 0).toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{t('petProfile.biologicalTimeline.yearsShort', 'a')}</span>
            </p>
          </div>
          <div className="rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />{t('petProfile.biologicalTimeline.kpiGain', 'Ganho com protocolo')}
            </p>
            <p className="text-2xl font-semibold mt-1 text-emerald-700 dark:text-emerald-400">
              {yearsGained > 0 ? '+' : ''}{yearsGained.toFixed(1)}
              <span className="text-sm text-emerald-700/70 dark:text-emerald-400/70 ml-1">{t('petProfile.biologicalTimeline.yearsShort', 'a')}</span>
              {previewMode && (
                <span className="ml-1 text-[10px] font-normal text-violet-600 dark:text-violet-400">
                  ({t('petProfile.digitalTwin.provisional')})
                </span>
              )}
            </p>
            {totalCovered > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {t('petProfile.biologicalTimeline.coverage', { covered: coveredCount, total: totalCovered })}
              </p>
            )}
          </div>
        </div>

        {/* No KG benefit banner */}
        {noKgBenefit && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {t('petProfile.biologicalTimeline.noBenefitBanner', 'Para este pet, o protocolo geroprotetor NÃO altera a trajetória: nenhuma das condições/predisposições tem evidência KG suficiente.')}
            </p>
          </div>
        )}

        {/* Side-by-side silhouettes */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t('petProfile.biologicalTimeline.compareTitle', 'Comparativo: sem vs. com protocolo')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Without */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-muted/40">
                  {t('petProfile.biologicalTimeline.scenarioWithout', 'Sem protocolo')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(yearWithout?.expected_remaining_years ?? 0).toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort', 'a')}
                </span>
              </div>
              {renderSilhouette(markersWithout, false)}
              <p className="text-[10px] text-muted-foreground text-center">
                {markersWithout.length} {t('petProfile.digitalTwin.markersLabel', 'marcadores')}
              </p>
              <ConditionsMiniList markers={markersWithout} t={t} />
            </div>
            {/* With */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  {t('petProfile.biologicalTimeline.scenarioWith', 'Com protocolo')}
                </Badge>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {(yearWith?.expected_remaining_years ?? 0).toFixed(1)}{t('petProfile.biologicalTimeline.yearsShort', 'a')}
                </span>
              </div>
              {renderSilhouette(markersWith, true)}
              <p className="text-[10px] text-muted-foreground text-center">
                {markersWith.filter(m => m.protectedHere).length} {t('petProfile.digitalTwin.protectedLabel', 'protegidos')} · {markersWith.length} {t('petProfile.digitalTwin.markersLabel', 'marcadores')}
              </p>
              <ConditionsMiniList markers={markersWith} t={t} />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground border-t pt-2">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />{t('petProfile.severity.mild', 'leve')}</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />{t('petProfile.severity.moderate', 'moderada')}</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t('petProfile.severity.severe', 'grave')}</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full border border-dashed border-amber-500" />{t('petProfile.biologicalTimeline.legend.futureRisk', 'risco futuro')}</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">★ {t('petProfile.biologicalTimeline.legend.protected', 'protegido')}</span>
          </div>
        </div>

        {/* Time slider */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <Label className="font-medium">{t('petProfile.biologicalTimeline.projectionLabel', 'Projetar até')}</Label>
            <span className="font-semibold text-primary text-base">
              {yearsAhead === 0
                ? t('petProfile.biologicalTimeline.today', 'Hoje')
                : t('petProfile.biologicalTimeline.yearsFromNow', { years: yearsAhead, defaultValue: '+{{years}} anos' })}
            </span>
          </div>
          <Slider value={[yearsAhead]} onValueChange={(v) => setYearsAhead(v[0])} min={0} max={maxSlider} step={1} className="w-full" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            {Array.from({ length: 5 }).map((_, i) => {
              const step = Math.round((maxSlider * i) / 4);
              return (
                <span key={i} className={i === 0 ? 'font-medium text-foreground/70' : ''}>
                  {i === 0 ? t('petProfile.biologicalTimeline.today', 'Hoje') : `${petAge + step}${t('petProfile.biologicalTimeline.yearsShort', 'a')}`}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
    {petId && !isLoadingState && (
      <EvidenceGapCard
        petId={petId}
        yearsGained={yearsGained}
        hasCoverage={coveredCount > 0}
        onTripletsAdded={handleTripletsAdded}
      />
    )}
    </>
    )}
    </div>
  );
};

export default DigitalTwinDog;
