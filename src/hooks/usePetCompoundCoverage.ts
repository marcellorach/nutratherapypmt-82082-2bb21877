import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KgCoverageEntry } from '@/services/biological-timeline-engine';

/**
 * Fetches KG evidence (nutraceutical × condition with efficacy_score >= 3)
 * for the pet's active conditions and breed predispositions, returning a
 * compact coverage map consumed by the timeline engine.
 *
 * This is the SOURCE OF TRUTH for whether the geroprotector toggle has any
 * effect on a given condition. No KG entry → no protection modeled.
 */
export function usePetCompoundCoverage(
  petId: string | null,
  conditionNames: string[],
  enabled = true,
) {
  return useQuery({
    queryKey: ['pet-compound-coverage', petId, conditionNames.slice().sort().join('|')],
    queryFn: async (): Promise<KgCoverageEntry[]> => {
      if (!conditionNames.length) return [];

      // Resolve condition names to IDs (case-insensitive, PT or EN)
      const lowered = conditionNames.map(n => n.toLowerCase().trim()).filter(Boolean);
      if (lowered.length === 0) return [];

      const { data: conds, error: condErr } = await supabase
        .from('health_conditions')
        .select('id, name, name_en');
      if (condErr || !conds) return [];

      const matched = conds.filter(c => {
        const n = (c.name || '').toLowerCase();
        const ne = (c.name_en || '').toLowerCase();
        return lowered.some(target =>
          target === n || target === ne ||
          (n && target.includes(n)) || (ne && target.includes(ne)) ||
          (n && n.includes(target)) || (ne && ne.includes(target)),
        );
      });
      if (matched.length === 0) return [];

      const matchedIds = matched.map(c => c.id);

      const { data: links, error: linkErr } = await supabase
        .from('nutraceutical_conditions')
        .select(`
          relationship_type,
          efficacy_score,
          condition_id,
          nutraceuticals:nutraceutical_id (id, name, name_en),
          health_conditions:condition_id (id, name, name_en)
        `)
        .in('condition_id', matchedIds)
        .gte('efficacy_score', 3);
      if (linkErr || !links) return [];

      // Group by condition (use the original requested condition name as key)
      const map = new Map<string, KgCoverageEntry>();
      for (const link of links) {
        const cond: any = link.health_conditions;
        const nut: any = link.nutraceuticals;
        if (!cond || !nut) continue;
        const condDbName = (cond.name_en || cond.name || '').toLowerCase().trim();
        // Find which user-requested condition this matches
        const userMatch = lowered.find(target =>
          target === condDbName || target.includes(condDbName) || condDbName.includes(target),
        );
        const key = userMatch || condDbName;
        let entry = map.get(key);
        if (!entry) {
          entry = { conditionKey: key, compounds: [], bestEfficacy: 0, supportCount: 0 };
          map.set(key, entry);
        }
        const compoundName = nut.name_en || nut.name || 'unknown';
        if (!entry.compounds.find(c => c.name === compoundName)) {
          entry.compounds.push({
            name: compoundName,
            efficacy_0_5: link.efficacy_score || 0,
            relationship_type: link.relationship_type,
          });
          if ((link.efficacy_score || 0) > entry.bestEfficacy) {
            entry.bestEfficacy = link.efficacy_score || 0;
          }
          if ((link.efficacy_score || 0) >= 3) entry.supportCount++;
        }
      }

      return Array.from(map.values());
    },
    enabled: enabled && !!petId && conditionNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
