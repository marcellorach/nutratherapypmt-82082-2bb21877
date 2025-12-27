import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface CanonicalResolution {
  id: string;
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  species_context: string[];
  breed_context: string[];
  resolution_type: 'single_study' | 'weighted_average' | 'context_specific' | 'manual_value';
  canonical_value: {
    dose_min?: number;
    dose_max?: number;
    dose_unit?: string;
    dose_frequency?: string;
    dose_duration?: string;
    dose_route?: string;
    notes?: string;
  };
  source_study_ids: string[];
  source_claim_ids: string[];
  rationale: string;
  resolved_by: string | null;
  resolved_at: string;
  is_active: boolean;
  superseded_by: string | null;
  review_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResolutionInput {
  subjectName: string;
  subjectType: string;
  predicate: string;
  objectName: string;
  objectType: string;
  speciesContext?: string[];
  breedContext?: string[];
  resolutionType: CanonicalResolution['resolution_type'];
  canonicalValue: CanonicalResolution['canonical_value'];
  sourceStudyIds?: string[];
  sourceClaimIds?: string[];
  rationale: string;
  conflictId?: string; // If resolving a conflict
}

export function useCanonicalResolutions(options?: {
  subjectName?: string;
  predicate?: string;
  objectName?: string;
  activeOnly?: boolean;
}) {
  const queryClient = useQueryClient();

  // Fetch resolutions
  const resolutionsQuery = useQuery({
    queryKey: ['canonical-resolutions', options],
    queryFn: async () => {
      let query = supabase
        .from('canonical_resolutions')
        .select('*')
        .order('resolved_at', { ascending: false });

      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      if (options?.subjectName) {
        query = query.ilike('subject_name', options.subjectName);
      }

      if (options?.predicate) {
        query = query.eq('predicate', options.predicate);
      }

      if (options?.objectName) {
        query = query.ilike('object_name', options.objectName);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse canonical_value from JSON
      return (data || []).map(r => ({
        ...r,
        canonical_value: typeof r.canonical_value === 'string' 
          ? JSON.parse(r.canonical_value) 
          : r.canonical_value || {},
      })) as CanonicalResolution[];
    },
  });

  // Create a new resolution
  const createResolution = useMutation({
    mutationFn: async (input: CreateResolutionInput) => {
      // First, create the resolution
      const { data: resolution, error: resError } = await supabase
        .from('canonical_resolutions')
        .insert({
          subject_name: input.subjectName,
          subject_type: input.subjectType,
          predicate: input.predicate,
          object_name: input.objectName,
          object_type: input.objectType,
          species_context: input.speciesContext || [],
          breed_context: input.breedContext || [],
          resolution_type: input.resolutionType,
          canonical_value: input.canonicalValue as unknown as Json,
          source_study_ids: input.sourceStudyIds || [],
          source_claim_ids: input.sourceClaimIds || [],
          rationale: input.rationale,
          resolved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (resError) throw resError;

      // If this resolves a conflict, update the conflict status
      if (input.conflictId) {
        const { error: conflictError } = await supabase
          .from('evidence_conflicts')
          .update({
            status: 'resolved',
            resolution_id: resolution.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', input.conflictId);

        if (conflictError) {
          console.error('Failed to update conflict status:', conflictError);
        }
      }

      return resolution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canonical-resolutions'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-conflicts-pending-count'] });
    },
  });

  // Update an existing resolution
  const updateResolution = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<CanonicalResolution, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.canonical_value) {
        dbUpdates.canonical_value = updates.canonical_value as unknown as Json;
      }
      if (updates.rationale !== undefined) dbUpdates.rationale = updates.rationale;
      if (updates.resolution_type !== undefined) dbUpdates.resolution_type = updates.resolution_type;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.review_due_at !== undefined) dbUpdates.review_due_at = updates.review_due_at;

      const { data, error } = await supabase
        .from('canonical_resolutions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canonical-resolutions'] });
    },
  });

  // Supersede a resolution with a new one
  const supersedeResolution = useMutation({
    mutationFn: async ({
      oldResolutionId,
      newResolution,
    }: {
      oldResolutionId: string;
      newResolution: CreateResolutionInput;
    }) => {
      // Create new resolution
      const { data: newRes, error: createError } = await supabase
        .from('canonical_resolutions')
        .insert({
          subject_name: newResolution.subjectName,
          subject_type: newResolution.subjectType,
          predicate: newResolution.predicate,
          object_name: newResolution.objectName,
          object_type: newResolution.objectType,
          species_context: newResolution.speciesContext || [],
          breed_context: newResolution.breedContext || [],
          resolution_type: newResolution.resolutionType,
          canonical_value: newResolution.canonicalValue as unknown as Json,
          source_study_ids: newResolution.sourceStudyIds || [],
          source_claim_ids: newResolution.sourceClaimIds || [],
          rationale: newResolution.rationale,
          resolved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Mark old resolution as superseded
      const { error: updateError } = await supabase
        .from('canonical_resolutions')
        .update({
          is_active: false,
          superseded_by: newRes.id,
        })
        .eq('id', oldResolutionId);

      if (updateError) throw updateError;

      return newRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canonical-resolutions'] });
    },
  });

  // Get resolution for a specific relationship
  const getResolutionForRelationship = async (
    subjectName: string,
    predicate: string,
    objectName: string,
    speciesContext?: string[]
  ): Promise<CanonicalResolution | null> => {
    let query = supabase
      .from('canonical_resolutions')
      .select('*')
      .eq('is_active', true)
      .ilike('subject_name', subjectName)
      .eq('predicate', predicate)
      .ilike('object_name', objectName);

    if (speciesContext && speciesContext.length > 0) {
      query = query.contains('species_context', speciesContext);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    
    if (!data) return null;

    return {
      ...data,
      canonical_value: typeof data.canonical_value === 'string'
        ? JSON.parse(data.canonical_value)
        : data.canonical_value || {},
    } as CanonicalResolution;
  };

  return {
    resolutions: resolutionsQuery.data || [],
    isLoading: resolutionsQuery.isLoading,
    error: resolutionsQuery.error,
    createResolution,
    updateResolution,
    supersedeResolution,
    getResolutionForRelationship,
    refetch: resolutionsQuery.refetch,
  };
}
