import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildPermissionMap,
  canAccessTab,
  hasPermissionIn,
  type EffectivePermissionRow,
  type PermissionLevel,
  type PermissionMap,
} from './usePermissions.pure';

export const PERMISSIONS_QUERY_KEY = ['effective-permissions'] as const;

/**
 * Effective permissions of the signed-in user, read from the database
 * (my_effective_permissions). The server is always the source of truth:
 * this cache is short-lived and invalidated in realtime whenever the grid,
 * the individual exceptions or the user's roles change.
 */
export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...PERMISSIONS_QUERY_KEY, user?.id ?? 'anonymous'],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<EffectivePermissionRow[]> => {
      const { data, error } = await supabase.rpc('my_effective_permissions');
      if (error) throw error;
      return (data ?? []) as EffectivePermissionRow[];
    },
  });

  // Realtime invalidation — a revoked permission disappears without a reload.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('permission-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => {
        queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_permission_overrides' },
        () => {
          queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const map: PermissionMap = useMemo(() => buildPermissionMap(query.data), [query.data]);

  return {
    permissions: map,
    rows: query.data ?? [],
    loading: authLoading || query.isLoading,
    error: query.error as Error | null,
    refresh: () => queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY }),
    can: (key: string, level: PermissionLevel = 'view') => hasPermissionIn(map, key, level),
    canTab: (tabId: string, level: PermissionLevel = 'view') => canAccessTab(map, tabId, level),
  };
};

/** Invalidate the permission cache from anywhere (e.g. after editing the grid). */
export const invalidatePermissions = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
