import { useMemo } from 'react';
import { SyntheticCohort, SyntheticPet } from '@/utils/syntheticCohort';

export interface CohortFilters {
  condition?: string; // 'all' or condition id
  breed?: string;
  age?: 'any' | 'adult' | 'senior' | 'geriatric';
  region?: string;
  adherence?: 'any' | 'high' | 'mid' | 'low';
  window?: 'any' | 'early' | 'mid' | 'long';
  response?: string; // 'all' or status
}

export const DEFAULT_FILTERS: CohortFilters = {
  condition: 'all',
  breed: 'all',
  age: 'any',
  region: 'all',
  adherence: 'any',
  window: 'any',
  response: 'all',
};

function ageBucket(years: number): 'adult' | 'senior' | 'geriatric' {
  if (years < 7) return 'adult';
  if (years < 10) return 'senior';
  return 'geriatric';
}

function adherenceBucket(pct: number): 'high' | 'mid' | 'low' {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'mid';
  return 'low';
}

function windowBucket(months: number): 'early' | 'mid' | 'long' {
  if (months < 6) return 'early';
  if (months < 12) return 'mid';
  return 'long';
}

function matches(p: SyntheticPet, f: CohortFilters): boolean {
  if (f.condition && f.condition !== 'all' && p.primaryConditionId !== f.condition) return false;
  if (f.breed && f.breed !== 'all' && p.breed !== f.breed) return false;
  if (f.region && f.region !== 'all' && p.region !== f.region) return false;
  if (f.age && f.age !== 'any' && ageBucket(p.ageYears) !== f.age) return false;
  if (f.adherence && f.adherence !== 'any' && p.role === 'treated' && adherenceBucket(p.adherencePct) !== f.adherence) return false;
  if (f.window && f.window !== 'any' && windowBucket(p.monthsOnProtocol) !== f.window) return false;
  if (f.response && f.response !== 'all' && p.responseStatus !== f.response) return false;
  return true;
}

export function useFilteredCohort(cohort: SyntheticCohort, filters: CohortFilters): SyntheticCohort {
  return useMemo(() => {
    const treated = cohort.treated.filter((p) => matches(p, filters));
    const treatedIds = new Set(treated.map((p) => p.id));
    const twins = cohort.twins.filter((t) => t.twinOfId && treatedIds.has(t.twinOfId));
    // Mirror filtered by condition/breed/region/age (ignore adherence/window which are protocol-specific)
    const mirrorFilters: CohortFilters = { ...filters, adherence: 'any', window: 'any', response: 'all' };
    const mirror = cohort.mirror.filter((m) => matches(m, mirrorFilters));
    return {
      ...cohort,
      treated,
      mirror,
      twins,
      meta: { treatedCount: treated.length, mirrorCount: mirror.length, twinCount: twins.length },
    };
  }, [cohort, filters]);
}