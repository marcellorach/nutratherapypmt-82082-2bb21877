import { useMemo, useCallback } from 'react';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { Campaign, CampaignMetrics } from '@/contexts/CampaignContext';
import { useCampaignEffects } from './useCampaignEffects';

/**
 * Hook personalizado para gerenciar campanhas com lógica de negócio
 */
export const useCampaignManager = () => {
  const { state, actions } = useCampaignContext();
  const effects = useCampaignEffects();

  // Memoized computed values
  const activeCampaigns = useMemo(() => 
    state.campaigns.filter(c => c.status === 'running'), 
    [state.campaigns]
  );
  
  const completedCampaigns = useMemo(() => 
    state.campaigns.filter(c => c.status === 'completed'), 
    [state.campaigns]
  );
  
  const draftCampaigns = useMemo(() => 
    state.campaigns.filter(c => c.status === 'draft'), 
    [state.campaigns]
  );
  
  const totalMetrics = useMemo(() => {
    const metrics = state.campaigns.reduce(
      (acc, campaign) => {
        if (campaign.metrics) {
          acc.totalProcessed += campaign.metrics.totalProcessed;
          acc.totalSavings += campaign.metrics.estimatedSavings;
          acc.avgSuccessRate += campaign.metrics.successRate;
        }
        return acc;
      },
      { totalProcessed: 0, totalSavings: 0, avgSuccessRate: 0 }
    );

    if (state.campaigns.length > 0) {
      metrics.avgSuccessRate = metrics.avgSuccessRate / state.campaigns.length;
    }

    return metrics;
  }, [state.campaigns]);

  // Memoized helper functions
  const getCampaignById = useCallback((id: string) => {
    return state.campaigns.find(c => c.id === id);
  }, [state.campaigns]);

  const getCampaignsByType = useCallback((type: Campaign['type']) => {
    return state.campaigns.filter(c => c.type === type);
  }, [state.campaigns]);

  const getRecentCampaigns = useCallback((limit: number = 5) => {
    return [...state.campaigns]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }, [state.campaigns]);

  const canExecuteCampaign = useCallback((campaignId: string) => {
    const campaign = getCampaignById(campaignId);
    return campaign?.status === 'draft' && !state.activeExecution;
  }, [getCampaignById, state.activeExecution]);

  return {
    // State
    campaigns: state.campaigns,
    activeCampaigns,
    completedCampaigns,
    draftCampaigns,
    selectedCampaign: state.selectedCampaign,
    activeExecution: state.activeExecution,
    isLoading: state.isLoading,
    error: state.error,
    
    // Computed metrics
    totalMetrics,
    
    // Effects
    ...effects,
    
    // Actions
    loadCampaigns: actions.loadCampaigns,
    createCampaign: actions.createCampaign,
    updateCampaign: actions.updateCampaign,
    deleteCampaign: actions.deleteCampaign,
    selectCampaign: actions.selectCampaign,
    executeCampaign: actions.executeCampaign,
    stopExecution: actions.stopExecution,
    addExecutionLog: actions.addExecutionLog,
    
    // Helpers
    getCampaignById,
    getCampaignsByType,
    getRecentCampaigns,
    canExecuteCampaign,
  };
};