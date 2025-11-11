import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useConditionsWithTreatability = () => {
  return useQuery({
    queryKey: ['conditions-with-treatability'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_conditions_with_treatability');
      
      if (error) throw error;
      return data;
    }
  });
};
