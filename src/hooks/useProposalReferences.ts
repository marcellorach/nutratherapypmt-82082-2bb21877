import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  buildReferences,
  BuiltReference,
  RawStudy,
} from '@/services/references-builder';

/**
 * Sprint 5 — fetch the scientific studies that back a treatment proposal.
 *
 * Strategy:
 *  1. Pull approved triplets matching (compound × condition) for this proposal,
 *     collecting their `study_id`s.
 *  2. Fetch the corresponding `scientific_studies` rows.
 *  3. Build deduplicated, Vancouver-formatted references.
 *
 * No mock data — silent empty fallback when nothing matches (per No-Mock policy).
 */
export const useProposalReferences = (
  compounds: string[],
  conditions: string[],
) => {
  const [refs, setRefs] = useState<BuiltReference[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const cleanCompounds = (compounds || []).filter(Boolean);
      const cleanConditions = (conditions || []).filter(Boolean);
      if (cleanCompounds.length === 0) {
        setRefs([]);
        return;
      }
      setLoading(true);
      try {
        // 1) Pull approved triplets for any of our compounds (cap to keep it fast)
        const orFilter = cleanCompounds
          .map((c) => `subject_name.ilike.%${c.replace(/[%,]/g, '')}%`)
          .join(',');
        const { data: triplets } = await (supabase as any)
          .from('triplet_extractions')
          .select('study_id, subject_name, object_name')
          .or(orFilter)
          .eq('curation_status', 'approved')
          .limit(400);

        const studyIdToContext = new Map<
          string,
          { compounds: Set<string>; conditions: Set<string> }
        >();
        for (const t of triplets || []) {
          if (!t.study_id) continue;
          const ctx =
            studyIdToContext.get(t.study_id) ||
            { compounds: new Set<string>(), conditions: new Set<string>() };
          const matchedCompound = cleanCompounds.find(
            (c) =>
              String(t.subject_name || '')
                .toLowerCase()
                .includes(c.toLowerCase()),
          );
          if (matchedCompound) ctx.compounds.add(matchedCompound);
          const matchedCondition = cleanConditions.find(
            (c) =>
              String(t.object_name || '')
                .toLowerCase()
                .includes(c.toLowerCase()),
          );
          if (matchedCondition) ctx.conditions.add(matchedCondition);
          studyIdToContext.set(t.study_id, ctx);
        }

        const studyIds = Array.from(studyIdToContext.keys()).slice(0, 80);
        if (studyIds.length === 0) {
          if (!cancelled) setRefs([]);
          return;
        }

        const { data: studies } = await (supabase as any)
          .from('scientific_studies')
          .select(
            'id, title, title_en, authors, journal, journal_en, year, pmid, doi, link',
          )
          .in('id', studyIds);

        const raw: RawStudy[] = (studies || []).map((s: any) => {
          const ctx = studyIdToContext.get(s.id);
          return {
            ...s,
            _compounds: ctx ? Array.from(ctx.compounds) : [],
            _conditions: ctx ? Array.from(ctx.conditions) : [],
          };
        });
        if (!cancelled) setRefs(buildReferences(raw));
      } catch (e) {
        console.error('useProposalReferences error:', e);
        if (!cancelled) setRefs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(compounds), JSON.stringify(conditions)]);

  return { references: refs, loading };
};