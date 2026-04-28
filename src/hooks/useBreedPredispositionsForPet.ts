import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BreedPredispositionInput } from '@/services/biological-timeline-engine';

interface BreedInfo {
  id: string;
  name: string;
  size_category: string | null;
  average_weight_kg: number | null;
  average_lifespan_years: number | null;
}

export interface BreedTimelineContext {
  breed: BreedInfo | null;
  predispositions: BreedPredispositionInput[];
}

/**
 * Resolves a breed by name (PT or EN) and returns its full info plus the
 * canonical list of breed predispositions for the timeline projection.
 */
export function useBreedPredispositionsForPet(breedName: string | null | undefined) {
  return useQuery<BreedTimelineContext>({
    queryKey: ['breed-predispositions-for-pet', breedName],
    enabled: !!breedName,
    queryFn: async () => {
      const trimmed = (breedName || '').trim();
      if (!trimmed) return { breed: null, predispositions: [] };

      // Match against `name` and `name_en` (case-insensitive).
      const { data: breeds, error: breedErr } = await supabase
        .from('breeds')
        .select('id, name, name_en, size_category, average_weight_kg, average_lifespan_years')
        .or(`name.ilike.${trimmed},name_en.ilike.${trimmed}`)
        .limit(1);
      if (breedErr) throw breedErr;
      const breed = breeds?.[0];
      if (!breed) return { breed: null, predispositions: [] };

      const { data: predisp, error: predispErr } = await supabase
        .from('breed_predispositions')
        .select(`
          condition_id,
          risk_factor,
          evidence_grade,
          health_conditions:condition_id (id, name, name_en)
        `)
        .eq('breed_id', breed.id);
      if (predispErr) throw predispErr;

      const predispositions: BreedPredispositionInput[] = (predisp || [])
        .map((row: any) => ({
          condition_id: row.condition_id,
          condition_name: row.health_conditions?.name || '',
          condition_name_en: row.health_conditions?.name_en || null,
          risk_factor: Number(row.risk_factor) || 1,
          evidence_grade: (row.evidence_grade || 'low') as BreedPredispositionInput['evidence_grade'],
        }))
        .filter(p => !!p.condition_name);

      return {
        breed: {
          id: breed.id,
          name: breed.name,
          size_category: breed.size_category,
          average_weight_kg: breed.average_weight_kg,
          average_lifespan_years: breed.average_lifespan_years,
        },
        predispositions,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
