import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface StudyToDelete {
  id: string;
  title: string;
  kanban_status: string;
}

interface DeletionResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

export const useStudyDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Soft delete de um único estudo
   */
  const softDeleteStudy = async (studyId: string, userId?: string): Promise<DeletionResult> => {
    setIsDeleting(true);
    try {
      // Buscar dados do estudo para auditoria
      const { data: studyData, error: fetchError } = await supabase
        .from('processed_studies')
        .select('id, title, kanban_status')
        .eq('id', studyId)
        .single();

      if (fetchError) throw fetchError;

      // Executar soft delete
      const { error: deleteError } = await supabase
        .from('processed_studies')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId || null
        })
        .eq('id', studyId);

      if (deleteError) throw deleteError;

      // Registrar auditoria
      await supabase.from('study_audit_logs').insert({
        action_type: 'delete',
        study_ids: [studyId],
        study_titles: [studyData?.title || 'Unknown'],
        previous_status: [studyData?.kanban_status || 'unknown'],
        performed_by: userId || null,
        metadata: { single_delete: true }
      });

      toast({
        title: t('studies.deletion.success'),
        description: t('studies.deletion.movedToTrash'),
      });

      return { success: true, deletedCount: 1 };
    } catch (error: any) {
      console.error('Error soft deleting study:', error);
      toast({
        title: t('studies.deletion.error'),
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, deletedCount: 0, error: error.message };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Soft delete em massa de múltiplos estudos
   * IMPORTANTE: Requer confirmação extra e valida os estudos antes de deletar
   */
  const softDeleteMultiple = async (
    studyIds: string[], 
    userId?: string,
    options?: {
      allowApproved?: boolean; // Por padrão, bloqueia delete de approved
    }
  ): Promise<DeletionResult> => {
    if (studyIds.length === 0) {
      return { success: false, deletedCount: 0, error: 'No studies selected' };
    }

    setIsDeleting(true);
    try {
      // Buscar dados dos estudos para validação e auditoria
      const { data: studies, error: fetchError } = await supabase
        .from('processed_studies')
        .select('id, title, kanban_status')
        .in('id', studyIds)
        .is('deleted_at', null); // Só estudos não deletados

      if (fetchError) throw fetchError;

      if (!studies || studies.length === 0) {
        return { success: false, deletedCount: 0, error: 'No valid studies found' };
      }

      // Verificar se há estudos "approved" - bloquear por padrão
      const approvedStudies = studies.filter(s => s.kanban_status === 'approved');
      if (approvedStudies.length > 0 && !options?.allowApproved) {
        const titles = approvedStudies.map(s => s.title).join(', ');
        throw new Error(
          t('studies.deletion.cannotDeleteApproved', { 
            count: approvedStudies.length,
            titles 
          })
        );
      }

      // Executar soft delete em massa
      const { error: deleteError } = await supabase
        .from('processed_studies')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId || null
        })
        .in('id', studies.map(s => s.id));

      if (deleteError) throw deleteError;

      // Registrar auditoria
      await supabase.from('study_audit_logs').insert({
        action_type: 'bulk_delete',
        study_ids: studies.map(s => s.id),
        study_titles: studies.map(s => s.title || 'Unknown'),
        previous_status: studies.map(s => s.kanban_status || 'unknown'),
        performed_by: userId || null,
        metadata: { 
          bulk_delete: true, 
          original_selection_count: studyIds.length,
          actual_deleted_count: studies.length
        }
      });

      toast({
        title: t('studies.deletion.bulkSuccess'),
        description: t('studies.deletion.bulkMovedToTrash', { count: studies.length }),
      });

      return { success: true, deletedCount: studies.length };
    } catch (error: any) {
      console.error('Error bulk soft deleting studies:', error);
      toast({
        title: t('studies.deletion.bulkError'),
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, deletedCount: 0, error: error.message };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Restaurar estudos da lixeira
   */
  const restoreStudies = async (studyIds: string[], userId?: string): Promise<DeletionResult> => {
    if (studyIds.length === 0) {
      return { success: false, deletedCount: 0, error: 'No studies selected' };
    }

    setIsDeleting(true);
    try {
      // Buscar dados dos estudos deletados
      const { data: studies, error: fetchError } = await supabase
        .from('processed_studies')
        .select('id, title, kanban_status')
        .in('id', studyIds)
        .not('deleted_at', 'is', null);

      if (fetchError) throw fetchError;

      if (!studies || studies.length === 0) {
        return { success: false, deletedCount: 0, error: 'No deleted studies found' };
      }

      // Restaurar
      const { error: restoreError } = await supabase
        .from('processed_studies')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .in('id', studies.map(s => s.id));

      if (restoreError) throw restoreError;

      // Registrar auditoria
      await supabase.from('study_audit_logs').insert({
        action_type: 'restore',
        study_ids: studies.map(s => s.id),
        study_titles: studies.map(s => s.title || 'Unknown'),
        previous_status: ['deleted'],
        performed_by: userId || null,
        metadata: { restored_count: studies.length }
      });

      toast({
        title: t('studies.deletion.restoreSuccess'),
        description: t('studies.deletion.studiesRestored', { count: studies.length }),
      });

      return { success: true, deletedCount: studies.length };
    } catch (error: any) {
      console.error('Error restoring studies:', error);
      toast({
        title: t('studies.deletion.restoreError'),
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, deletedCount: 0, error: error.message };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Obter estudos deletados (lixeira)
   */
  const getDeletedStudies = async (): Promise<StudyToDelete[]> => {
    try {
      const { data, error } = await supabase
        .from('processed_studies')
        .select('id, title, kanban_status, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deleted studies:', error);
      return [];
    }
  };

  /**
   * Verificar quais estudos seriam afetados antes de deletar
   */
  const previewDeletion = async (studyIds: string[]): Promise<StudyToDelete[]> => {
    try {
      const { data, error } = await supabase
        .from('processed_studies')
        .select('id, title, kanban_status')
        .in('id', studyIds)
        .is('deleted_at', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error previewing deletion:', error);
      return [];
    }
  };

  return {
    isDeleting,
    softDeleteStudy,
    softDeleteMultiple,
    restoreStudies,
    getDeletedStudies,
    previewDeletion
  };
};
