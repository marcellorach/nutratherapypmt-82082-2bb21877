import { useEffect } from 'react';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { Campaign, CampaignMetrics } from '@/contexts/CampaignContext';

/**
 * Hook personalizado para gerenciar campanhas com lógica de negócio
 */
export const useCampaignManager = () => {
  const { state, actions } = useCampaignContext();

  // Auto-load campaigns on mount
  useEffect(() => {
    if (state.campaigns.length === 0 && !state.isLoading) {
      actions.loadCampaigns();
    }
  }, []);

  // Computed values
  const activeCampaigns = state.campaigns.filter(c => c.status === 'running');
  const completedCampaigns = state.campaigns.filter(c => c.status === 'completed');
  const draftCampaigns = state.campaigns.filter(c => c.status === 'draft');
  
  const totalMetrics = state.campaigns.reduce(
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
    totalMetrics.avgSuccessRate = totalMetrics.avgSuccessRate / state.campaigns.length;
  }

  // Helper functions
  const getCampaignById = (id: string) => {
    return state.campaigns.find(c => c.id === id);
  };

  const getCampaignsByType = (type: Campaign['type']) => {
    return state.campaigns.filter(c => c.type === type);
  };

  const getRecentCampaigns = (limit: number = 5) => {
    return [...state.campaigns]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  };

  const canExecuteCampaign = (campaignId: string) => {
    const campaign = getCampaignById(campaignId);
    return campaign?.status === 'draft' && !state.activeExecution;
  };

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