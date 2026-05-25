import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseBMetrics {
  approvedCount: number;
  approvedTarget: number;
  redundantLessons: number;
  redundantTarget: number;
  conflicts: number;
  conflictsTarget: number;
  unlocked: boolean;
}

type Lesson = { statement?: string; quote?: string } | string;

function norm(s: unknown): string {
  if (!s) return '';
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
}

function toStatements(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((it: Lesson) => norm(typeof it === 'string' ? it : it?.statement || it?.quote))
    .filter((s) => s.length >= 20);
}

async function fetchPhaseBMetrics(): Promise<PhaseBMetrics> {
  const { data, error } = await supabase
    .from('meta_studies')
    .select('id, lifecycle_status, architectural_patterns, methodological_recipes, anti_patterns_pitfalls')
    .eq('lifecycle_status', 'approved');
  if (error) throw error;
  const studies = data || [];
  const approvedCount = studies.length;

  // Redundancy: same normalized statement appears in ≥2 distinct studies
  // (counted per bucket — patterns, recipes, anti-patterns)
  const buckets: Array<keyof typeof bucketKeys> = ['patterns', 'recipes', 'antiPatterns'];
  const bucketKeys = {
    patterns: 'architectural_patterns',
    recipes: 'methodological_recipes',
    antiPatterns: 'anti_patterns_pitfalls',
  } as const;

  const seenByBucket: Record<string, Map<string, Set<string>>> = {
    patterns: new Map(),
    recipes: new Map(),
    antiPatterns: new Map(),
  };
  for (const s of studies) {
    for (const b of buckets) {
      const stmts = toStatements((s as any)[bucketKeys[b]]);
      for (const st of stmts) {
        if (!seenByBucket[b].has(st)) seenByBucket[b].set(st, new Set());
        seenByBucket[b].get(st)!.add(s.id);
      }
    }
  }
  let redundantLessons = 0;
  for (const b of buckets) {
    for (const ids of seenByBucket[b].values()) {
      if (ids.size >= 2) redundantLessons++;
    }
  }

  // Conflicts: same normalized statement appears as both a recipe and an anti-pattern
  let conflicts = 0;
  for (const st of seenByBucket.recipes.keys()) {
    if (seenByBucket.antiPatterns.has(st)) conflicts++;
  }

  const approvedTarget = 10;
  const redundantTarget = 3;
  const conflictsTarget = 1;
  const unlocked =
    approvedCount >= approvedTarget &&
    redundantLessons >= redundantTarget &&
    conflicts >= conflictsTarget;

  return {
    approvedCount,
    approvedTarget,
    redundantLessons,
    redundantTarget,
    conflicts,
    conflictsTarget,
    unlocked,
  };
}

export function useMetaKgPhaseBMetrics() {
  return useQuery({
    queryKey: ['meta-kg-phase-b-metrics'],
    queryFn: fetchPhaseBMetrics,
    staleTime: 60_000,
  });
}