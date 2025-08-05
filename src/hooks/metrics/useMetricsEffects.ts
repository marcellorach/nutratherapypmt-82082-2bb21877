import { useEffect, useCallback } from 'react';
import { useMetricsContext } from '@/contexts/MetricsContext';

/**
 * Hook para gerenciar efeitos colaterais das métricas
 */
export const useMetricsEffects = () => {
  const { state, actions } = useMetricsContext();

  // Auto-load metrics on mount
  useEffect(() => {
    if (!state.lastUpdated && !state.isLoading) {
      actions.refreshAllMetrics();
    }
  }, [state.lastUpdated, state.isLoading, actions.refreshAllMetrics]);

  // Auto-refresh stale data
  const refreshStaleData = useCallback(() => {
    const now = new Date();
    const lastUpdate = state.lastUpdated;
    
    if (lastUpdate) {
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      // Refresh if data is older than 4 hours
      if (hoursSinceUpdate > 4 && !state.isLoading) {
        actions.refreshAllMetrics();
      }
    }
  }, [state.lastUpdated, state.isLoading, actions.refreshAllMetrics]);

  // Setup auto-refresh interval
  useEffect(() => {
    const interval = setInterval(refreshStaleData, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [refreshStaleData]);

  // Refresh on filter changes
  useEffect(() => {
    const delayedRefresh = setTimeout(() => {
      if (state.lastUpdated) {
        actions.refreshAllMetrics();
      }
    }, 500);

    return () => clearTimeout(delayedRefresh);
  }, [state.filters, actions.refreshAllMetrics]);

  return {
    isDataFresh: () => {
      if (!state.lastUpdated) return false;
      const hoursSinceUpdate = (new Date().getTime() - state.lastUpdated.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate < 1;
    },
    isDataStale: () => {
      if (!state.lastUpdated) return true;
      const hoursSinceUpdate = (new Date().getTime() - state.lastUpdated.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate > 4;
    },
    timeSinceLastUpdate: state.lastUpdated 
      ? Math.floor((new Date().getTime() - state.lastUpdated.getTime()) / (1000 * 60))
      : null,
  };
};