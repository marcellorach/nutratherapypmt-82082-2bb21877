import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Campaign {
  id: string;
  name: string;
  type: 'mass_update' | 'batch_analysis' | 'roi_optimization';
  status: 'draft' | 'running' | 'completed' | 'failed';
  target: string;
  criteria: any;
  results?: any;
  metrics?: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CampaignMetrics {
  totalProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  roiImpact: number;
  estimatedSavings: number;
}

export interface CampaignExecution {
  campaignId: string;
  progress: number;
  currentStep: string;
  logs: ExecutionLog[];
  startTime?: Date;
  endTime?: Date;
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

// State
interface CampaignState {
  campaigns: Campaign[];
  activeExecution: CampaignExecution | null;
  isLoading: boolean;
  error: string | null;
  selectedCampaign: Campaign | null;
}

// Actions
type CampaignAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CAMPAIGNS'; payload: Campaign[] }
  | { type: 'ADD_CAMPAIGN'; payload: Campaign }
  | { type: 'UPDATE_CAMPAIGN'; payload: { id: string; updates: Partial<Campaign> } }
  | { type: 'DELETE_CAMPAIGN'; payload: string }
  | { type: 'SET_SELECTED_CAMPAIGN'; payload: Campaign | null }
  | { type: 'START_EXECUTION'; payload: CampaignExecution }
  | { type: 'UPDATE_EXECUTION'; payload: Partial<CampaignExecution> }
  | { type: 'END_EXECUTION' }
  | { type: 'ADD_EXECUTION_LOG'; payload: ExecutionLog };

// Reducer
const campaignReducer = (state: CampaignState, action: CampaignAction): CampaignState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'ADD_CAMPAIGN':
      return { 
        ...state, 
        campaigns: [...state.campaigns, action.payload] 
      };
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === action.payload.id
            ? { ...campaign, ...action.payload.updates, updatedAt: new Date() }
            : campaign
        )
      };
    case 'DELETE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.filter(campaign => campaign.id !== action.payload)
      };
    case 'SET_SELECTED_CAMPAIGN':
      return { ...state, selectedCampaign: action.payload };
    case 'START_EXECUTION':
      return { ...state, activeExecution: action.payload };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        activeExecution: state.activeExecution
          ? { ...state.activeExecution, ...action.payload }
          : null
      };
    case 'END_EXECUTION':
      return { ...state, activeExecution: null };
    case 'ADD_EXECUTION_LOG':
      return {
        ...state,
        activeExecution: state.activeExecution
          ? {
              ...state.activeExecution,
              logs: [...state.activeExecution.logs, action.payload]
            }
          : null
      };
    default:
      return state;
  }
};

// Initial state
const initialState: CampaignState = {
  campaigns: [],
  activeExecution: null,
  isLoading: false,
  error: null,
  selectedCampaign: null,
};

// Context
interface CampaignContextType {
  state: CampaignState;
  actions: {
    loadCampaigns: () => void;
    createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Campaign>;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
    deleteCampaign: (id: string) => void;
    selectCampaign: (campaign: Campaign | null) => void;
    executeCampaign: (campaignId: string) => Promise<void>;
    stopExecution: () => void;
    addExecutionLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => void;
  };
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// Provider
interface CampaignProviderProps {
  children: ReactNode;
}

export const CampaignProvider: React.FC<CampaignProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  const actions = {
    loadCampaigns: () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock data - substituir por chamada real da API
      setTimeout(() => {
        const mockCampaigns: Campaign[] = [
          {
            id: '1',
            name: 'Otimização ROI Q4',
            type: 'roi_optimization',
            status: 'completed',
            target: 'Nutracêuticos com baixo ROI',
            criteria: { roiThreshold: 0.15 },
            metrics: {
              totalProcessed: 156,
              successRate: 94.2,
              avgProcessingTime: 2.3,
              roiImpact: 23.5,
              estimatedSavings: 45000
            },
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
            completedAt: new Date('2024-01-20')
          },
          {
            id: '2',
            name: 'Análise Batch - Condições Cardíacas',
            type: 'batch_analysis',
            status: 'running',
            target: 'Pets com condições cardíacas',
            criteria: { conditions: ['heart_disease', 'hypertension'] },
            metrics: {
              totalProcessed: 89,
              successRate: 96.1,
              avgProcessingTime: 1.8,
              roiImpact: 18.3,
              estimatedSavings: 23000
            },
            createdAt: new Date('2024-01-25'),
            updatedAt: new Date()
          }
        ];
        
        dispatch({ type: 'SET_CAMPAIGNS', payload: mockCampaigns });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 1000);
    },

    createCampaign: async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock creation - substituir por chamada real da API
      const newCampaign: Campaign = {
        ...campaignData,
        id: `campaign_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setTimeout(() => {
        dispatch({ type: 'ADD_CAMPAIGN', payload: newCampaign });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 500);
      
      return newCampaign;
    },

    updateCampaign: (id: string, updates: Partial<Campaign>) => {
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: { id, updates } });
    },

    deleteCampaign: (id: string) => {
      dispatch({ type: 'DELETE_CAMPAIGN', payload: id });
    },

    selectCampaign: (campaign: Campaign | null) => {
      dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
    },

    executeCampaign: async (campaignId: string) => {
      const execution: CampaignExecution = {
        campaignId,
        progress: 0,
        currentStep: 'Iniciando...',
        logs: [],
        startTime: new Date()
      };
      
      dispatch({ type: 'START_EXECUTION', payload: execution });
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: { id: campaignId, updates: { status: 'running' } } });
      
      // Mock execution steps
      const steps = [
        'Validando critérios...',
        'Carregando dados...',
        'Processando nutracêuticos...',
        'Calculando métricas...',
        'Finalizando...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        dispatch({ 
          type: 'UPDATE_EXECUTION', 
          payload: { 
            progress: ((i + 1) / steps.length) * 100,
            currentStep: steps[i]
          } 
        });
        
        dispatch({
          type: 'ADD_EXECUTION_LOG',
          payload: {
            id: `log_${Date.now()}_${i}`,
            level: 'info',
            message: steps[i],
            timestamp: new Date()
          }
        });
      }
      
      // Complete execution
      dispatch({ type: 'UPDATE_EXECUTION', payload: { endTime: new Date() } });
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: { id: campaignId, updates: { status: 'completed', completedAt: new Date() } } });
      
      setTimeout(() => {
        dispatch({ type: 'END_EXECUTION' });
      }, 2000);
    },

    stopExecution: () => {
      if (state.activeExecution) {
        dispatch({ 
          type: 'UPDATE_CAMPAIGN', 
          payload: { 
            id: state.activeExecution.campaignId, 
            updates: { status: 'failed' } 
          } 
        });
        dispatch({ type: 'END_EXECUTION' });
      }
    },

    addExecutionLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
      const newLog: ExecutionLog = {
        ...log,
        id: `log_${Date.now()}`,
        timestamp: new Date()
      };
      dispatch({ type: 'ADD_EXECUTION_LOG', payload: newLog });
    }
  };

  return (
    <CampaignContext.Provider value={{ state, actions }}>
      {children}
    </CampaignContext.Provider>
  );
};

// Hook
export const useCampaignContext = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  return context;
};