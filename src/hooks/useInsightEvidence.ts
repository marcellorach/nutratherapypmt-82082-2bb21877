import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { canonicalLabFlag } from '@/services/lab-flag-canonicalizer';

export interface InsightEvidenceInput {
  id: string;
  cohort_id: string | null;
  signals?: string[] | null;
}

export interface InsightEvidence {
  loading: boolean;
  totalPets: number;
  matchingPets: any[];
  matchRatio: number;
  byBreed: Array<{ breed: string; n: number }>;
  ageStats: { mean: number; sd: number; count: number };
  bySeverity: Array<{ name: string; value: number }>;
  topFlags: Array<{ flag: string; n: number; pct: number }>;
  cohortName: string | null;
}

const EMPTY: InsightEvidence = {
  loading: false,
  totalPets: 0,
  matchingPets: [],
  matchRatio: 0,
  byBreed: [],
  ageStats: { mean: 0, sd: 0, count: 0 },
  bySeverity: [],
  topFlags: [],
  cohortName: null,
};

/**
 * Computes evidence supporting a cohort_insight directly from cohort_pets,
 * pet_conditions and pet_exams. No LLM. Numbers are auditable.
 */
export function useInsightEvidence(
  insight: InsightEvidenceInput | null,
  enabled: boolean,
): InsightEvidence {
  const [pets, setPets] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [cohortName, setCohortName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !insight) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let petQuery = supabase
        .from('pet_profiles')
        .select('id, breed, age_years, cohort_id')
        .eq('is_synthetic', true);
      if (insight.cohort_id) petQuery = petQuery.eq('cohort_id', insight.cohort_id);
      const { data: petsData } = await petQuery.limit(500);
      const petIds = (petsData ?? []).map((p: any) => p.id);

      let condData: any[] = [];
      let examData: any[] = [];
      if (petIds.length) {
        const [c, e] = await Promise.all([
          supabase.from('pet_conditions').select('pet_id, condition_name, severity').in('pet_id', petIds),
          supabase.from('pet_exams').select('pet_id, flags_abnormal').in('pet_id', petIds),
        ]);
        condData = c.data ?? [];
        examData = e.data ?? [];
      }

      let name: string | null = null;
      if (insight.cohort_id) {
        const { data: cohort } = await supabase
          .from('synthetic_cohorts')
          .select('name')
          .eq('id', insight.cohort_id)
          .maybeSingle();
        name = cohort?.name ?? null;
      }

      if (cancelled) return;
      setPets(petsData ?? []);
      setConditions(condData);
      setExams(examData);
      setCohortName(name);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [enabled, insight?.id, insight?.cohort_id]);

  const signals = useMemo(
    () => (insight?.signals ?? []).map((s) => s.toLowerCase()),
    [insight?.signals],
  );

  const matchingPets = useMemo(() => {
    if (!signals.length) return pets;
    const matchIds = new Set<string>();
    conditions.forEach((c) => {
      const text = (c.condition_name ?? '').toLowerCase();
      if (signals.some((s) => text.includes(s) || (text.length >= 6 && s.includes(text.slice(0, 6))))) {
        matchIds.add(c.pet_id);
      }
    });
    exams.forEach((e) => {
      (e.flags_abnormal ?? []).forEach((f: string) => {
        const ft = f.toLowerCase();
        if (signals.some((s) => ft.includes(s) || (ft.length >= 6 && s.includes(ft.slice(0, 6))))) {
          matchIds.add(e.pet_id);
        }
      });
    });
    return pets.filter((p) => matchIds.has(p.id));
  }, [pets, conditions, exams, signals]);

  const byBreed = useMemo(() => {
    const m: Record<string, number> = {};
    matchingPets.forEach((p) => { m[p.breed] = (m[p.breed] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([breed, n]) => ({ breed, n }));
  }, [matchingPets]);

  const ageStats = useMemo(() => {
    const ages = matchingPets.map((p) => Number(p.age_years)).filter((a) => !Number.isNaN(a));
    if (!ages.length) return { mean: 0, sd: 0, count: 0 };
    const mean = ages.reduce((s, a) => s + a, 0) / ages.length;
    const variance = ages.reduce((s, a) => s + (a - mean) ** 2, 0) / ages.length;
    return { mean, sd: Math.sqrt(variance), count: ages.length };
  }, [matchingPets]);

  const bySeverity = useMemo(() => {
    const petSet = new Set(matchingPets.map((p) => p.id));
    const m: Record<string, number> = { mild: 0, moderate: 0, severe: 0 };
    conditions.filter((c) => petSet.has(c.pet_id)).forEach((c) => {
      const s = c.severity ?? 'mild';
      m[s] = (m[s] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).filter((x) => x.value > 0);
  }, [matchingPets, conditions]);

  const topFlags = useMemo(() => {
    const petSet = new Set(matchingPets.map((p) => p.id));
    const m: Record<string, number> = {};
    exams.filter((e) => petSet.has(e.pet_id)).forEach((e) => {
      (e.flags_abnormal ?? []).forEach((f: string) => {
        const key = canonicalLabFlag(f);
        m[key] = (m[key] ?? 0) + 1;
      });
    });
    const totalMatched = Math.max(1, matchingPets.length);
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([flag, n]) => ({ flag, n, pct: n / totalMatched }));
  }, [matchingPets, exams]);

  if (!enabled || !insight) return EMPTY;

  return {
    loading,
    totalPets: pets.length,
    matchingPets,
    matchRatio: pets.length ? matchingPets.length / pets.length : 0,
    byBreed,
    ageStats,
    bySeverity,
    topFlags,
    cohortName,
  };
}