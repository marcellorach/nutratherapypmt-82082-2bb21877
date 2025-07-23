
import React, { createContext, useContext, ReactNode } from 'react';
import { useNutraceuticalManager } from '@/hooks/nutraceuticals/useNutraceuticalManager';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';

interface NutraceuticalContextType {
  nutraceuticals: any[];
  conditions: any[];
  outcomes: any[];
  ingredients: any[];
  studies: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  createNutraceutical: (data: any) => void;
  updateNutraceutical: (id: string, data: any) => void;
  deleteNutraceutical: (id: string) => void;
  createOutcome: (data: any) => void;
  createCondition: (data: any) => void;
  createStudy: (data: any) => void;
  associateStudyToNutraceutical: (studyId: string, nutraceuticalId: string, relevanceScore: number) => Promise<any>;
  associateNutraceuticalToCondition: (nutraceuticalId: string, conditionId: string, relationshipType: "prevention" | "treatment" | "support", efficacyScore: number, notes?: string) => Promise<any>;
}

const NutraceuticalContext = createContext<NutraceuticalContextType | undefined>(undefined);

interface NutraceuticalProviderProps {
  children: ReactNode;
}

export const NutraceuticalProvider: React.FC<NutraceuticalProviderProps> = ({ children }) => {
  const managerData = useNutraceuticalManager();
  const { conditions } = useConditions();

  const contextValue = {
    ...managerData,
    conditions: conditions || []
  };

  return (
    <NutraceuticalContext.Provider value={contextValue}>
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
