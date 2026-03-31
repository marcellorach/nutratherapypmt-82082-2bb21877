import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BaseKnowledgeCandidate {
  id: string;
  entity_name: string;
  entity_name_en: string | null;
  entity_type: string;
  external_source: string;
  external_id: string | null;
  external_url: string | null;
  chemical_formula: string | null;
  molecular_weight: number | null;
  description: string | null;
  description_en: string | null;
  synonyms: string[];
  source_metadata: Record<string, unknown>;
  status: string;
  target_table: string | null;
  target_id: string | null;
  matched_existing_id: string | null;
  similarity_score: number | null;
  harmonization_suggestion: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidateInput {
  entity_name: string;
  entity_name_en?: string;
  entity_type: string;
  external_source: string;
  external_id?: string;
  external_url?: string;
  chemical_formula?: string;
  molecular_weight?: number;
  description?: string;
  description_en?: string;
  synonyms?: string[];
  source_metadata?: Record<string, unknown>;
  matched_existing_id?: string;
  similarity_score?: number;
  harmonization_suggestion?: string;
}

// Fetch all candidates with optional status filter
export function useBaseKnowledgeCandidates(status?: string) {
  return useQuery({
    queryKey: ['base-knowledge-candidates', status],
    queryFn: async () => {
      let query = supabase
        .from('base_knowledge_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BaseKnowledgeCandidate[];
    }
  });
}

// Fetch candidates stats
export function useCandidatesStats() {
  return useQuery({
    queryKey: ['base-knowledge-candidates-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('base_knowledge_candidates')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(c => c.status === 'pending').length,
        approved: data.filter(c => c.status === 'approved').length,
        rejected: data.filter(c => c.status === 'rejected').length,
        merged: data.filter(c => c.status === 'merged').length
      };

      return stats;
    }
  });
}

// Create new candidate
export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCandidateInput) => {
      const { data, error } = await supabase
        .from('base_knowledge_candidates')
        .insert({
          entity_name: input.entity_name,
          entity_name_en: input.entity_name_en || null,
          entity_type: input.entity_type,
          external_source: input.external_source,
          external_id: input.external_id || null,
          external_url: input.external_url || null,
          chemical_formula: input.chemical_formula || null,
          molecular_weight: input.molecular_weight || null,
          description: input.description || null,
          description_en: input.description_en || null,
          synonyms: input.synonyms || [],
          source_metadata: (input.source_metadata || {}) as unknown as import('@/integrations/supabase/types').Json,
          matched_existing_id: input.matched_existing_id || null,
          similarity_score: input.similarity_score || null,
          harmonization_suggestion: input.harmonization_suggestion || null
        })
        .select()
        .single();

      if (error) throw error;
      return data as BaseKnowledgeCandidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates-stats'] });
      toast.success('Candidato adicionado à fila');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar candidato: ${error.message}`);
    }
  });
}

// Update candidate status
export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      review_notes,
      target_table,
      target_id 
    }: { 
      id: string; 
      status: string; 
      review_notes?: string;
      target_table?: string;
      target_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('base_knowledge_candidates')
        .update({
          status,
          review_notes,
          target_table,
          target_id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BaseKnowledgeCandidate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates-stats'] });
      
      const statusMessages: Record<string, string> = {
        approved: 'Candidato aprovado',
        rejected: 'Candidato rejeitado',
        merged: 'Candidato mesclado'
      };
      toast.success(statusMessages[data.status] || 'Status atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });
}

// Approve candidate and create entity in target table
export function useApproveCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      candidate,
      targetTable 
    }: { 
      candidate: BaseKnowledgeCandidate;
      targetTable: 'nutraceuticals' | 'health_conditions' | 'veterinary_ontology';
    }) => {
      let targetId: string | null = null;

      // Create entity in target table
      // Extract standardized codes from source_metadata if available
      const sourceMetadata = candidate.source_metadata || {};
      const candidateCui = (sourceMetadata as Record<string, unknown>).cui as string | undefined;
      const candidateSnomed = (sourceMetadata as Record<string, unknown>).snomed_code as string | undefined;
      const ontologyAudit = {
        ...(candidateSnomed ? { snomed_code: candidateSnomed } : {}),
        ...(candidateCui ? { umls_cui: candidateCui } : {}),
        ...((candidateSnomed || candidateCui) ? {
          ontology_mapping_source: candidate.external_source,
          ontology_mapped_at: new Date().toISOString(),
        } : {})
      };

      if (targetTable === 'nutraceuticals') {
        // Dedup check
        if (candidateSnomed) {
          const { data: existing } = await supabase.from('nutraceuticals').select('id, name').eq('snomed_code', candidateSnomed).limit(1);
          if (existing && existing.length > 0) throw new Error(`SNOMED ${candidateSnomed} já atribuído a "${existing[0].name}"`);
        }
        if (candidateCui) {
          const { data: existing } = await supabase.from('nutraceuticals').select('id, name').eq('umls_cui', candidateCui).limit(1);
          if (existing && existing.length > 0) throw new Error(`UMLS CUI ${candidateCui} já atribuído a "${existing[0].name}"`);
        }

        const { data, error } = await supabase
          .from('nutraceuticals')
          .insert({
            name: candidate.entity_name,
            name_en: candidate.entity_name_en || candidate.entity_name,
            description: candidate.description,
            description_en: candidate.description_en,
            chemical_compound: candidate.chemical_formula,
            source: candidate.external_source,
            ...ontologyAudit
          })
          .select('id')
          .single();

        if (error) throw error;
        targetId = data.id;
      } else if (targetTable === 'health_conditions') {
        const { data, error } = await supabase
          .from('health_conditions')
          .insert({
            name: candidate.entity_name,
            name_en: candidate.entity_name_en || candidate.entity_name,
            description: candidate.description,
            description_en: candidate.description_en
          })
          .select('id')
          .single();

        if (error) throw error;
        targetId = data.id;
      } else if (targetTable === 'veterinary_ontology') {
        const { data, error } = await supabase
          .from('veterinary_ontology')
          .insert({
            entity_id: candidate.external_id || `manual_${Date.now()}`,
            entity_name: candidate.entity_name,
            entity_name_en: candidate.entity_name_en || candidate.entity_name,
            entity_type: candidate.entity_type,
            canonical_name: candidate.entity_name,
            description: candidate.description,
            description_en: candidate.description_en,
            synonyms: candidate.synonyms,
            source: candidate.external_source,
            external_ids: { [candidate.external_source]: candidate.external_id }
          })
          .select('id')
          .single();

        if (error) throw error;
        targetId = data.id;
      }

      // Update candidate status
      const { data: updatedCandidate, error: updateError } = await supabase
        .from('base_knowledge_candidates')
        .update({
          status: 'approved',
          target_table: targetTable,
          target_id: targetId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', candidate.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { candidate: updatedCandidate, targetId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates-stats'] });
      queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
      queryClient.invalidateQueries({ queryKey: ['health-conditions'] });
      queryClient.invalidateQueries({ queryKey: ['veterinary-ontology'] });
      toast.success('Candidato aprovado e entidade criada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar candidato: ${error.message}`);
    }
  });
}

// Delete candidate
export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('base_knowledge_candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['base-knowledge-candidates-stats'] });
      toast.success('Candidato removido');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover candidato: ${error.message}`);
    }
  });
}
