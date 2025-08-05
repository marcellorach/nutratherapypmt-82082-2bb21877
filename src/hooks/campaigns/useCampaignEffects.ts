import { useEffect, useCallback } from 'react';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { Campaign, CampaignExecution } from '@/contexts/CampaignContext';

/**
 * Hook para gerenciar efeitos colaterais das campanhas
 */
export const useCampaignEffects = () => {
  const { state, actions } = useCampaignContext();

  // Auto-load campaigns on mount
  useEffect(() => {
    if (state.campaigns.length === 0 && !state.isLoading) {
      actions.loadCampaigns();
    }
  }, [state.campaigns.length, state.isLoading, actions.loadCampaigns]);

  // Monitor active execution
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.activeExecution) {
      interval = setInterval(() => {
        // Simular progresso automático
        if (state.activeExecution && state.activeExecution.progress < 100) {
          const newProgress = Math.min(state.activeExecution.progress + 2, 100);
          // Simplificar para apenas simular progresso sem log
          // actions.addExecutionLog seria implementado quando necessário
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.activeExecution, actions.addExecutionLog]);

  // Cleanup completed executions
  const cleanupCompletedExecution = useCallback(() => {
    if (state.activeExecution && state.activeExecution.progress >= 100) {
      setTimeout(() => {
        actions.stopExecution();
      }, 2000);
    }
  }, [state.activeExecution, actions.stopExecution]);

  useEffect(() => {
    cleanupCompletedExecution();
  }, [cleanupCompletedExecution]);

  return {
    hasActiveExecution: !!state.activeExecution,
    executionProgress: state.activeExecution?.progress || 0,
    isLoadingCampaigns: state.isLoading && state.campaigns.length === 0,
  };
};