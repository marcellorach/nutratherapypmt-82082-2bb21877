import { useMemo } from 'react';
import { SyntheticCohort, SyntheticPet } from '@/utils/syntheticCohort';

export interface ClinicalCohortFilters {
  conditionId?: string; // 'all' or id
  breed?: string; // 'all' or breed
  ageBand?: 'all' | 'adult' | 'senior' | 'geriatric';
  region?: string; // 'all' or region
  adherenceBand?: 'all' | 'high' | 'medium' | 'low';
  windowBand?: 'all' | 'short' | 'mid' | 'long'; // 0-6 / 6-12 / 12-24m
}

const DEFAULTS: ClinicalCohortFilters = {
  conditionId: 'all',
  breed: 'all',
  ageBand: 'all',
  region: 'all',
  adherenceBand: 'all',
  windowBand: 'all',
};

function matchAge(p: SyntheticPet, band: ClinicalCohortFilters['ageBand']) {
  if (band === 'all' || !band) return true;
  if (band === 'adult') return p.ageYears < 7;
  if (band === 'senior') return p.ageYears >= 7 && p.ageYears < 10;
  return p.ageYears >= 10; // geriatric
}
function matchAdherence(p: SyntheticPet, band: ClinicalCohortFilters['adherenceBand']) {
  if (band === 'all' || !band) return true;
  if (band === 'high') return p.adherencePct >= 80;
  if (band === 'medium') return p.adherencePct >= 50 && p.adherencePct < 80;
  return p.adherencePct < 50;
}
function matchWindow(p: SyntheticPet, band: ClinicalCohortFilters['windowBand']) {
  if (band === 'all' || !band) return true;
  if (band === 'short') return p.monthsOnProtocol < 6;
  if (band === 'mid') return p.monthsOnProtocol >= 6 && p.monthsOnProtocol < 12;
  return p.monthsOnProtocol >= 12;
}

export function useFilteredCohort(base: SyntheticCohort, filters: ClinicalCohortFilters): SyntheticCohort {
  return useMemo(() => {
    const f = { ...DEFAULTS, ...filters };
    const treated = base.treated.filter((p) =>
      (f.conditionId === 'all' || p.primaryConditionId === f.conditionId) &&
      (f.breed === 'all' || p.breed === f.breed) &&
      (f.region === 'all' || p.region === f.region) &&
      matchAge(p, f.ageBand) &&
      matchAdherence(p, f.adherenceBand) &&
      matchWindow(p, f.windowBand),
    );
    const treatedIds = new Set(treated.map((p) => p.id));
    const twins = base.twins.filter((tw) => tw.twinOfId && treatedIds.has(tw.twinOfId));
    const mirror = base.mirror.filter((m) => m.mirrorOfId && treatedIds.has(m.mirrorOfId));
    return {
      ...base,
      treated,
      twins,
      mirror,
      meta: { treatedCount: treated.length, mirrorCount: mirror.length, twinCount: twins.length },
    };
  }, [base, filters]);
}

export const DEFAULT_CLINICAL_FILTERS = DEFAULTS;