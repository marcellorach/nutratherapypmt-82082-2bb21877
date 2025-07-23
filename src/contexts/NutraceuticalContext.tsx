
import React, { createContext, useContext, ReactNode } from 'react';
import { useNutraceuticalManager } from '@/hooks/nutraceuticals/useNutraceuticalManager';

interface NutraceuticalContextType {
  nutraceuticals: any[];
  outcomes: any[];
  conditions: any[];
  studies: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  createNutraceutical: (data: any) => Promise<any>;
  updateNutraceutical: (id: string, data: any) => Promise<any>;
  deleteNutraceutical: (id: string) => Promise<void>;
  createOutcome: (data: any) => Promise<any>;
  createCondition: (data: any) => Promise<any>;
  createStudy: (data: any) => Promise<any>;
  associateStudyToNutraceutical: (nutraceuticalId: string, studyId: string) => Promise<void>;
  associateNutraceuticalToCondition: (nutraceuticalId: string, conditionId: string) => Promise<void>;
}

const NutraceuticalContext = createContext<NutraceuticalContextType | undefined>(undefined);

interface NutraceuticalProviderProps {
  children: ReactNode;
}

export const NutraceuticalProvider: React.FC<NutraceuticalProviderProps> = ({ children }) => {
  const managerData = useNutraceuticalManager();

  return (
    <NutraceuticalContext.Provider value={managerData}>
      {children}
    </NutraceuticalContext.Provider>
  );
};

export const useNutraceuticalContext = () => {
  const context = useContext(NutraceuticalContext);
  if (context === undefined) {
    throw new Error('useNutraceuticalContext must be used within a NutraceuticalProvider');
  }
  return context;
};
