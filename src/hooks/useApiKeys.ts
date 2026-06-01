import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApiKeyRow {
  id: string;
  key_name: string;
  source_id: string;
  description: string | null;
  is_set: boolean;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_test_message: string | null;
  updated_at: string;
}

export function useApiKeys() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['api-keys-public'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('api_keys_public')
        .select('*')
        .order('key_name');
      if (error) throw error;
      return ((data ?? []) as unknown) as ApiKeyRow[];
    },
    staleTime: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['api-keys-public'] });
    qc.invalidateQueries({ queryKey: ['external-sources-status'] });
  };

  const save = useMutation({
    mutationFn: async (payload: { key_name: string; source_id: string; value: string; description?: string }) => {
      const { data, error } = await supabase.functions.invoke('api-keys-manage', {
        body: { action: 'set', ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (key_name: string) => {
      const { data, error } = await supabase.functions.invoke('api-keys-manage', {
        body: { action: 'delete', key_name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: invalidate,
  });

  const test = useMutation({
    mutationFn: async (key_name: string) => {
      const { data, error } = await supabase.functions.invoke('api-keys-manage', {
        body: { action: 'test', key_name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: boolean; message: string };
    },
    onSuccess: invalidate,
  });

  return { list, save, remove, test };
}