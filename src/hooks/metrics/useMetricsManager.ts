import { useEffect, useMemo } from 'react';
import { useMetricsContext } from '@/contexts/MetricsContext';
import type { ROIMetrics, PerformanceMetrics, TimeSeriesData } from '@/contexts/MetricsContext';

/**
 * Hook personalizado para gerenciar métricas com lógica de negócio
 */
export const useMetricsManager = () => {
  const { state, actions } = useMetricsContext();

  // Auto-load metrics on mount
  useEffect(() => {
    if (!state.lastUpdated) {
      actions.refreshAllMetrics();
    }
  }, []);

  // Computed values
  const roiStatus = useMemo(() => {
    const { roi } = state.roiMetrics;
    if (roi >= 100) return 'excellent';
    if (roi >= 50) return 'good';
    if (roi >= 20) return 'moderate';
    return 'poor';
  }, [state.roiMetrics.roi]);

  const performanceStatus = useMemo(() => {
    const { successRate, errorRate } = state.performanceMetrics;
    if (successRate >= 95 && errorRate <= 2) return 'excellent';
    if (successRate >= 90 && errorRate <= 5) return 'good';
    if (successRate >= 80 && errorRate <= 10) return 'moderate';
    return 'poor';
  }, [state.performanceMetrics]);

  // Trends calculation
  const roiTrend = useMemo(() => {
    const roiData = state.timeSeriesData.filter(d => d.metric === 'roi');
    if (roiData.length < 2) return 'stable';
    
    const recent = roiData.slice(-7); // últimos 7 dias
    const older = roiData.slice(-14, -7); // 7 dias anteriores
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }, [state.timeSeriesData]);

  // Helper functions
  const getMetricsByDateRange = (startDate: Date, endDate: Date) => {
    return state.timeSeriesData.filter(data => {
      const dataDate = new Date(data.date);
      return dataDate >= startDate && dataDate <= endDate;
    });
  };

  const getTopPerformingMetrics = (limit: number = 5) => {
    const grouped = state.timeSeriesData.reduce((acc, data) => {
      if (!acc[data.metric]) {
        acc[data.metric] = [];
      }
      acc[data.metric].push(data.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped)
      .map(([metric, values]) => ({
        metric,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: values.length,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, limit);
  };

  const formatROI = (roi: number): string => {
    return `${roi.toFixed(1)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPaybackPeriod = (months: number): string => {
    if (months === Infinity) return 'Nunca';
    if (months < 1) return `${Math.round(months * 30)} dias`;
    if (months < 12) return `${months.toFixed(1)} meses`;
    return `${(months / 12).toFixed(1)} anos`;
  };

  // Validation functions
  const isMetricsDataFresh = (): boolean => {
    if (!state.lastUpdated) return false;
    const now = new Date();
    const diffInHours = (now.getTime() - state.lastUpdated.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24; // Considera fresh se atualizado nas últimas 24h
  };

  const hasMinimumDataForAnalysis = (): boolean => {
    return state.timeSeriesData.length >= 7; // Mínimo 7 pontos de dados
  };

  return {
    // State
    roiMetrics: state.roiMetrics,
    performanceMetrics: state.performanceMetrics,
    timeSeriesData: state.timeSeriesData,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Computed values
    roiStatus,
    performanceStatus,
    roiTrend,
    
    // Actions
    loadROIMetrics: actions.loadROIMetrics,
    loadPerformanceMetrics: actions.loadPerformanceMetrics,
    loadTimeSeriesData: actions.loadTimeSeriesData,
    updateFilters: actions.updateFilters,
    refreshAllMetrics: actions.refreshAllMetrics,
    calculateROI: actions.calculateROI,
    calculatePaybackPeriod: actions.calculatePaybackPeriod,
    
    // Helper functions
    getMetricsByDateRange,
    getTopPerformingMetrics,
    formatROI,
    formatCurrency,
    formatPaybackPeriod,
    isMetricsDataFresh,
    hasMinimumDataForAnalysis,
  };
};