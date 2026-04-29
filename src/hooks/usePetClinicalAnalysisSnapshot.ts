import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicalAnalysisSnapshot {
  id: string;
  pet_id: string;
  status: 'pending' | 'complete' | 'failed';
  analysis_version: string;
  completed_at: string | null;
  confidence_level: string | null;
  recommendation_compounds: any[];
  predispositions: any[];
  lab_alerts: any[];
  interaction_alerts: any[];
  clinical_discoveries: any[];
  kg_triplets: any[];
  kg_pathways: any[];
  kg_projections: any[];
  created_at: string;
  updated_at: string;
}

export function usePetClinicalAnalysisSnapshot(petId: string | null | undefined) {
  return useQuery<ClinicalAnalysisSnapshot | null>({
    queryKey: ['pet-clinical-analysis-snapshot', petId],
    enabled: !!petId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await (supabase as any)
        .from('pet_clinical_analysis_snapshots')
        .select('*')
        .eq('pet_id', petId)
        .maybeSingle();
      if (error) throw error;
      return (data as ClinicalAnalysisSnapshot | null) || null;
    },
  });
}

export function useUpsertPetClinicalAnalysisSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ClinicalAnalysisSnapshot> & { pet_id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const row = {
        pet_id: payload.pet_id,
        status: payload.status || 'complete',
        analysis_version: payload.analysis_version || 'v1',
        completed_at: payload.completed_at || new Date().toISOString(),
        confidence_level: payload.confidence_level ?? null,
        recommendation_compounds: payload.recommendation_compounds || [],
        predispositions: payload.predispositions || [],
        lab_alerts: payload.lab_alerts || [],
        interaction_alerts: payload.interaction_alerts || [],
        clinical_discoveries: payload.clinical_discoveries || [],
        kg_triplets: payload.kg_triplets || [],
        kg_pathways: payload.kg_pathways || [],
        kg_projections: payload.kg_projections || [],
        created_by: user.user?.id || null,
      };
      const { data, error } = await (supabase as any)
        .from('pet_clinical_analysis_snapshots')
        .upsert(row, { onConflict: 'pet_id' })
        .select()
        .single();
      if (error) throw error;
      return data as ClinicalAnalysisSnapshot;
    },
    onSuccess: (snap) => {
      qc.invalidateQueries({ queryKey: ['pet-clinical-analysis-snapshot', snap.pet_id] });
      qc.invalidateQueries({ queryKey: ['pet-trajectory-projection', snap.pet_id] });
    },
  });
}
