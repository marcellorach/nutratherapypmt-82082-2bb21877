/**
 * Synthetic Cohort Generator — Clinical Monitoring Observatory
 *
 * Deterministic generation of:
 *  - ~8.5k TREATED dogs (Senex stack approved) — irregular total = looks less mocked
 *  - ~14k MIRROR dogs (untreated parallel cohort, matched)
 *  - 1 DIGITAL TWIN per treated dog (same total as treated)
 *
 * 100% synthetic. Every record carries `is_synthetic: true`.
 * IDs follow `#A-NNNNN` format to avoid confusion with real UUIDs.
 *
 * Used by: ClinicalMonitoringTab (admin) and its sub-tabs.
 */

// Deterministic PRNG (mulberry32). Single seed → reproducible cohort across renders.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CohortRole = 'treated' | 'mirror' | 'digital_twin';
export type ResponseLabel = 'significant' | 'mild' | 'none' | 'insufficient';

export interface SyntheticConditionMeta {
  id: string;
  name: string;
  name_en: string;
  baseSeverity: number; // 0..1
  prevalence: number; // weight in distribution
  /** Months until response curve plateaus on a treated dog. */
  plateauMonths: number;
  /** Expected delta on severity at plateau (treated vs t0), negative = improvement. */
  treatedDelta: number;
  /** Expected delta for mirror (untreated, natural progression). */
  mirrorDelta: number;
  /** Compounds typically anchored for this condition. */
  anchorCompounds: string[];
}

export const SYNTHETIC_CONDITIONS: SyntheticConditionMeta[] = [
  { id: 'oa', name: 'Osteoartrite', name_en: 'Osteoarthritis', baseSeverity: 0.55, prevalence: 0.28, plateauMonths: 6, treatedDelta: -0.32, mirrorDelta: +0.12, anchorCompounds: ['Curcumina', 'Ômega-3', 'Glicosamina', 'Boswellia'] },
  { id: 'ckd', name: 'Doença Renal Crônica', name_en: 'Chronic Kidney Disease', baseSeverity: 0.6, prevalence: 0.14, plateauMonths: 8, treatedDelta: -0.18, mirrorDelta: +0.22, anchorCompounds: ['SAMe', 'Ômega-3', 'CoQ10', 'Astaxantina'] },
  { id: 'cds', name: 'Síndrome de Disfunção Cognitiva', name_en: 'Cognitive Dysfunction Syndrome', baseSeverity: 0.5, prevalence: 0.12, plateauMonths: 9, treatedDelta: -0.24, mirrorDelta: +0.18, anchorCompounds: ['Resveratrol', 'NMN', 'PS', 'MCT'] },
  { id: 'hepato', name: 'Hepatopatia', name_en: 'Hepatopathy', baseSeverity: 0.5, prevalence: 0.1, plateauMonths: 5, treatedDelta: -0.3, mirrorDelta: +0.15, anchorCompounds: ['SAMe', 'Silimarina', 'Vitamina E'] },
  { id: 'cardio', name: 'Cardiopatia', name_en: 'Cardiomyopathy', baseSeverity: 0.58, prevalence: 0.11, plateauMonths: 7, treatedDelta: -0.22, mirrorDelta: +0.2, anchorCompounds: ['CoQ10', 'Taurina', 'L-Carnitina', 'Ômega-3'] },
  { id: 'obesity', name: 'Obesidade', name_en: 'Obesity', baseSeverity: 0.45, prevalence: 0.13, plateauMonths: 6, treatedDelta: -0.28, mirrorDelta: +0.05, anchorCompounds: ['L-Carnitina', 'Berberina', 'Ômega-3'] },
  { id: 'ibd', name: 'Doença Inflamatória Intestinal', name_en: 'Inflammatory Bowel Disease', baseSeverity: 0.5, prevalence: 0.07, plateauMonths: 4, treatedDelta: -0.3, mirrorDelta: +0.1, anchorCompounds: ['Probióticos', 'Glutamina', 'Curcumina'] },
  { id: 'sarcopenia', name: 'Sarcopenia', name_en: 'Sarcopenia', baseSeverity: 0.4, prevalence: 0.05, plateauMonths: 8, treatedDelta: -0.2, mirrorDelta: +0.18, anchorCompounds: ['HMB', 'Creatina', 'Proteína', 'Vitamina D'] },
];

export const SYNTHETIC_BREEDS = [
  'Labrador Retriever', 'Golden Retriever', 'Bulldog Francês', 'Pastor Alemão', 'Poodle',
  'Beagle', 'Rottweiler', 'Boxer', 'Dachshund', 'Yorkshire Terrier',
  'Shih Tzu', 'Maltês', 'Chihuahua', 'SRD', 'Border Collie',
];

export const SYNTHETIC_REGIONS = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];

export interface SyntheticPet {
  id: string; // #A-NNNNN
  role: CohortRole;
  twinOfId?: string; // for digital_twin: reference to treated id
  mirrorOfId?: string; // for mirror: nearest treated id (matched)
  is_synthetic: true;
  breed: string;
  ageYears: number;
  sex: 'M' | 'F';
  region: string;
  primaryConditionId: string;
  comorbidities: string[];
  severityT0: number; // 0..1
  protocolStartMonth: number; // months ago (0 = now, 24 = 2y ago); negative not used
  monthsOnProtocol: number; // = protocolStartMonth (treated/twin); for mirror: observation window
  adherencePct: number; // 0..100 (treated only; mirror = 100 obs; twin = 100 ideal)
  stack: string[]; // compounds
  monthlySeverity: number[]; // length = monthsOnProtocol + 1 (t0..now)
  responseStatus: ResponseLabel;
  yearsGained: number; // estimated; mirror = 0
  estimatedRoeBrl: number; // ROE proxy (treated only)
  /** Calendar-month index (0..24, 24 = current month) when pet started the protocol. */
  enrollmentCalendarMonth?: number;
  /** Calendar-month index when pet dropped the protocol (null = still active). */
  dropCalendarMonth?: number | null;
}

export interface SyntheticCohort {
  treated: SyntheticPet[];
  mirror: SyntheticPet[];
  twins: SyntheticPet[];
  generatedAt: string;
  seed: number;
  meta: {
    treatedCount: number;
    mirrorCount: number;
    twinCount: number;
  };
}

function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pad5(n: number) {
  return n.toString().padStart(5, '0');
}

function classifyResponse(deltaPct: number, monthsOn: number): ResponseLabel {
  if (monthsOn < 2) return 'insufficient';
  if (deltaPct <= -0.25) return 'significant';
  if (deltaPct <= -0.1) return 'mild';
  return 'none';
}

/** Sigmoid-like response curve with adherence dampening + noise. */
function buildTrajectory(
  rng: () => number,
  severityT0: number,
  totalDelta: number,
  plateauMonths: number,
  monthsOnProtocol: number,
  adherence: number,
  noiseAmp: number,
): number[] {
  const months = Math.max(0, Math.floor(monthsOnProtocol));
  const series: number[] = [];
  for (let m = 0; m <= months; m++) {
    // sigmoid that reaches ~95% of totalDelta at plateauMonths
    const x = (m / plateauMonths) * 6 - 3; // -3..3
    const sig = 1 / (1 + Math.exp(-x));
    const applied = totalDelta * sig * (adherence / 100);
    const noise = (rng() - 0.5) * noiseAmp;
    const v = Math.max(0, Math.min(1, severityT0 + applied + noise));
    series.push(Number(v.toFixed(3)));
  }
  return series;
}

let CACHED: SyntheticCohort | null = null;

export interface GenerateOptions {
  seed?: number;
  treatedCount?: number;
  mirrorCount?: number;
}

export function generateSyntheticCohort(opts: GenerateOptions = {}): SyntheticCohort {
  if (CACHED && !opts.seed && !opts.treatedCount && !opts.mirrorCount) return CACHED;

  const seed = opts.seed ?? 42_424_242;
  // Irregular totals → looks less mocked. 1 digital twin per treated by design.
  const treatedCount = opts.treatedCount ?? 8_473;
  const mirrorCount = opts.mirrorCount ?? 13_916;
  const rng = mulberry32(seed);

  const condWeights = SYNTHETIC_CONDITIONS.map((c) => c.prevalence);
  const breedWeights = SYNTHETIC_BREEDS.map((_, i) => (15 - i) / 15);
  const regionWeights = [0.18, 0.42, 0.1, 0.2, 0.1];

  const treated: SyntheticPet[] = [];
  const twins: SyntheticPet[] = [];

  for (let i = 0; i < treatedCount; i++) {
    const cond = pickWeighted(rng, SYNTHETIC_CONDITIONS, condWeights);
    const breed = pickWeighted(rng, SYNTHETIC_BREEDS, breedWeights);
    const region = pickWeighted(rng, SYNTHETIC_REGIONS, regionWeights);
    const ageYears = 5 + Math.floor(rng() * 10); // 5..14
    const sex: 'M' | 'F' = rng() < 0.52 ? 'M' : 'F';
    const severityT0 = Math.max(0.2, Math.min(0.95, cond.baseSeverity + (rng() - 0.5) * 0.3));
    // protocolStartMonth distributed asynchronously across last 24 months
    const protocolStartMonth = Math.floor(rng() * 24);
    const monthsOnProtocol = protocolStartMonth;
    const adherencePct = Math.round(55 + rng() * 45); // 55..100
    // comorbidities
    const comorbidities: string[] = [];
    if (rng() < 0.35) {
      const other = pickWeighted(rng, SYNTHETIC_CONDITIONS, condWeights);
      if (other.id !== cond.id) comorbidities.push(other.id);
    }
    // stack: 3..6 compounds, anchored from condition
    const stackSize = 3 + Math.floor(rng() * 4);
    const stack = [...cond.anchorCompounds];
    while (stack.length < stackSize) {
      const extra = pickWeighted(rng, SYNTHETIC_CONDITIONS, condWeights).anchorCompounds[Math.floor(rng() * 4)];
      if (extra && !stack.includes(extra)) stack.push(extra);
    }
    const series = buildTrajectory(rng, severityT0, cond.treatedDelta, cond.plateauMonths, monthsOnProtocol, adherencePct, 0.04);
    const deltaPct = series.length > 1 ? (series[series.length - 1] - series[0]) / Math.max(0.01, series[0]) : 0;
    const responseStatus = classifyResponse(deltaPct, monthsOnProtocol);
    const yearsGained = Math.max(0, -cond.treatedDelta * (adherencePct / 100) * (1.6 + rng() * 0.6));
    const estimatedRoeBrl = Math.round(yearsGained * 4800 + (responseStatus === 'significant' ? 1200 : 0));
    const id = `#A-${pad5(i + 1)}`;

    // Calendar-month enrollment: 24 = current month, going back to monthsOnProtocol ago.
    const enrollmentCalendarMonth = Math.max(0, 24 - monthsOnProtocol);
    // Drop probability driven by adherence: <60 → up to 35% chance of dropping mid-protocol.
    let dropCalendarMonth: number | null = null;
    if (adherencePct < 75 && rng() < (75 - adherencePct) / 100 + 0.05) {
      const dropAtProtocolMonth = Math.floor(2 + rng() * Math.max(1, monthsOnProtocol - 2));
      dropCalendarMonth = Math.min(24, enrollmentCalendarMonth + dropAtProtocolMonth);
    }

    const pet: SyntheticPet = {
      id,
      role: 'treated',
      is_synthetic: true,
      breed,
      ageYears,
      sex,
      region,
      primaryConditionId: cond.id,
      comorbidities,
      severityT0,
      protocolStartMonth,
      monthsOnProtocol,
      adherencePct,
      stack,
      monthlySeverity: series,
      responseStatus,
      yearsGained: Number(yearsGained.toFixed(2)),
      estimatedRoeBrl,
      enrollmentCalendarMonth,
      dropCalendarMonth,
    };
    treated.push(pet);

    // matching digital twin: ideal-adherence trajectory + slightly stronger effect
    const twinSeries = buildTrajectory(
      rng,
      severityT0,
      cond.treatedDelta * 1.05,
      cond.plateauMonths,
      Math.min(24, monthsOnProtocol + 6), // twin projects 6 months ahead
      100,
      0.015,
    );
    twins.push({
      ...pet,
      id: `${id}-T`,
      role: 'digital_twin',
      twinOfId: id,
      adherencePct: 100,
      monthsOnProtocol: twinSeries.length - 1,
      monthlySeverity: twinSeries,
      yearsGained: Number((yearsGained * 1.1).toFixed(2)),
      estimatedRoeBrl: 0,
    });
  }

  // Mirror cohort: 1.6x treatedCount, matched by breed+age bucket+primary condition
  // For demo speed, generate independently with similar distribution and back-reference the nearest treated id.
  const mirror: SyntheticPet[] = [];
  for (let i = 0; i < mirrorCount; i++) {
    const anchor = treated[Math.floor(rng() * treated.length)];
    const cond = SYNTHETIC_CONDITIONS.find((c) => c.id === anchor.primaryConditionId)!;
    const severityT0 = Math.max(0.2, Math.min(0.95, anchor.severityT0 + (rng() - 0.5) * 0.1));
    const monthsObs = anchor.monthsOnProtocol;
    const series = buildTrajectory(rng, severityT0, cond.mirrorDelta, cond.plateauMonths, monthsObs, 100, 0.05);
    const deltaPct = series.length > 1 ? (series[series.length - 1] - series[0]) / Math.max(0.01, series[0]) : 0;
    const responseStatus: ResponseLabel = deltaPct >= 0.1 ? 'none' : deltaPct >= 0 ? 'insufficient' : 'mild';
    mirror.push({
      id: `#M-${pad5(i + 1)}`,
      role: 'mirror',
      mirrorOfId: anchor.id,
      is_synthetic: true,
      breed: anchor.breed,
      ageYears: anchor.ageYears + (Math.floor(rng() * 3) - 1),
      sex: rng() < 0.5 ? 'M' : 'F',
      region: anchor.region,
      primaryConditionId: anchor.primaryConditionId,
      comorbidities: anchor.comorbidities,
      severityT0,
      protocolStartMonth: 0,
      monthsOnProtocol: monthsObs,
      adherencePct: 0,
      stack: [],
      monthlySeverity: series,
      responseStatus,
      yearsGained: 0,
      estimatedRoeBrl: 0,
    });
  }

  const cohort: SyntheticCohort = {
    treated,
    mirror,
    twins,
    generatedAt: new Date().toISOString(),
    seed,
    meta: { treatedCount: treated.length, mirrorCount: mirror.length, twinCount: twins.length },
  };
  CACHED = cohort;
  return cohort;
}

/** Aggregate response distribution. */
export function aggregateResponse(pets: SyntheticPet[]) {
  const out: Record<ResponseLabel, number> = { significant: 0, mild: 0, none: 0, insufficient: 0 };
  for (const p of pets) out[p.responseStatus]++;
  return out;
}

/** Monthly mean severity curve across a cohort (aligned at protocol month). */
export function meanTrajectory(pets: SyntheticPet[], maxMonths = 24): { month: number; mean: number; n: number }[] {
  const buckets: { sum: number; n: number }[] = Array.from({ length: maxMonths + 1 }, () => ({ sum: 0, n: 0 }));
  for (const p of pets) {
    for (let m = 0; m < p.monthlySeverity.length && m <= maxMonths; m++) {
      buckets[m].sum += p.monthlySeverity[m];
      buckets[m].n++;
    }
  }
  return buckets.map((b, m) => ({ month: m, mean: b.n ? Number((b.sum / b.n).toFixed(3)) : 0, n: b.n }));
}

/** Mean trajectory with 95% confidence interval band (mean ± 1.96·SEM). */
export function meanTrajectoryWithCI(pets: SyntheticPet[], maxMonths = 24) {
  const sums: { sum: number; sumSq: number; n: number }[] = Array.from({ length: maxMonths + 1 }, () => ({ sum: 0, sumSq: 0, n: 0 }));
  for (const p of pets) {
    for (let m = 0; m < p.monthlySeverity.length && m <= maxMonths; m++) {
      const v = p.monthlySeverity[m];
      sums[m].sum += v;
      sums[m].sumSq += v * v;
      sums[m].n++;
    }
  }
  return sums.map((b, m) => {
    if (!b.n) return { month: m, mean: 0, lo: 0, hi: 0, n: 0 };
    const mean = b.sum / b.n;
    const variance = Math.max(0, b.sumSq / b.n - mean * mean);
    const sem = Math.sqrt(variance / b.n);
    const ci = 1.96 * sem;
    return {
      month: m,
      mean: Number(mean.toFixed(3)),
      lo: Number(Math.max(0, mean - ci).toFixed(3)),
      hi: Number(Math.min(1, mean + ci).toFixed(3)),
      n: b.n,
    };
  });
}

/** Number Needed to Treat — synthetic, per condition. */
export function computeNNT(treated: SyntheticPet[], mirror: SyntheticPet[]): number | null {
  if (!treated.length || !mirror.length) return null;
  const rateT = treated.filter((p) => p.responseStatus === 'significant' || p.responseStatus === 'mild').length / treated.length;
  const rateM = mirror.filter((p) => p.responseStatus === 'mild').length / mirror.length;
  const arr = rateT - rateM;
  if (arr <= 0) return null;
  return Number((1 / arr).toFixed(1));
}

/** Hazard ratio proxy: ratio of worsening events (final severity > T0) treated vs mirror. */
export function computeHazardRatio(treated: SyntheticPet[], mirror: SyntheticPet[]): number | null {
  if (!treated.length || !mirror.length) return null;
  const worsen = (p: SyntheticPet) => p.monthlySeverity[p.monthlySeverity.length - 1] > p.severityT0 + 0.02;
  const hT = treated.filter(worsen).length / treated.length;
  const hM = mirror.filter(worsen).length / mirror.length;
  if (hM === 0) return null;
  return Number((hT / hM).toFixed(2));
}

/** Median time-to-response (months) with IQR for treated cohort. */
export function computeTimeToResponse(treated: SyntheticPet[]): { median: number; q1: number; q3: number } | null {
  const times: number[] = [];
  for (const p of treated) {
    const t0 = p.severityT0;
    const target = t0 * 0.85; // 15% improvement
    for (let m = 1; m < p.monthlySeverity.length; m++) {
      if (p.monthlySeverity[m] <= target) { times.push(m); break; }
    }
  }
  if (!times.length) return null;
  times.sort((a, b) => a - b);
  const q = (p: number) => times[Math.floor(p * (times.length - 1))];
  return { median: q(0.5), q1: q(0.25), q3: q(0.75) };
}

/**
 * Monthly adherence flow over the last 24 calendar months:
 * { month, joined, churned, active } stacked-friendly.
 */
export function computeMonthlyFlow(treated: SyntheticPet[], months = 24) {
  const joined = new Array(months + 1).fill(0);
  const churned = new Array(months + 1).fill(0);
  for (const p of treated) {
    if (p.enrollmentCalendarMonth != null && p.enrollmentCalendarMonth <= months) joined[p.enrollmentCalendarMonth]++;
    if (p.dropCalendarMonth != null && p.dropCalendarMonth <= months) churned[p.dropCalendarMonth]++;
  }
  const out = [] as { month: number; label: string; joined: number; churned: number; active: number }[];
  let active = 0;
  for (let m = 0; m <= months; m++) {
    active += joined[m] - churned[m];
    out.push({
      month: m,
      label: `M-${months - m}`,
      joined: joined[m],
      churned: -churned[m], // negative for diverging stacked bar
      active: Math.max(0, active),
    });
  }
  return out;
}

/** Build a synthetic patient header / consultation snapshot for the detail dialog. */
export function syntheticSnapshot(pet: SyntheticPet) {
  const cond = SYNTHETIC_CONDITIONS.find((c) => c.id === pet.primaryConditionId)!;
  return {
    reason: `Avaliação geriátrica · ${cond.name}`,
    reason_en: `Geriatric assessment · ${cond.name_en}`,
    physicalExam: pet.severityT0 > 0.6
      ? 'Sinais clínicos moderados a graves compatíveis com a condição primária.'
      : 'Sinais clínicos leves; ECC compatível com idade e raça.',
    physicalExam_en: pet.severityT0 > 0.6
      ? 'Moderate-to-severe clinical signs consistent with primary condition.'
      : 'Mild clinical signs; BCS compatible with age and breed.',
    diagnoses: [
      { name: cond.name, name_en: cond.name_en, severity: pet.severityT0 > 0.6 ? 'severe' : pet.severityT0 > 0.4 ? 'moderate' : 'mild' },
      ...pet.comorbidities.map((cid) => {
        const c = SYNTHETIC_CONDITIONS.find((x) => x.id === cid)!;
        return { name: c.name, name_en: c.name_en, severity: 'mild' as const };
      }),
    ],
  };
}

/** Sample N patients for explorer table (capped, fast). */
export function sampleTreated(cohort: SyntheticCohort, n = 200, filterFn?: (p: SyntheticPet) => boolean): SyntheticPet[] {
  const pool = filterFn ? cohort.treated.filter(filterFn) : cohort.treated;
  return pool.slice(0, n);
}

/** Find treated pet by id, plus its twin and a mirror sample. */
export function findPatientBundle(cohort: SyntheticCohort, id: string) {
  const treated = cohort.treated.find((p) => p.id === id);
  if (!treated) return null;
  const twin = cohort.twins.find((t) => t.twinOfId === id);
  const mirrors = cohort.mirror.filter((m) => m.mirrorOfId === id).slice(0, 8);
  return { treated, twin, mirrors };
}
