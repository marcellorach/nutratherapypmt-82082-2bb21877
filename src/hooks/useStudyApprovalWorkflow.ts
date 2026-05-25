import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface WorkflowResult {
  tripletsApproved: number;
  edgesCreated: number;
  tripletsSynced: number;
}

export const useStudyApprovalWorkflow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<Array<{ ts: string; level: 'info' | 'success' | 'warn' | 'error'; message: string }>>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const pushLog = (level: 'info' | 'success' | 'warn' | 'error', message: string) => {
    const ts = new Date().toLocaleTimeString();
    // eslint-disable-next-line no-console
    console.log(`[ApprovalWorkflow ${level.toUpperCase()}] ${message}`);
    setLogs(prev => [...prev, { ts, level, message }]);
  };
  const clearLogs = () => setLogs([]);

  /**
   * Auto-approves high-confidence triplets for a specific study
   */
  const autoApproveTriplets = async (studyId: string, threshold: number = 0.7): Promise<number> => {
    const { data, error } = await supabase
      .from('triplet_extractions')
      .update({
        curation_status: 'approved',
        auto_approved: true,
        review_date: new Date().toISOString(),
        review_notes: `Auto-approved by workflow (confidence >= ${(threshold * 100).toFixed(0)}%)`
      })
      .eq('study_id', studyId)
      .gte('extraction_confidence', threshold)
      .eq('curation_status', 'pending')
      .select('id');

    if (error) {
      console.error('Error auto-approving triplets:', error);
      throw error;
    }

    return data?.length || 0;
  };

  /**
   * Executes the consolidate-knowledge-graph edge function
   */
  const consolidateKnowledgeGraph = async (): Promise<number> => {
    const { data, error } = await supabase.functions.invoke('consolidate-knowledge-graph', {
      body: {}
    });

    if (error) {
      console.error('Error consolidating knowledge graph:', error);
      throw error;
    }

    return data?.edges_created || 0;
  };

  /**
   * Syncs approved triplets to Neo4j for a specific study
   */
  const syncToNeo4j = async (studyId: string): Promise<number> => {
    const { data, error } = await supabase.functions.invoke('sync-study-to-neo4j', {
      body: { studyId }
    });

    if (error) {
      console.error('Error syncing to Neo4j:', error);
      throw error;
    }

    return data?.triplets_synced || 0;
  };

  /**
   * Executes the full approval workflow:
   * 1. Updates study status to 'approved'
   * 2. Auto-approves high-confidence triplets
   * 3. Consolidates knowledge graph
   * 4. Syncs to Neo4j
   */
  const executeApprovalWorkflow = async (studyId: string, threshold: number = 0.7): Promise<WorkflowResult> => {
    setIsProcessing(true);
    clearLogs();
    const t0 = Date.now();

    try {
      // Step 1: Update study status to approved + audit trail
      pushLog('info', `[1/4] Atualizando status do estudo para 'approved'…`);
      const { data: userData } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('processed_studies')
        .update({
          kanban_status: 'approved',
          curated_at: new Date().toISOString(),
          curated_by: userData?.user?.id ?? null,
        })
        .eq('id', studyId);

      if (updateError) throw updateError;
      pushLog('success', `[1/4] Status atualizado (estudo ${studyId.slice(0, 8)}…)`);

      // Step 2: Auto-approve high-confidence triplets
      pushLog('info', `[2/4] Auto-aprovando triplets com confiança ≥ ${(threshold * 100).toFixed(0)}%…`);
      const tripletsApproved = await autoApproveTriplets(studyId, threshold);
      pushLog('success', `[2/4] ${tripletsApproved} triplet(s) auto-aprovado(s)`);

      // Step 3: Consolidate knowledge graph
      let edgesCreated = 0;
      try {
        pushLog('info', `[3/4] Consolidando knowledge graph (edge function)…`);
        edgesCreated = await consolidateKnowledgeGraph();
        pushLog('success', `[3/4] Consolidação concluída — ${edgesCreated} edge(s) processada(s)`);
      } catch (e) {
        console.warn('Consolidation skipped or failed:', e);
        pushLog('warn', `[3/4] Consolidação falhou/ignorada: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Step 4: Sync to Neo4j
      let tripletsSynced = 0;
      try {
        pushLog('info', `[4/4] Sincronizando com Neo4j…`);
        tripletsSynced = await syncToNeo4j(studyId);
        pushLog('success', `[4/4] Sync Neo4j concluído — ${tripletsSynced} triplet(s) sincronizado(s)`);
      } catch (e) {
        console.warn('Neo4j sync skipped or failed:', e);
        pushLog('warn', `[4/4] Sync Neo4j falhou/ignorado: ${e instanceof Error ? e.message : String(e)}`);
      }

      pushLog('success', `Workflow concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      return { tripletsApproved, edgesCreated, tripletsSynced };
    } catch (error) {
      console.error('Error in approval workflow:', error);
      pushLog('error', `Workflow abortado: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Gets the approval history and stages for a study
   */
  const getApprovalStages = async (studyId: string) => {
    // Fetch triplet stats
    const { data: triplets } = await supabase
      .from('triplet_extractions')
      .select('curation_status, created_at, review_date')
      .eq('study_id', studyId);

    // Fetch study data
    const { data: study } = await supabase
      .from('processed_studies')
      .select('created_at, kanban_status, analysis_data, full_text_metadata')
      .eq('id', studyId)
      .single();

    const stages = [];
    
    // Stage 1: Upload/Import
    stages.push({
      name: 'Upload/Importação',
      status: 'completed',
      date: study?.created_at
    });

    // Stage 2: AI Analysis
    const hasAnalysisData = study?.analysis_data && Object.keys(study.analysis_data).length > 0;
    stages.push({
      name: 'Análise IA',
      status: hasAnalysisData ? 'completed' : 'pending',
      date: hasAnalysisData ? study?.created_at : null
    });

    // Stage 3: Triplet Extraction
    const hasTriplets = triplets && triplets.length > 0;
    stages.push({
      name: 'Extração de Triplets',
      status: hasTriplets ? 'completed' : 'pending',
      count: triplets?.length || 0
    });

    // Stage 4: Triplet Curation
    const approvedTriplets = triplets?.filter(t => t.curation_status === 'approved').length || 0;
    const pendingTriplets = triplets?.filter(t => t.curation_status === 'pending').length || 0;
    stages.push({
      name: 'Curadoria de Triplets',
      status: approvedTriplets > 0 ? (pendingTriplets > 0 ? 'in-progress' : 'completed') : 'pending',
      approved: approvedTriplets,
      pending: pendingTriplets
    });

    // Stage 5: Final Approval
    stages.push({
      name: 'Aprovação Final',
      status: study?.kanban_status === 'approved' ? 'completed' : 'pending'
    });

    return { stages, study, triplets };
  };

  return {
    isProcessing,
    logs,
    clearLogs,
    executeApprovalWorkflow,
    autoApproveTriplets,
    consolidateKnowledgeGraph,
    syncToNeo4j,
    getApprovalStages
  };
};
