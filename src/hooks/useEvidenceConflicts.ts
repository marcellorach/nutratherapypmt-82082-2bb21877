import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  analyzeClaimsForConflicts, 
  EvidenceClaim, 
  ConflictAnalysis,
  detectConflictsInClaims,
  ConflictDetectionResult 
} from '@/services/conflict-detection-service';

export interface EvidenceConflict {
  id: string;
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  species_context: string[];
  claim_count: number;
  study_count: number;
  conflict_level: 'none' | 'low' | 'moderate' | 'high';
  variance_coefficient: number | null;
  agreement_score: number | null;
  claim_ids: string[];
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  resolution_id: string | null;
  ai_suggestion: string | null;
  ai_recommended_action: string | null;
  assigned_to: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceClaimDB {
  id: string;
  subject_name: string;
  subject_type: string;
  subject_id: string | null;
  predicate: string;
  object_name: string;
  object_type: string;
  object_id: string | null;
  species_context: string[] | null;
  breed_context: string[] | null;
  age_context: string | null;
  study_id: string | null;
  study_quality_score: number | null;
  study_year: number | null;
  dose_value: number | null;
  dose_min: number | null;
  dose_max: number | null;
  dose_unit: string | null;
  dose_frequency: string | null;
  dose_duration: string | null;
  dose_route: string | null;
  extraction_confidence: number | null;
  triplet_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useEvidenceConflicts(options?: {
  status?: EvidenceConflict['status'];
  conflictLevel?: EvidenceConflict['conflict_level'];
}) {
  const queryClient = useQueryClient();

  // Fetch conflicts from database
  const conflictsQuery = useQuery({
    queryKey: ['evidence-conflicts', options?.status, options?.conflictLevel],
    queryFn: async () => {
      let query = supabase
        .from('evidence_conflicts')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.conflictLevel) {
        query = query.eq('conflict_level', options.conflictLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EvidenceConflict[];
    },
  });

  // Fetch pending conflicts count
  const pendingCountQuery = useQuery({
    queryKey: ['evidence-conflicts-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('evidence_conflicts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch claims for a specific conflict
  const fetchClaimsForConflict = async (claimIds: string[]): Promise<EvidenceClaimDB[]> => {
    if (claimIds.length === 0) return [];

    const { data, error } = await supabase
      .from('evidence_claims')
      .select('*')
      .in('id', claimIds);

    if (error) throw error;
    return data as EvidenceClaimDB[];
  };

  // Update conflict status
  const updateConflictStatus = useMutation({
    mutationFn: async ({
      conflictId,
      status,
      reviewNotes,
    }: {
      conflictId: string;
      status: EvidenceConflict['status'];
      reviewNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('evidence_conflicts')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', conflictId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts-pending-count'] });
    },
  });

  // Dismiss a conflict
  const dismissConflict = useMutation({
    mutationFn: async ({
      conflictId,
      reason,
    }: {
      conflictId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('evidence_conflicts')
        .update({
          status: 'dismissed',
          review_notes: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', conflictId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts-pending-count'] });
    },
  });

  // Create a new conflict record
  const createConflict = useMutation({
    mutationFn: async (result: ConflictDetectionResult) => {
      const { data, error } = await supabase
        .from('evidence_conflicts')
        .upsert({
          subject_name: result.subjectName,
          subject_type: result.subjectType,
          predicate: result.predicate,
          object_name: result.objectName,
          object_type: result.objectType,
          species_context: result.speciesContext,
          claim_count: result.analysis.claimCount,
          study_count: result.analysis.studyCount,
          conflict_level: result.analysis.doseConflictLevel,
          variance_coefficient: result.analysis.doseVarianceCoefficient,
          agreement_score: result.analysis.agreementScore,
          claim_ids: result.claims.map(c => c.id),
          ai_suggestion: result.analysis.humanGuidance,
          ai_recommended_action: result.analysis.recommendedAction,
          status: 'pending',
        }, {
          onConflict: 'subject_name,predicate,object_name,species_context',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts-pending-count'] });
    },
  });

  return {
    conflicts: conflictsQuery.data || [],
    isLoading: conflictsQuery.isLoading,
    error: conflictsQuery.error,
    pendingCount: pendingCountQuery.data || 0,
    isPendingCountLoading: pendingCountQuery.isLoading,
    fetchClaimsForConflict,
    updateConflictStatus,
    dismissConflict,
    createConflict,
    refetch: () => {
      conflictsQuery.refetch();
      pendingCountQuery.refetch();
    },
  };
}

// Hook for fetching all claims and detecting conflicts locally
export function useConflictDetection() {
  const queryClient = useQueryClient();

  const detectConflicts = useMutation({
    mutationFn: async (): Promise<ConflictDetectionResult[]> => {
      // Fetch all evidence claims
      const { data: claims, error } = await supabase
        .from('evidence_claims')
        .select('*');

      if (error) throw error;

      // Convert to service format
      const serviceClaims: EvidenceClaim[] = (claims || []).map(c => ({
        id: c.id,
        subject_name: c.subject_name,
        subject_type: c.subject_type,
        predicate: c.predicate,
        object_name: c.object_name,
        object_type: c.object_type,
        species_context: c.species_context || [],
        study_id: c.study_id,
        study_quality_score: c.study_quality_score,
        study_year: c.study_year,
        dose_value: c.dose_value,
        dose_min: c.dose_min,
        dose_max: c.dose_max,
        dose_unit: c.dose_unit,
        dose_frequency: c.dose_frequency,
        dose_duration: c.dose_duration,
        dose_route: c.dose_route,
        extraction_confidence: c.extraction_confidence,
        triplet_id: c.triplet_id,
      }));

      // Detect conflicts
      return detectConflictsInClaims(serviceClaims);
    },
  });

  return {
    detectConflicts,
    isDetecting: detectConflicts.isPending,
    detectionResults: detectConflicts.data,
    detectionError: detectConflicts.error,
  };
}
