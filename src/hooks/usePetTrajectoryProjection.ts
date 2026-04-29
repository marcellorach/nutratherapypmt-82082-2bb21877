import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIProjectionYear {
  year: number;
  age_at_year: number;
  biological_age: number;
  expected_remaining_years: number;
  existing_conditions: Array<{
    name: string;
    projected_severity_score: number;
    projected_severity_label: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
  new_conditions: Array<{
    name: string;
    probability: number;
    evidence_grade?: string;
    rationale?: string;
  }>;
}

export interface AIProjectionCitation {
  type: 'kg_evidence' | 'breed_predisposition' | 'gompertz_curve';
  summary: string;
  related_condition?: string;
  related_compound?: string;
}

export interface AIYearsGainedBreakdown {
  condition: string;
  years_contribution: number;
  anchor_compound?: string;
  citation?: string;
}

export interface AIProtocolCaveat {
  type: 'polypharmacy' | 'adherence' | 'no_kg_coverage' | 'partial_coverage' | 'contraindication';
  message: string;
  related_condition?: string;
}

export interface AIProjectionResult {
  source: 'ai_kg_grounded' | 'heuristic_fallback';
  cached: boolean;
  model_used: string | null;
  projection: {
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
    years_gained_total?: number;
    years_gained?: number;
    years_gained_breakdown?: AIYearsGainedBreakdown[];
    protocol_caveats?: AIProtocolCaveat[];
    years: AIProjectionYear[];
    years_with_protocol?: AIProjectionYear[];
    years_without_protocol?: AIProjectionYear[];
    coverage_by_condition?: AICoverageEntry[];
    citations: AIProjectionCitation[];
  } | null;
  citations: AIProjectionCitation[];
  years_gained: number | null;
  years_gained_breakdown?: AIYearsGainedBreakdown[];
  protocol_caveats?: AIProtocolCaveat[];
  confidence?: 'high' | 'medium' | 'low' | null;
  coverage_by_condition?: AICoverageEntry[];
  years_with_protocol?: AIProjectionYear[];
  years_without_protocol?: AIProjectionYear[];
  baseline_biological_age: number | null;
  baseline_remaining_years: number | null;
  error?: string;
}

export interface AICoverageEntry {
  condition: string;
  origin?: 'active' | 'predisposition';
  kg_covered: boolean;
  supporting_compounds?: string[];
  best_efficacy_0_5?: number;
}

/**
 * Calls the `project-pet-trajectory` edge function (Lovable AI / Gemini 2.5 Pro
 * grounded in the KG and breed predispositions). Cached for 7 days server-side
 * via `pet_trajectory_projections`; on the client we cache 5 minutes per
 * (petId × intervention) tuple to avoid extra hits while the user toggles.
 */
export function usePetTrajectoryProjection(
  petId: string | null | undefined,
  recommendedCompounds: string[] | null,
  enabled: boolean = true,
) {
  const stackKey = (recommendedCompounds || []).slice().sort().join('|');
  return useQuery<AIProjectionResult>({
    queryKey: ['pet-trajectory-projection', petId, stackKey],
    enabled: !!petId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('project-pet-trajectory', {
        body: {
          pet_id: petId,
          with_intervention: true, // legacy flag; function now returns both
          recommended_compounds: recommendedCompounds || [],
          max_years_ahead: 8,
        },
      });
      if (error) throw error;
      return data as AIProjectionResult;
    },
  });
}