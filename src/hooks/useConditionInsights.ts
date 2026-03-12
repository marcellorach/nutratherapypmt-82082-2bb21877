import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConditionTreatment {
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  extraction_confidence: number;
  evidence_level: string;
  study_id: string;
}

export interface CausalLink {
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  extraction_confidence: number;
}

export interface ConditionMechanism {
  subject_name: string;
  predicate: string;
  object_name: string;
  extraction_confidence: number;
}

export interface ConditionInsight {
  condition: string;
  treatments: ConditionTreatment[];
  modulators?: ConditionTreatment[];
  mechanisms: ConditionMechanism[];
  causalLinks: CausalLink[];
}

export interface SynergisticCompound {
  compound: string;
  conditionsTreated: string[];
  coverageCount: number;
}

export interface ConditionInsightsData {
  conditionInsights: ConditionInsight[];
  causalPathways: CausalLink[];
  synergisticCompounds: SynergisticCompound[];
}

export function useConditionInsights(conditions: any[] | undefined) {
  return useQuery({
    queryKey: ['condition-insights', conditions?.map((c: any) => c.condition_name).join(',')],
    queryFn: async (): Promise<ConditionInsightsData> => {
      if (!conditions || conditions.length === 0) {
        return { conditionInsights: [], causalPathways: [], synergisticCompounds: [] };
      }

      const { data, error } = await supabase.functions.invoke('condition-insights', {
        body: { conditions },
      });

      if (error) throw error;
      return data as ConditionInsightsData;
    },
    enabled: !!conditions && conditions.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
