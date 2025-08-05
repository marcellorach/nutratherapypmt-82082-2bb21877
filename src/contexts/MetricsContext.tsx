import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Types
export interface ROIMetrics {
  totalInvestment: number;
  totalSavings: number;
  roi: number;
  paybackPeriod: number; // em meses
  netBenefit: number;
}

export interface PerformanceMetrics {
  successRate: number;
  averageProcessingTime: number;
  errorRate: number;
  throughput: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  metric: string;
}

export interface MetricsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  campaigns?: string[];
  nutraceuticals?: string[];
  conditions?: string[];
}

export interface MetricsState {
  roiMetrics: ROIMetrics;
  performanceMetrics: PerformanceMetrics;
  timeSeriesData: TimeSeriesData[];
  filters: MetricsFilter;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export type MetricsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROI_METRICS'; payload: ROIMetrics }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_TIME_SERIES_DATA'; payload: TimeSeriesData[] }
  | { type: 'SET_FILTERS'; payload: MetricsFilter }
  | { type: 'UPDATE_LAST_UPDATED' };

// Initial state
const initialState: MetricsState = {
  roiMetrics: {
    totalInvestment: 0,
    totalSavings: 0,
    roi: 0,
    paybackPeriod: 0,
    netBenefit: 0,
  },
  performanceMetrics: {
    successRate: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    throughput: 0,
  },
  timeSeriesData: [],
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
      end: new Date(),
    },
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Reducer
const metricsReducer = (state: MetricsState, action: MetricsAction): MetricsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ROI_METRICS':
      return { ...state, roiMetrics: action.payload, lastUpdated: new Date() };
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload, lastUpdated: new Date() };
    case 'SET_TIME_SERIES_DATA':
      return { ...state, timeSeriesData: action.payload, lastUpdated: new Date() };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'UPDATE_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };
    default:
      return state;
  }
};

// Context
interface MetricsContextType {
  state: MetricsState;
  actions: {
    loadROIMetrics: () => Promise<void>;
    loadPerformanceMetrics: () => Promise<void>;
    loadTimeSeriesData: (metric: string) => Promise<void>;
    updateFilters: (filters: Partial<MetricsFilter>) => void;
    refreshAllMetrics: () => Promise<void>;
    calculateROI: (investment: number, savings: number) => number;
    calculatePaybackPeriod: (investment: number, monthlySavings: number) => number;
  };
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Provider
interface MetricsProviderProps {
  children: ReactNode;
}

export const MetricsProvider: React.FC<MetricsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(metricsReducer, initialState);

  // Mock API calls - substituir por chamadas reais à API
  const loadROIMetrics = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockROIMetrics: ROIMetrics = {
        totalInvestment: 150000,
        totalSavings: 320000,
        roi: 113.33,
        paybackPeriod: 5.6,
        netBenefit: 170000,
      };

      dispatch({ type: 'SET_ROI_METRICS', payload: mockROIMetrics });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar métricas de ROI' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadPerformanceMetrics = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockPerformanceMetrics: PerformanceMetrics = {
        successRate: 94.2,
        averageProcessingTime: 2.3,
        errorRate: 5.8,
        throughput: 850,
      };

      dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: mockPerformanceMetrics });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar métricas de performance' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadTimeSeriesData = useCallback(async (metric: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Gerar dados temporais mock
      const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: Math.random() * 100 + 50,
          metric,
        };
      });

      dispatch({ type: 'SET_TIME_SERIES_DATA', payload: mockTimeSeriesData });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados temporais' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateFilters = useCallback((filters: Partial<MetricsFilter>) => {
    dispatch({ 
      type: 'SET_FILTERS', 
      payload: { ...state.filters, ...filters } 
    });
  }, [state.filters]);

  const refreshAllMetrics = useCallback(async () => {
    await Promise.all([
      loadROIMetrics(),
      loadPerformanceMetrics(),
      loadTimeSeriesData('roi'),
    ]);
  }, [loadROIMetrics, loadPerformanceMetrics, loadTimeSeriesData]);

  // Utility functions
  const calculateROI = useCallback((investment: number, savings: number): number => {
    if (investment === 0) return 0;
    return ((savings - investment) / investment) * 100;
  }, []);

  const calculatePaybackPeriod = useCallback((investment: number, monthlySavings: number): number => {
    if (monthlySavings === 0) return Infinity;
    return investment / monthlySavings;
  }, []);

  const contextValue: MetricsContextType = {
    state,
    actions: {
      loadROIMetrics,
      loadPerformanceMetrics,
      loadTimeSeriesData,
      updateFilters,
      refreshAllMetrics,
      calculateROI,
      calculatePaybackPeriod,
    },
  };

  return (
    <MetricsContext.Provider value={contextValue}>
      {children}
    </MetricsContext.Provider>
  );
};

// Hook
export const useMetricsContext = (): MetricsContextType => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetricsContext deve ser usado dentro de um MetricsProvider');
  }
  return context;
};